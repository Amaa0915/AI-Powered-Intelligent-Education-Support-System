"""
EduGuide Attendance ML Service
Runs on port 8001 — provides ARIMA/LSTM forecasting + contextual analysis
"""
import os, warnings
from datetime import datetime, timedelta
from collections import defaultdict

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

warnings.filterwarnings('ignore')

# ─── Config ───────────────────────────────────────────────────────────────────
_base = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_base, '..', 'attendance_api', '.env'))

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/student_attendance')
PORT = int(os.getenv('ML_PORT', 8001))

app = Flask(__name__)
CORS(app)

# ─── MongoDB ──────────────────────────────────────────────────────────────────
_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    return _client['student_attendance']

# ─── Shared constants ────────────────────────────────────────────────────────
MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
DOW_ORDER    = ['Monday','Tuesday','Wednesday','Thursday','Friday']
DIST_ORDER   = ['Nearby','Moderate','Far','Very Far']

WEATHER_ADJ = {'sunny':1.5,'cloudy':0.0,'rainy':-4.0,'windy':-1.5,'stormy':-6.0,'foggy':-2.0}

SL_EVENTS = {
    'exam':          (+3.5, 'Exam period — high attendance expected',        'green'),
    'term_start':    (+2.0, 'Start of term — high motivation',               'green'),
    'sports_meet':   (-2.5, 'Sports day — some students may skip classes',   'yellow'),
    'prize_giving':  (+1.5, 'Prize giving — students tend to attend',        'green'),
    'teachers_day':  (-1.0, "Teacher's Day — partial attendance",            'yellow'),
    'childrens_day': (+4.0, "Children's Day — high attendance",              'green'),
    'sil_camp':      (-3.0, 'SIL Camp — many students away',                 'orange'),
    'normal':        ( 0.0, 'Normal school day',                             'green'),
    'before_sports': (-1.5, 'Day before sports meet',                        'yellow'),
    'after_sports':  (-1.0, 'Day after sports meet',                         'yellow'),
    'before_prize':  (+1.0, 'Day before prize giving',                       'green'),
    'after_prize':   (-0.5, 'Day after prize giving',                        'green'),
    'term_end':      (-2.0, 'End of term — some early departures',           'yellow'),
}

def dist_band(km):
    km = float(km)
    if km < 6.75:   return 'Nearby'
    if km < 13:     return 'Moderate'
    if km < 19.25:  return 'Far'
    return 'Very Far'

def dist_adj(km):
    b = dist_band(km)
    return {'Nearby':0.0,'Moderate':-1.0,'Far':-2.5,'Very Far':-4.5}[b]

# ─── ARIMA helper ─────────────────────────────────────────────────────────────
def run_arima(series, steps, order=(2,1,2)):
    from statsmodels.tsa.arima.model import ARIMA as _ARIMA
    series = [float(v) for v in series]
    if len(series) < 4:
        last = float(np.mean(series)) if series else 75.0
        return series, [round(last,2)]*steps, list(order), False
    for o in [order,(1,1,1),(1,0,1),(0,1,0),(1,0,0)]:
        try:
            m = _ARIMA(series, order=o).fit()
            fc = list(np.round(np.clip(m.forecast(steps=steps), 0, 100), 2))
            return series, fc, list(o), True
        except Exception:
            continue
    last = float(series[-1])
    return series, [round(last,2)]*steps, [0,0,0], False

# ─── Holt-Winters (LSTM proxy) ────────────────────────────────────────────────
def run_hw(series, steps):
    from statsmodels.tsa.holtwinters import ExponentialSmoothing as _ES
    arr = np.clip([float(v) for v in series], 0, 100)
    if len(arr) < 4:
        last = float(np.mean(arr)) if len(arr) else 75.0
        return list(arr), [round(last,2)]*steps, False
    try:
        trend    = 'add' if len(arr) >= 6  else None
        seasonal = 'add' if len(arr) >= 14 else None
        sp       = 12    if len(arr) >= 24 else None
        m = _ES(arr, trend=trend, seasonal=seasonal, seasonal_periods=sp).fit(optimized=True)
        fc = list(np.round(np.clip(m.forecast(steps), 0, 100), 2))
        return list(np.round(arr,2).tolist()), fc, True
    except Exception:
        last = float(np.mean(arr))
        return list(arr), [round(last,2)]*steps, False

# ─── Monthly series from MongoDB ─────────────────────────────────────────────
def get_monthly_series(student_id=None):
    db = get_db()
    match = {'year':{'$gt':0},'month':{'$gt':0}}
    if student_id:
        match['student_id'] = student_id
    pipeline = [
        {'$match': match},
        {'$group': {'_id':{'year':'$year','month':'$month'},
                    'total':{'$sum':1},
                    'present':{'$sum':{'$cond':[{'$eq':['$status','Present']},1,0]}}}},
        {'$sort': {'_id.year':1,'_id.month':1}},
    ]
    rows = list(db.attendances.aggregate(pipeline))
    result = []
    for r in rows:
        if r['total'] > 0:
            rate  = round(r['present']/r['total']*100, 2)
            label = f"{MONTH_LABELS[r['_id']['month']-1]} {r['_id']['year']}"
            result.append({'year':r['_id']['year'],'month':r['_id']['month'],'rate':rate,'label':label})
    return result

# ─── Build forecast date list ────────────────────────────────────────────────
def build_fc_dates(last_year, last_month, fc_values):
    items, yr, mo = [], last_year, last_month
    for val in fc_values:
        mo += 1
        if mo > 12: mo, yr = 1, yr+1
        items.append({'date':f"{MONTH_LABELS[mo-1]} {yr}",
                      'label':f"{MONTH_LABELS[mo-1]} {yr}",
                      'predicted_rate':round(float(np.clip(val,0,100)),2)})
    return items

# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH / INFO
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/health')
def health():
    try:
        db  = get_db()
        cnt = db.attendances.estimated_document_count()
        return jsonify({'status':'ok','records':cnt,'ml_service':'online','model_exists':True})
    except Exception as e:
        return jsonify({'status':'error','error':str(e),'ml_service':'online'})

@app.route('/model/info')
def model_info():
    monthly = get_monthly_series()
    return jsonify({'n_monthly_points':len(monthly),
                    'models':['ExponentialSmoothing (LSTM proxy)','ARIMA','GradientBoostingRegressor'],
                    'model_exists':True})

# ═══════════════════════════════════════════════════════════════════════════════
# FORECAST — LSTM (ExponentialSmoothing proxy)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/predict/lstm', methods=['POST'])
def predict_lstm():
    body  = request.get_json() or {}
    steps = int(body.get('steps', 30))
    monthly = get_monthly_series()
    if len(monthly) < 3:
        return jsonify({'error':'Not enough monthly data'}), 422
    rates = [m['rate'] for m in monthly]
    _, fc, converged = run_hw(rates, steps)
    last = monthly[-1]
    look_back = min(int(len(rates)*0.4), 12)
    return jsonify({
        'steps': steps, 'order': [], 'look_back': look_back, 'converged': converged,
        'historical': [{'label':m['label'],'rate':m['rate']} for m in monthly],
        'forecast': build_fc_dates(last['year'], last['month'], fc),
        'meta': {'input_shape':f'({look_back},1)', 'model':'ExponentialSmoothing'},
    })

# ═══════════════════════════════════════════════════════════════════════════════
# FORECAST — ARIMA (global)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/predict/arima', methods=['POST'])
def predict_arima():
    body  = request.get_json() or {}
    steps = int(body.get('steps', 12))
    order = tuple(body.get('order', [2,1,2]))
    monthly = get_monthly_series()
    if len(monthly) < 3:
        return jsonify({'error':'Not enough monthly data'}), 422
    rates = [m['rate'] for m in monthly]
    _, fc, order_used, converged = run_arima(rates, steps, order)
    last = monthly[-1]
    return jsonify({
        'steps': steps, 'order': order_used, 'look_back': None, 'converged': converged,
        'historical': [{'label':m['label'],'rate':m['rate']} for m in monthly],
        'forecast': build_fc_dates(last['year'], last['month'], fc),
        'meta': {'model':f'ARIMA{tuple(order_used)}'},
    })

# ═══════════════════════════════════════════════════════════════════════════════
# FORECAST — ARIMA (per student)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/predict/student', methods=['POST'])
def predict_student():
    body       = request.get_json() or {}
    student_id = body.get('student_id','')
    steps      = int(body.get('steps', 6))
    monthly    = get_monthly_series(student_id)
    if not monthly or len(monthly) < 2:
        return jsonify({'error':f'Student {student_id} not found or insufficient data'}), 404
    rates = [m['rate'] for m in monthly]
    order = (1,1,1) if len(rates) < 8 else (2,1,2)
    _, fc, order_used, converged = run_arima(rates, steps, order)
    # Derive last month/year from label
    parts = monthly[-1]['label'].split()
    mo_idx = MONTH_LABELS.index(parts[0]) + 1
    yr = int(parts[1])
    fc_items = []
    for val in fc:
        mo_idx += 1
        if mo_idx > 12: mo_idx, yr = 1, yr+1
        fc_items.append({'date':f"{MONTH_LABELS[mo_idx-1]} {yr}",
                         'label':f"{MONTH_LABELS[mo_idx-1]} {yr}",
                         'predicted_rate':round(float(np.clip(val,0,100)),2)})
    return jsonify({
        'steps':steps,'order':order_used,'look_back':None,'converged':converged,
        'historical':monthly,'forecast':fc_items,
        'meta':{'model':f'ARIMA{tuple(order_used)}_student'},
    })

# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXTUAL IMPACT
# ═══════════════════════════════════════════════════════════════════════════════
def _agg_field(db, field, match=None):
    pipeline = []
    if match:
        pipeline.append({'$match': match})
    pipeline.append({'$group':{
        '_id': f'${field}',
        'total': {'$sum':1},
        'present':{'$sum':{'$cond':[{'$eq':['$status','Present']},1,0]}},
    }})
    return list(db.attendances.aggregate(pipeline))

def _build_impact(db, match=None):
    weather_raw = _agg_field(db,'weather_condition', match)
    weather_impact = sorted(
        [{'condition':r['_id'],'rate':round(r['present']/r['total']*100,2),'total':r['total']}
         for r in weather_raw if r['_id'] and r['total']>0],
        key=lambda x: -x['rate'])

    hol_raw = _agg_field(db,'is_holiday', match)
    holiday_impact = [
        {'is_holiday':bool(r['_id']),'rate':round(r['present']/r['total']*100,2),'total':r['total']}
        for r in hol_raw if r['total']>0]

    event_raw = _agg_field(db,'school_event', match)
    event_impact = sorted(
        [{'event':r['_id'],'rate':round(r['present']/r['total']*100,2),'total':r['total']}
         for r in event_raw if r['_id'] and r['total']>0],
        key=lambda x: -x['rate'])

    dow_raw = _agg_field(db,'day_of_week', match)
    dow_impact = sorted(
        [{'day':r['_id'],'rate':round(r['present']/r['total']*100,2),'total':r['total']}
         for r in dow_raw if r['_id'] and r['total']>0],
        key=lambda x: DOW_ORDER.index(x['day']) if x['day'] in DOW_ORDER else 99)

    pipeline_m = []
    if match:
        pipeline_m.append({'$match':match})
    pipeline_m += [
        {'$group':{'_id':'$month','total':{'$sum':1},
                   'present':{'$sum':{'$cond':[{'$eq':['$status','Present']},1,0]}}}},
        {'$sort':{'_id':1}},
    ]
    month_raw = list(db.attendances.aggregate(pipeline_m))
    monthly_impact = [
        {'month':r['_id'],'rate':round(r['present']/r['total']*100,2),'total':r['total']}
        for r in month_raw if r['_id'] and r['total']>0]

    dist_raw = _agg_field(db,'distance_band', match)
    dist_impact = sorted(
        [{'band':r['_id'],'rate':round(r['present']/r['total']*100,2),'total':r['total']}
         for r in dist_raw if r['_id'] and r['total']>0],
        key=lambda x: DIST_ORDER.index(x['band']) if x['band'] in DIST_ORDER else 99)

    return {'weather_impact':weather_impact,'holiday_impact':holiday_impact,
            'event_impact':event_impact,'dow_impact':dow_impact,
            'monthly_impact':monthly_impact,'distance_impact':dist_impact}

@app.route('/contextual/impact')
def contextual_impact():
    return jsonify(_build_impact(get_db()))

@app.route('/contextual/student-impact', methods=['POST'])
def student_impact():
    body       = request.get_json() or {}
    student_id = body.get('student_id','')
    if not student_id:
        return jsonify({'error':'student_id required'}), 400
    return jsonify(_build_impact(get_db(), match={'student_id':student_id}))

# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXTUAL PREDICTION — GradientBoosting
# ═══════════════════════════════════════════════════════════════════════════════
_gb_cache = None   # (model, le_weather, le_event, le_dow, le_dist)

def _get_global_gb():
    global _gb_cache
    if _gb_cache is None:
        _gb_cache = _train_gb(get_db())
    return _gb_cache

def _train_gb(db, match=None):
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import LabelEncoder

    proj = {'status':1,'weather_condition':1,'school_event':1,'day_of_week':1,
            'distance_band':1,'is_holiday':1,'temperature':1,'month':1,'distance_km':1,'_id':0}
    q = match or {}
    records = list(db.attendances.find(q, proj, limit=15000))
    df = pd.DataFrame(records)
    if df.empty or len(df) < 10:
        return None

    le_w = LabelEncoder(); le_e = LabelEncoder(); le_d = LabelEncoder(); le_b = LabelEncoder()
    df['w_enc'] = le_w.fit_transform(df['weather_condition'].fillna('sunny'))
    df['e_enc'] = le_e.fit_transform(df['school_event'].fillna('normal'))
    df['d_enc'] = le_d.fit_transform(df['day_of_week'].fillna('Monday'))
    df['b_enc'] = le_b.fit_transform(df['distance_band'].fillna('Nearby'))
    df['hol']   = df['is_holiday'].fillna(False).astype(int)
    df['temp']  = pd.to_numeric(df['temperature'],  errors='coerce').fillna(28)
    df['mon']   = pd.to_numeric(df['month'],         errors='coerce').fillna(6)
    df['dkm']   = pd.to_numeric(df['distance_km'],   errors='coerce').fillna(5)
    df['y']     = (df['status'] == 'Present').astype(int)

    feats = ['w_enc','e_enc','d_enc','b_enc','hol','temp','mon','dkm']
    X, y  = df[feats].values, df['y'].values
    model = GradientBoostingRegressor(n_estimators=120, max_depth=4,
                                      learning_rate=0.1, random_state=42)
    model.fit(X, y)
    return model, le_w, le_e, le_d, le_b

def _safe_enc(le, val, default=0):
    try:    return int(le.transform([val])[0])
    except: return default

def _predict_one(bundle, inp):
    if bundle is None: return 75.0
    model, le_w, le_e, le_d, le_b = bundle
    w_enc = _safe_enc(le_w, inp.get('weather','sunny'))
    e_enc = _safe_enc(le_e, inp.get('school_event','normal'))
    d_enc = _safe_enc(le_d, inp.get('dow_str','Monday'))
    b_str = dist_band(float(inp.get('distance_km',5)))
    b_enc = _safe_enc(le_b, b_str)
    X = np.array([[w_enc, e_enc, d_enc, b_enc,
                   int(inp.get('is_holiday',False)),
                   float(inp.get('temperature',28)),
                   int(inp.get('month',6)),
                   float(inp.get('distance_km',5))]])
    return round(float(np.clip(model.predict(X)[0]*100, 0, 100)), 2)

_FEAT_NAMES = ['Weather','School Event','Day of Week','Distance Band',
               'Is Holiday','Temperature','Month','Distance (km)']
_WEATHER_SWEEP = ['sunny','cloudy','rainy','windy']
_EVENT_SWEEP   = ['normal','exam','term_start','term_end','sports_meet',
                  'prize_giving','teachers_day','childrens_day','sil_camp']
_DIST_SWEEP    = [('Nearby',3),('Moderate',10),('Far',16),('Very Far',22)]

def _sweeps(bundle, inp):
    weather_cmp   = [{'condition':w,'predicted_rate':_predict_one(bundle,{**inp,'weather':w})}
                     for w in _WEATHER_SWEEP]
    event_cmp     = [{'event':e,'predicted_rate':_predict_one(bundle,{**inp,'school_event':e})}
                     for e in _EVENT_SWEEP]
    dist_cmp      = [{'band':b,'predicted_rate':_predict_one(bundle,{**inp,'distance_km':km})}
                     for b,km in _DIST_SWEEP]
    r0 = _predict_one(bundle, {**inp,'is_holiday':False})
    r1 = _predict_one(bundle, {**inp,'is_holiday':True})
    holiday_cmp = {'without_holiday':r0,'with_holiday':r1,'holiday_impact':round(r1-r0,2)}
    if bundle:
        model = bundle[0]
        fi = sorted([{'feature':_FEAT_NAMES[i],'importance':round(float(model.feature_importances_[i]),4)}
                     for i in range(len(_FEAT_NAMES))], key=lambda x:-x['importance'])
    else:
        fi = []
    return weather_cmp, event_cmp, dist_cmp, holiday_cmp, fi

@app.route('/contextual/predict', methods=['POST'])
def contextual_predict():
    body = request.get_json() or {}
    dow  = body.get('day_of_week', 0)
    if isinstance(dow, int):
        dow_str = DOW_ORDER[dow] if 0 <= dow < 5 else 'Monday'
    else:
        dow_str = str(dow)
    inp = {**body, 'dow_str': dow_str}

    bundle = _get_global_gb()
    pred   = _predict_one(bundle, inp)
    wc, ec, dc, hc, fi = _sweeps(bundle, inp)

    # Overall historical rate
    db = get_db()
    total   = db.attendances.estimated_document_count()
    present = db.attendances.count_documents({'status':'Present'})
    hist    = round(present/total*100,2) if total else None

    return jsonify({
        'predicted_attendance_rate': pred,
        'historical_rate':           hist,
        'weather_comparison':        wc,
        'event_comparison':          ec,
        'distance_comparison':       dc,
        'holiday_comparison':        hc,
        'feature_importance':        fi,
        'fallback': False,
    })

@app.route('/contextual/predict-student', methods=['POST'])
def contextual_predict_student():
    body       = request.get_json() or {}
    student_id = body.get('student_id','')
    dow        = body.get('day_of_week', 0)
    if isinstance(dow, int):
        dow_str = DOW_ORDER[dow] if 0 <= dow < 5 else 'Monday'
    else:
        dow_str = str(dow)
    inp = {**body, 'dow_str': dow_str}

    db = get_db()
    if not student_id:
        return contextual_predict()

    proj = {'status':1,'weather_condition':1,'school_event':1,'day_of_week':1,
            'distance_band':1,'is_holiday':1,'temperature':1,'month':1,'distance_km':1,'_id':0}
    records = list(db.attendances.find({'student_id':student_id}, proj))
    s = db.students.find_one({'student_id':student_id},{'attendance_rate':1,'distance_km':1,'distance_band':1})

    fallback = len(records) < 20
    if fallback:
        bundle = _get_global_gb()
    else:
        bundle = _train_gb(db, match={'student_id':student_id})

    pred = _predict_one(bundle, inp)
    wc, ec, dc, hc, fi = _sweeps(bundle, inp)

    # For student mode, rename comparison keys to *_scan
    return jsonify({
        'predicted_attendance_rate': pred,
        'historical_rate': s['attendance_rate'] if s else None,
        'student_id': student_id,
        'distance_band': s.get('distance_band') if s else None,
        'distance_km':   s.get('distance_km')   if s else None,
        'weather_scan':  wc,
        'event_scan':    ec,
        'distance_scan': dc,
        'holiday_comparison': hc,
        'feature_importance': fi,
        'fallback': fallback,
    })

# ═══════════════════════════════════════════════════════════════════════════════
# GUEST TREND — ARIMA + contextual adjustments for new students
# ═══════════════════════════════════════════════════════════════════════════════
SEV_MAP = {
    'green':  ('On Track',  '✅'),
    'yellow': ('Watch',     '⚠️'),
    'orange': ('Risk',      '🔶'),
    'red':    ('High Risk', '🚨'),
}

def _sev_color(rate):
    if rate >= 85: return 'green'
    if rate >= 75: return 'yellow'
    if rate >= 65: return 'orange'
    return 'red'

@app.route('/predict/guest-trend', methods=['POST'])
def guest_trend():
    body            = request.get_json() or {}
    series          = [int(v) for v in body.get('attendance_series', [1]*30)]
    forecast_days   = int(body.get('forecast_days', 14))
    weather         = body.get('weather', 'sunny')
    temperature     = float(body.get('temperature', 28))
    distance_km     = float(body.get('distance_km', 5))
    upcoming_events = body.get('upcoming_events', [])  # [{date,event,is_holiday}]

    n = len(series)
    hist_rate = round(sum(series)/n*100, 2) if n else 75.0

    # Weekly aggregates (5 chunks of 6 days from 30-day history)
    historical_weekly = []
    for i in range(5):
        chunk = series[i*6:(i+1)*6]
        rate  = round(sum(chunk)/len(chunk)*100, 2) if chunk else hist_rate
        historical_weekly.append({'label': f'W-{5-i}', 'rate': rate})

    # ARIMA on weekly history
    weekly_rates = [w['rate'] for w in historical_weekly]
    _, fc_weekly, order_used, converged = run_arima(weekly_rates, max(3, forecast_days//5+3), (1,1,1))

    # Context baselines
    w_adj   = WEATHER_IMPACT_GET(weather)
    d_adj   = dist_adj(distance_km)
    db_str  = dist_band(distance_km)
    temp_adj_val = -1.5 if temperature > 35 else (-1.0 if temperature < 15 else 0.0)

    # Human-readable descriptions
    _w_desc = {
        'sunny':  'Sunny weather — favorable conditions, attendance above average',
        'cloudy': 'Overcast skies — neutral, no significant attendance impact',
        'rainy':  'Rain typically reduces attendance significantly',
        'windy':  'Windy conditions — minor attendance drop',
        'stormy': 'Storms cause major attendance drops',
        'foggy':  'Foggy weather — moderate attendance reduction',
    }
    _d_desc = {
        'Nearby':   'Home is close — distance has minimal impact',
        'Moderate': 'Moderate distance — slight risk on bad weather days',
        'Far':      'Far from school — attendance drops on rough days',
        'Very Far': 'Very far from school — significant attendance risk',
    }
    _t_desc = ('High temperature may discourage attendance' if temperature > 35
               else 'Cold weather may affect the commute' if temperature < 15
               else 'Comfortable temperature — no significant attendance impact')
    d_desc = _d_desc[db_str]

    # ── factor_summary: each key is an object with {name, delta, description}
    factor_summary = {
        'weather': {
            'name':        weather.capitalize(),
            'delta':       round(w_adj, 1),
            'description': _w_desc.get(weather.lower(), 'Weather conditions affecting attendance'),
        },
        'temperature': {
            'name':        f'{temperature}°C',
            'delta':       round(temp_adj_val, 1),
            'description': _t_desc,
        },
        'distance': {
            'name':        db_str,
            'band':        db_str,
            'delta':       round(d_adj, 1),
            'description': d_desc,
        },
        # Legacy flat fields kept for the summary card
        'weather_delta':          round(w_adj, 1),
        'distance_delta':         round(d_adj, 1),
        'total_contextual_delta': round(w_adj + d_adj + temp_adj_val, 1),
    }

    # Build event lookup by date
    event_map = {ev.get('date',''):ev for ev in upcoming_events}

    forecast = []
    total_adj_sum = 0.0
    start_date = datetime.today()

    for i in range(forecast_days):
        day_date = start_date + timedelta(days=i+1)
        date_str = day_date.strftime('%Y-%m-%d')
        day_name = day_date.strftime('%A')

        week_idx  = min(i//5, len(fc_weekly)-1)
        arima_val = float(np.clip(fc_weekly[week_idx] if fc_weekly else hist_rate, 0, 100))

        event_adj_val = 0.0
        is_holiday    = False
        event_name    = 'normal'
        if date_str in event_map:
            ev            = event_map[date_str]
            event_name    = ev.get('event','normal')
            is_holiday    = bool(ev.get('is_holiday', False))
            event_adj_val = SL_EVENTS.get(event_name,(0.0,'','green'))[0]
            if is_holiday:
                event_adj_val -= 5.0

        total_adj  = w_adj + d_adj + event_adj_val + temp_adj_val
        total_adj_sum += total_adj
        adj_rate   = round(float(np.clip(arima_val + total_adj, 0, 100)), 2)
        ci_spread  = max(3.0, 15.0 - i*0.4)

        forecast.append({
            'date':          date_str,
            'day':           day_name,
            'arima_rate':    round(arima_val, 2),
            'adjusted_rate': adj_rate,
            'ci_lower':      round(max(0, adj_rate - ci_spread), 2),
            'ci_upper':      round(min(100, adj_rate + ci_spread), 2),
            'event':         event_name,
            'is_holiday':    is_holiday,
        })

    avg_ctx_delta = round(total_adj_sum / max(forecast_days, 1), 2)
    factor_summary['total_contextual_delta'] = avg_ctx_delta

    # Weekly explanation cards
    context_explanations = []
    for w_idx in range(min(4, (forecast_days+6)//7)):
        week = forecast[w_idx*7:(w_idx+1)*7]
        if not week: break
        avg_rate = round(float(np.mean([d['adjusted_rate'] for d in week])), 1)
        sev_c    = _sev_color(avg_rate)
        sev, emoji = SEV_MAP[sev_c]

        events_seen = [d['event'] for d in week if d['event'] != 'normal']
        hols_seen   = sum(1 for d in week if d['is_holiday'])

        if hols_seen:
            headline = f'{hols_seen} holiday day(s) this week — expect attendance dip'
        elif 'exam' in events_seen:
            headline = 'Exam period — attendance likely to surge'
        elif any('sports' in e for e in events_seen):
            headline = 'Sports activities — moderate attendance risk'
        elif weather.lower() == 'rainy':
            headline = 'Rainy weather may reduce attendance this week'
        elif avg_rate < 75:
            headline = 'Distance and weather creating attendance risk'
        else:
            headline = 'Standard week — no major contextual disruptions'

        # factors: always include weather, temperature, distance — plus events/holidays if present
        factors_objs = [
            {'icon': '☀️', 'name': f'Weather ({weather.capitalize()})', 'delta': round(w_adj, 1)},
            {'icon': '🌡️', 'name': f'Temperature ({temperature}°C)',    'delta': round(temp_adj_val, 1)},
            {'icon': '📍', 'name': f'Distance ({db_str})',              'delta': round(d_adj, 1)},
        ]
        if events_seen:
            ev_adj_avg = round(sum(SL_EVENTS.get(e,(0,))[0] for e in events_seen) / len(events_seen), 1)
            factors_objs.append({'icon':'📅', 'name':f'Events ({", ".join(set(events_seen))})', 'delta': ev_adj_avg})
        if hols_seen:
            factors_objs.append({'icon':'🎌', 'name':f'{hols_seen} Holiday day(s)', 'delta': -5.0})

        # details: bullet strings shown under headline
        details = []
        details.append(d_desc)
        if events_seen:
            for e in set(events_seen):
                details.append(SL_EVENTS.get(e, (0,'',''))[1])
        if abs(w_adj) > 0.5:
            details.append(_w_desc.get(weather.lower(), ''))

        arima_avg = round(float(np.mean([d['arima_rate'] for d in week])), 1)
        start_d   = week[0]['date'][5:]
        end_d     = week[-1]['date'][5:]

        context_explanations.append({
            'week':           w_idx+1,
            'period':         f'{start_d} — {end_d}',
            'avg_rate':       avg_rate,
            'expected_range': f'{round(avg_rate-5,1)}–{round(avg_rate+5,1)}%',
            'severity':       sev,
            'severity_emoji': emoji,
            'severity_color': sev_c,
            'headline':       headline,
            'factors':        factors_objs,
            'details':        [d for d in details if d],
            'description': (
                f"{d_desc} ARIMA base ~{arima_avg}%, "
                f"adjusted to {avg_rate}% after contextual factors."
            ),
        })

    return jsonify({
        'historical_rate':      hist_rate,
        'historical_weekly':    historical_weekly,
        'forecast':             forecast,
        'distance_band':        db_str,
        'factor_summary':       factor_summary,
        'context_explanations': context_explanations,
        'arima_order':          order_used,
        'converged':            converged,
    })

# Helper — avoids name collision with the dict constant at module level
def WEATHER_IMPACT_GET(w):
    return WEATHER_ADJ.get(w.lower(), 0.0)

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print(f'🤖  EduGuide ML Service  →  http://localhost:{PORT}')
    print(f'📡  MongoDB: {MONGO_URI[:40]}...')
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
