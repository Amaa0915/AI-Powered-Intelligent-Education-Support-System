"""
EduGuide — Unified Backend (Single Port: 8000)
Combines: Learning Path API + Stress Prediction + Risk Predictor
"""

import os
import sys
import random
import string
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId

# ── Add learning_path package to Python path ───────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, 'learning_path'))

from core import analysis
from core.mongodb_handler import mongodb_handler
from models.student import (
    StudentSummary, LearningPath, NewStudentInput,
    ClusterDistribution, NewStudentInputExtended, StudentFullProfile
)

# ── Load .env for Gemini key ───────────────────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, 'stress_ml', '.env'))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_client = None
GEMINI_MODEL = "gemini-2.5-flash"
if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini AI connected")
    except Exception as e:
        print(f"⚠️ Gemini init failed: {e}")

# ── Load ML Models ─────────────────────────────────────────────
print("Loading ML models...")
stress_model = joblib.load(os.path.join(BASE_DIR, 'stress_ml', 'stress_level_model_final.pkl'))
print("✅ Stress model loaded")

risk_model         = joblib.load(os.path.join(BASE_DIR, 'risk_predictor', 'model_random_forest.pkl'))
risk_scaler        = joblib.load(os.path.join(BASE_DIR, 'risk_predictor', 'feature_scaler.pkl'))
risk_label_encoder = joblib.load(os.path.join(BASE_DIR, 'risk_predictor', 'label_encoder.pkl'))
with open(os.path.join(BASE_DIR, 'risk_predictor', 'feature_names.txt')) as f:
    risk_feature_names = f.read().strip().split('\n')
df_risk = pd.read_csv(os.path.join(BASE_DIR, 'risk_predictor', 'comprehensive_risk_dataset_1000_complete.csv'))
print("✅ Risk predictor models loaded")

# ── MongoDB connections ────────────────────────────────────────
# Stress predictions DB (replaces Node/Mongoose)
try:
    stress_mongo    = MongoClient("mongodb+srv://admin:1234@paf.spi8fnl.mongodb.net/stress_predictions", serverSelectionTimeoutMS=5000)
    stress_db       = stress_mongo['stress_predictions']
    predictions_col = stress_db['predictions']
    stress_mongo.admin.command('ping')
    print("✅ Stress MongoDB connected")
except Exception as e:
    print(f"⚠️ Stress MongoDB failed: {e}")
    predictions_col = None

# Risk predictor DB
try:
    risk_mongo       = MongoClient("mongodb://admin:1234@ac-d11ealg-shard-00-00.spi8fnl.mongodb.net:27017,ac-d11ealg-shard-00-01.spi8fnl.mongodb.net:27017,ac-d11ealg-shard-00-02.spi8fnl.mongodb.net:27017/?ssl=true&replicaSet=atlas-g0x1t5-shard-0&authSource=admin&retryWrites=true&w=majority", serverSelectionTimeoutMS=5000)
    risk_db          = risk_mongo['student_risk_db']
    students_risk_col = risk_db['students']
    risk_mongo.admin.command('ping')
    print("✅ Risk MongoDB connected")
except Exception as e:
    print(f"⚠️ Risk MongoDB failed: {e}")
    students_risk_col = None

# ── FastAPI App ────────────────────────────────────────────────
app = FastAPI(title="EduGuide Unified API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup: load CSV data for learning path ───────────────────
@app.on_event("startup")
async def startup_event():
    data_path = os.path.join(BASE_DIR, 'data', 'academic_performance_1000_students_with_iq_study_hours.csv')
    if os.path.exists(data_path):
        analysis.load_data(data_path)
        print("✅ Learning path dataset loaded")
    else:
        print(f"⚠️ Dataset not found at {data_path}")

# ══════════════════════════════════════════════════════════════
#  SECTION 1: LEARNING PATH ROUTES (was FastAPI port 8000)
# ══════════════════════════════════════════════════════════════

def generate_student_id():
    ts     = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"STU{ts}{suffix}"

@app.get("/")
async def root():
    return {"message": "EduGuide Unified API — all systems OK", "port": 8000}

@app.get("/students", response_model=List[StudentSummary])
async def get_students():
    return analysis.get_all_students_summary()

@app.get("/students/{student_id}", response_model=LearningPath)
async def get_student(student_id: str):
    data = analysis.get_student_details(student_id)
    if not data:
        raise HTTPException(status_code=404, detail="Student not found")
    return data

@app.get("/clusters", response_model=List[ClusterDistribution])
async def get_clusters():
    try:
        return analysis.get_cluster_distribution()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/students/add")
async def add_student(student: NewStudentInput):
    try:
        generated_id = generate_student_id() if not student.student_id.strip() else student.student_id.strip().upper()
        weak_analysis   = mongodb_handler.identify_weak_subjects_and_recommend(student.subject_scores, threshold=60)
        weekly_schedule = mongodb_handler.generate_weekly_schedule("Science")
        study_materials = mongodb_handler.recommend_study_materials("Science")
        al_path         = mongodb_handler.suggest_al_path("Science")

        student_doc = {
            "student_id": generated_id, "name": generated_id, "age": 16,
            "current_grade": 11, "interested_stream": "Science",
            "strengths": [], "weaknesses": list(weak_analysis['weak_subjects'].keys()),
            "iq_level": student.iq_level, "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate, "student_type": student.student_type,
            "subject_scores": student.subject_scores,
            "weak_subject_analysis": weak_analysis,
            "weekly_schedule": weekly_schedule, "recommended_materials": study_materials,
            "al_path": al_path,
            "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()
        }
        mongodb_id = None
        if mongodb_handler.connected and mongodb_handler.students_collection is not None:
            try:
                res = mongodb_handler.students_collection.insert_one(student_doc)
                mongodb_id = str(res.inserted_id)
            except Exception:
                pass

        analysis_result = analysis.add_new_student({
            "student_id": generated_id, "iq_level": student.iq_level,
            "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate, "student_type": student.student_type,
            "subject_scores": student.subject_scores
        })
        return {
            "success": True,
            "message": "Student added!" + (" (MongoDB)" if mongodb_id else " (Offline)"),
            "student_id": generated_id, "mongodb_id": mongodb_id,
            "cluster": analysis_result.get('cluster'), "avg_score": analysis_result.get('avg_score'),
            "weak_subjects": weak_analysis['weak_subjects'],
            "recommendations": weak_analysis['recommendations'],
            "overall_advice": weak_analysis['overall_advice']
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/students/add-extended")
async def add_student_extended(student: NewStudentInputExtended):
    try:
        result = mongodb_handler.add_student_with_recommendations(student.dict())
        ar = analysis.add_new_student({
            "student_id": student.student_id, "iq_level": student.iq_level,
            "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate, "student_type": student.student_type,
            "subject_scores": student.subject_scores
        })
        result['cluster'] = ar.get('cluster')
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/students/mongodb/{student_id}", response_model=StudentFullProfile)
async def get_student_mongodb(student_id: str):
    student = mongodb_handler.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in MongoDB")
    return student

@app.get("/attendance")
async def get_attendance():
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    data = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first'),
        avg_score=('score', 'mean'),
        student_type=('student_type', 'first')
    ).reset_index()
    return data.to_dict(orient='records')

# ──────────────────────────────────────────────────────────────
#  ATTENDANCE TREND ANALYZER ENDPOINTS
# ──────────────────────────────────────────────────────────────

@app.get("/api/attendance/overview")
async def attendance_overview():
    """Summary statistics for attendance across all students."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first'),
        avg_score=('score', 'mean'),
        student_type=('student_type', 'first'),
        iq_level=('iq_level', 'first'),
        study_hours=('study_hours_per_week', 'first'),
    ).reset_index()

    total      = len(df)
    avg_att    = round(float(df['attendance_rate'].mean()), 1)
    at_risk    = int((df['attendance_rate'] < 75).sum())
    high_att   = int((df['attendance_rate'] >= 90).sum())
    moderate   = int(((df['attendance_rate'] >= 75) & (df['attendance_rate'] < 90)).sum())
    return {
        "total_students":       total,
        "average_attendance":   avg_att,
        "at_risk_count":        at_risk,
        "high_attendance_count": high_att,
        "moderate_count":       moderate,
        "at_risk_pct":          round(at_risk  / total * 100, 1),
        "high_att_pct":         round(high_att / total * 100, 1),
    }

@app.get("/api/attendance/distribution")
async def attendance_distribution():
    """Count of students in each attendance bracket (10% bands)."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first')
    ).reset_index()

    bins   = [0, 50, 60, 70, 75, 80, 85, 90, 95, 100]
    labels = ['<50%', '50-60%', '60-70%', '70-75%', '75-80%', '80-85%', '85-90%', '90-95%', '95-100%']
    df['bracket'] = pd.cut(df['attendance_rate'], bins=bins, labels=labels, include_lowest=True)
    dist = df['bracket'].value_counts().reindex(labels, fill_value=0).reset_index()
    dist.columns = ['bracket', 'count']
    return dist.to_dict(orient='records')

@app.get("/api/attendance/performance-correlation")
async def attendance_performance_correlation():
    """Attendance rate vs avg score for scatter chart (sampled to 200)."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first'),
        avg_score=('score', 'mean'),
        student_type=('student_type', 'first'),
    ).reset_index()
    sample = df.sample(min(200, len(df)), random_state=42)
    return sample[['student_id', 'attendance_rate', 'avg_score', 'student_type']].rename(
        columns={'avg_score': 'avg_score'}
    ).round(2).to_dict(orient='records')

@app.get("/api/attendance/by-student-type")
async def attendance_by_type():
    """Average attendance & score broken down by student_type."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first'),
        avg_score=('score', 'mean'),
        student_type=('student_type', 'first'),
    ).reset_index()
    grouped = df.groupby('student_type').agg(
        avg_attendance=('attendance_rate', 'mean'),
        avg_score=('avg_score', 'mean'),
        count=('student_id', 'count')
    ).reset_index().round(1)
    return grouped.to_dict(orient='records')

@app.get("/api/attendance/at-risk-students")
async def at_risk_students(threshold: float = 75.0, limit: int = 50):
    """Students below the attendance threshold, ordered by attendance ascending."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.groupby('student_id').agg(
        attendance_rate=('attendance_rate', 'first'),
        avg_score=('score', 'mean'),
        student_type=('student_type', 'first'),
        study_hours=('study_hours_per_week', 'first'),
    ).reset_index()
    at_risk = df[df['attendance_rate'] < threshold].sort_values('attendance_rate').head(limit)
    at_risk = at_risk.round(1)
    return at_risk.to_dict(orient='records')

@app.get("/api/attendance/monthly-trend")
async def attendance_monthly_trend():
    """Aggregate average attendance by year + grade to simulate a trend."""
    if analysis.df_performance is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    df = analysis.df_performance.copy()
    if 'year' in df.columns and 'grade' in df.columns:
        trend = df.groupby(['year', 'grade']).agg(
            avg_attendance=('attendance_rate', 'mean'),
            avg_score=('score', 'mean'),
            student_count=('student_id', 'nunique'),
        ).reset_index().round(1)
        trend['label'] = 'Grade ' + trend['grade'].astype(int).astype(str) + ' (' + trend['year'].astype(int).astype(str) + ')'
        return trend.to_dict(orient='records')
    return []

# ══════════════════════════════════════════════════════════════
#  SECTION 2: STRESS PREDICTION ROUTES (was Express port 5000 + Flask port 5001)
# ══════════════════════════════════════════════════════════════

class StressInput(BaseModel):
    studentId:             Optional[str] = None
    studentName:           Optional[str] = "Student"
    term_mark_avg:         float
    prev_term_mark_avg:    float
    daily_study:           float
    prefer_study:          int
    travel_time:           float
    financial_status:      int
    social_media:          float
    sleep_hours:           float
    attendance:            float
    tuition_hours_per_week: float
    disaster_impact:       int

def _gemini_recommendations(data: dict, stress_level: str) -> List[str]:
    if not gemini_client:
        return ["AI service unavailable. Configure GEMINI_API_KEY in stress_ml/.env"]
    try:
        def cat_perf(v):
            return "excellent" if v >= 75 else "good" if v >= 60 else "fair" if v >= 50 else "needs improvement"
        def cat_sleep(v):
            return "adequate" if v >= 7 else "insufficient" if v >= 5 else "severely insufficient"
        def cat_att(v):
            return "excellent" if v >= 85 else "good" if v >= 75 else "poor" if v >= 60 else "critical"

        prompt = f"""You are an AI student wellbeing advisor. This is anonymized data only.
Student Profile:
- Stress Level: {stress_level}
- Academic Performance: {cat_perf(data['term_mark_avg'])}
- Performance Trend: {'improving' if data['term_mark_avg'] > data['prev_term_mark_avg'] else 'declining' if data['term_mark_avg'] < data['prev_term_mark_avg'] else 'stable'}
- Sleep: {cat_sleep(data['sleep_hours'])}
- Attendance: {cat_att(data['attendance'])}
- Social Media: {'high' if data['social_media'] >= 3 else 'moderate' if data['social_media'] >= 1.5 else 'low'}
- Study: {'high' if data['daily_study'] >= 4 else 'moderate' if data['daily_study'] >= 2 else 'low'}

Provide exactly 5 SHORT actionable recommendations (1-2 sentences each, no emojis).
Format as numbered list: 1. ... 2. ... 3. ... 4. ... 5. ...
End with: Safety Disclaimer: [one sentence]"""

        response = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        recs = []
        for line in response.text.strip().split('\n'):
            line = line.strip()
            if len(line) > 2 and line[0].isdigit() and line[1] == '.':
                recs.append(line.split('.', 1)[1].strip())
        return recs[:5] if len(recs) >= 3 else ["AI response parsing error. Please retry."]
    except Exception as e:
        print(f"Gemini error: {e}")
        if any(k in str(e) for k in ["429", "RESOURCE_EXHAUSTED", "quota"]):
            return ["Gemini API daily quota exhausted. Stress prediction still works above.",
                    "Quota resets at midnight Pacific Time.",
                    "General tip: Maintain 7-9 hours sleep and take regular study breaks."]
        return ["AI service temporarily unavailable."]

@app.post("/api/predict")
async def predict_stress(body: StressInput):
    data = body.dict()
    student_id = data.pop('studentId', None)
    data.pop('studentName', None)

    features = np.array([[
        data["term_mark_avg"], data["prev_term_mark_avg"], data["daily_study"],
        data["prefer_study"], data["travel_time"], data["financial_status"],
        data["social_media"], data["sleep_hours"], data["attendance"],
        data["tuition_hours_per_week"], data["disaster_impact"]
    ]])

    pred        = stress_model.predict(features)[0]
    labels      = {0: "Good", 1: "Bad", 2: "Awful"}
    stress_level = labels[int(pred)]
    ai_recs      = _gemini_recommendations(data, stress_level)

    # Early warning check
    early_warning = {"isHighRisk": False, "consecutiveHighRisk": 0, "lastHighRiskDate": None}
    if student_id and stress_level in ("Bad", "Awful") and predictions_col is not None:
        try:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent = list(predictions_col.find(
                {"studentId": student_id, "timestamp": {"$gte": thirty_days_ago}}
            ).sort("timestamp", -1).limit(5))
            consecutive = 1
            for p in recent:
                if p.get("stressLevel") in ("Bad", "Awful"):
                    consecutive += 1
                else:
                    break
            if consecutive >= 2:
                early_warning = {"isHighRisk": True, "consecutiveHighRisk": consecutive, "lastHighRiskDate": datetime.now().isoformat()}
        except Exception:
            pass

    # Save prediction
    prediction_id = None
    if predictions_col is not None:
        try:
            doc = {
                "studentId": student_id, "inputData": data,
                "stressLevel": stress_level, "predictionCode": int(pred),
                "aiRecommendations": ai_recs, "aiPowered": gemini_client is not None,
                "mainCauses": [], "earlyWarning": early_warning,
                "timestamp": datetime.now(), "interventionTaken": False
            }
            result = predictions_col.insert_one(doc)
            prediction_id = str(result.inserted_id)
        except Exception as e:
            print(f"⚠️ Could not save prediction: {e}")

    return {
        "stress_level": stress_level, "prediction_code": int(pred),
        "ai_recommendations": ai_recs, "main_causes": [],
        "ai_powered": gemini_client is not None,
        "predictionId": prediction_id,
        "earlyWarning": {
            "message": f"EARLY WARNING: {early_warning['consecutiveHighRisk']} consecutive high-risk predictions",
            "consecutiveCount": early_warning['consecutiveHighRisk'],
            "recommendation": "Immediate counselor intervention recommended"
        } if early_warning["isHighRisk"] else None
    }

@app.get("/api/history/{student_id}")
async def get_history(student_id: str, limit: int = 20):
    if predictions_col is None:
        return []
    try:
        docs = list(predictions_col.find({"studentId": student_id}).sort("timestamp", -1).limit(limit))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/high-risk-students")
async def high_risk_students(days: int = 7):
    if predictions_col is None:
        return []
    try:
        threshold = datetime.now() - timedelta(days=days)
        docs = list(predictions_col.find({"stressLevel": {"$in": ["Bad", "Awful"]}, "timestamp": {"$gte": threshold}}).sort("timestamp", -1))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/early-warnings")
async def early_warnings():
    if predictions_col is None:
        return []
    try:
        docs = list(predictions_col.find({"earlyWarning.isHighRisk": True}).sort("timestamp", -1))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard/stats")
async def dashboard_stats():
    if predictions_col is None:
        return {"totalPredictions": 0, "highRiskCount": 0, "earlyWarningCount": 0, "recentPredictions": [], "highRiskPercentage": 0}
    try:
        total    = predictions_col.count_documents({})
        high     = predictions_col.count_documents({"stressLevel": {"$in": ["Bad", "Awful"]}})
        warnings = predictions_col.count_documents({"earlyWarning.isHighRisk": True})
        recent   = list(predictions_col.find().sort("timestamp", -1).limit(10))
        for d in recent:
            d['_id'] = str(d['_id'])
        return {
            "totalPredictions": total, "highRiskCount": high,
            "earlyWarningCount": warnings, "recentPredictions": recent,
            "highRiskPercentage": round((high / total * 100), 2) if total > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{student_id}")
async def delete_history(student_id: str):
    if predictions_col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        result = predictions_col.delete_many({"studentId": student_id})
        return {"message": f"Deleted {result.deleted_count} predictions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  SECTION 3: RISK PREDICTOR ROUTES (was Flask port 5002)
# ══════════════════════════════════════════════════════════════

def _engineer_risk_features(historical_records):
    df = pd.DataFrame(historical_records)
    rename_map = {}
    if 'attendance_percentage' in df.columns and 'attendance_rate' not in df.columns:
        rename_map['attendance_percentage'] = 'attendance_rate'
    if 'average_score' in df.columns and 'avg_score' not in df.columns:
        rename_map['average_score'] = 'avg_score'
    if rename_map:
        df = df.rename(columns=rename_map)

    for col, default in [('attendance_rate', 80), ('avg_score', 50), ('study_hours_per_week', 5), ('iq_level', 100)]:
        if col not in df.columns:
            df[col] = default

    df   = df.sort_values(['year', 'grade']).reset_index(drop=True)
    last = df.iloc[-1].copy()

    if len(df) > 1:
        last['attendance_trend']   = df['attendance_rate'].iloc[-1] - df['attendance_rate'].iloc[-2]
        last['performance_trend']  = df['avg_score'].iloc[-1] - df['avg_score'].iloc[-2]
        last['study_hours_trend']  = df['study_hours_per_week'].iloc[-1] - df['study_hours_per_week'].iloc[-2]
    else:
        last['attendance_trend'] = last['performance_trend'] = last['study_hours_trend'] = 0

    last['homework_discipline'] = last.get('homework_completion_rate', 0) * 0.5 + last.get('homework_on_time_rate', 0) * 0.5
    last['overall_engagement']  = (last.get('homework_completion_rate', 0) * 0.25 +
                                   last.get('classwork_completion_rate', 0) * 0.25 +
                                   last.get('lms_engagement_score', 0) * 0.25 +
                                   last.get('parent_engagement_score', 0) * 0.25)
    last['academic_consistency'] = 1 / (last.get('score_std', 0) + 1)
    last['critical_attendance']  = 1 if last['attendance_rate'] < 75 else 0
    last['failing_performance']  = 1 if last['avg_score'] < 40 else 0
    last['multiple_weak_subjects'] = 1 if last.get('weak_subjects', 0) >= 3 else 0
    last['low_parental_support']   = 1 if last.get('parent_engagement_score', 0) < 0.5 else 0
    last['attendance_performance_product'] = last['attendance_rate'] * last['avg_score'] / 100
    last['iq_study_interaction']   = last['iq_level'] * last['study_hours_per_week'] / 100
    last['risk_momentum']          = (-last['attendance_trend'] * 0.5) + (-last['performance_trend'] * 0.5)
    return last

def _get_risk_student_data(student_id):
    if students_risk_col is not None:
        try:
            records = list(students_risk_col.find({'student_id': student_id}).sort([('grade', 1), ('year', 1)]))
            if records:
                for r in records: r.pop('_id', None)
                return _engineer_risk_features(records)
        except Exception:
            pass
    rows = df_risk[df_risk['student_id'] == student_id]
    if rows.empty:
        return None
    return _engineer_risk_features(rows.to_dict('records'))

def _predict_risk(student_data):
    if isinstance(student_data, dict):
        student_data = pd.Series(student_data)
    features = [float(student_data.get(f, 0) if not pd.isna(student_data.get(f, 0)) else 0) for f in risk_feature_names]
    arr  = np.array([features])
    pred = risk_model.predict(arr)[0]
    prob = risk_model.predict_proba(arr)[0]
    return {
        'risk_category': risk_label_encoder.inverse_transform([pred])[0],
        'low_risk_prob':    float(prob[0]),
        'medium_risk_prob': float(prob[1]),
        'high_risk_prob':   float(prob[2]),
    }

def _risk_recommendations(student_data):
    recs = []
    if float(student_data['attendance_rate']) < 75:
        recs.append("URGENT: Immediate parent meeting required to address attendance")
    elif float(student_data['attendance_rate']) < 85:
        recs.append("Schedule parent meeting to discuss attendance issues")
    if float(student_data['avg_score']) < 40:
        recs.append("URGENT: Immediate academic intervention and remedial classes needed")
    elif float(student_data['avg_score']) < 55:
        recs.append("Enroll in subject-specific tutoring programs")
    if float(student_data['study_hours_per_week']) < 6:
        recs.append("Time management counseling and study plan development needed")
    if not recs:
        recs = ["Continue current performance and maintain consistency",
                "Consider joining advanced academic workshops"]
    return recs

@app.get("/api/risk/{student_id}")
async def get_student_risk(student_id: str):
    try:
        student_data = _get_risk_student_data(student_id)
        if student_data is None:
            try:
                student_data = _get_risk_student_data(int(student_id))
            except (ValueError, TypeError):
                pass
        if student_data is None:
            raise HTTPException(status_code=404, detail="Student not found")

        prediction   = _predict_risk(student_data)
        recommendations = _risk_recommendations(student_data)

        return {
            'student_info': {
                'name': f"Student {student_id}", 'id': student_id,
                'grade': f"{int(student_data['grade'])}-A", 'school': 'Secondary School'
            },
            'risk_assessment': {
                'risk_level': prediction['risk_category'],
                'probabilities': {
                    'low':    prediction['low_risk_prob'],
                    'medium': prediction['medium_risk_prob'],
                    'high':   prediction['high_risk_prob']
                }
            },
            'metrics': {
                'academic_performance': {
                    'value': float(student_data['avg_score']),
                    'status': 'Excellent' if student_data['avg_score'] >= 80 else
                              'Good'      if student_data['avg_score'] >= 60 else
                              'Average'   if student_data['avg_score'] >= 45 else 'Critical'
                },
                'attendance_rate':  {'value': float(student_data['attendance_rate']),   'status': 'Present'},
                'study_habits':     {'value': float(student_data['study_hours_per_week']), 'hours_per_week': float(student_data['study_hours_per_week']), 'status': 'On Track'},
                'health_status':    {'value': str(student_data.get('health_status', 'N/A')).title(), 'status': 'Good'}
            },
            'subject_analysis': {
                'Math':     float(student_data.get('Mathematics_score', 0)),
                'Science':  float(student_data.get('Science_score', 0)),
                'English':  float(student_data.get('English_score', 0)),
                'History':  float(student_data.get('History_score', 0)),
                'Sinhala':  float(student_data.get('Sinhala_score', 0)),
                'Religion': float(student_data.get('Buddhism_score', 0))
            },
            'action_plan': recommendations
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class RiskStudentRecord(BaseModel):
    grade:               int
    year:                int
    attendance_percentage: float
    average_score:       float
    study_hours_per_week: float
    performance_trend:   Optional[str] = "Stable"
    behavior_frequency:  Optional[int] = 0
    subject_marks:       Optional[Dict[str, float]] = {}

class RiskStudentInput(BaseModel):
    student_id: str
    records:    List[RiskStudentRecord]

@app.post("/api/students")
async def save_risk_student(body: RiskStudentInput):
    if students_risk_col is None:
        raise HTTPException(status_code=503, detail="Risk database unavailable")
    try:
        students_risk_col.delete_many({'student_id': body.student_id})
        subject_map = {'mathematics': 'Mathematics_score', 'science': 'Science_score',
                       'english': 'English_score', 'history': 'History_score',
                       'sinhala': 'Sinhala_score', 'buddhism': 'Buddhism_score'}
        trend_map = {'Improving': 5, 'Stable': 0, 'Declining': -5}
        ts = datetime.now()
        transformed = []
        for rec in body.records:
            sm     = rec.subject_marks or {}
            scores = [float(sm.get(k, 0)) for k in subject_map]
            avg    = rec.average_score or (sum(scores) / len(scores) if scores else 0)
            weak   = sum(1 for s in scores if s < 50)
            std    = float(np.std(scores)) if scores else 0
            row = {
                'student_id': body.student_id, 'grade': rec.grade, 'year': rec.year,
                'attendance_rate': rec.attendance_percentage, 'avg_score': float(avg),
                'study_hours_per_week': rec.study_hours_per_week,
                'performance_trend_value': trend_map.get(rec.performance_trend, 0),
                'disciplinary_actions': rec.behavior_frequency,
                **{v: float(sm.get(k, 0)) for k, v in subject_map.items()},
                'weak_subjects': weak, 'failing_subjects': sum(1 for s in scores if s < 35),
                'score_std': std,
                'homework_completion_rate': 0.8, 'classwork_completion_rate': 0.8,
                'lms_engagement_score': 0.7, 'parent_engagement_score': 0.7,
                'iq_level': 100, 'health_status': 'Good', 'homework_on_time_rate': 0.9,
                'has_learning_difficulty': 0, 'extracurricular_participation': 1,
                'travel_time_to_school': 20, 'sleep_hours_per_night': 8,
                'social_media_usage_hours': 1, 'peer_influence_score': 0.5,
                'financial_status_score': 0.8, 'family_support_score': 0.9,
                'teacher_support_score': 0.9, 'school_environment_score': 0.9,
                'counseling_sessions_attended': 0, 'previous_year_fail': 0,
                'resource_availability': 0.9, 'motivation_level': 0.8,
                'standardized_test_score': float(avg), 'created_at': ts
            }
            transformed.append(row)
        result = students_risk_col.insert_many(transformed)
        return {"message": f"Data for {len(transformed)} grades saved", "ids": [str(i) for i in result.inserted_ids]}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}")
async def delete_risk_student(student_id: str):
    if students_risk_col is None:
        raise HTTPException(status_code=503, detail="Risk database unavailable")
    try:
        result = students_risk_col.delete_many({'student_id': student_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"message": f"Deleted {result.deleted_count} records"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
