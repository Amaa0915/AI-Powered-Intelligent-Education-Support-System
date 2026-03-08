"""
Retrain the risk predictor using only features that can be computed
from the student submission form (no synthetic risk score columns).
This fixes the "always Medium Risk" problem caused by attendance_risk_score,
academic_risk_score and behavioral_risk_score always being 0 for new inputs.
"""
import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "comprehensive_risk_dataset_1000_complete.csv")

# ── 1. Load raw per-year CSV ──────────────────────────────────────────────────
print("Loading dataset...")
df_raw = pd.read_csv(CSV_PATH)
print(f"Raw rows: {len(df_raw)}  |  Columns: {df_raw.columns.tolist()}")
print("Risk category distribution (raw):\n", df_raw['risk_category'].value_counts())

# ── 2. Engineer one row per student (mimics what the API does) ────────────────
def engineer_student(group):
    group = group.sort_values(['year', 'grade']).reset_index(drop=True)
    last  = group.iloc[-1].copy()

    # Subject marks
    subject_cols = ['Mathematics_score','Science_score','English_score',
                    'History_score','Sinhala_score','Buddhism_score',
                    'Geography_score','ICT_score']
    scores = [last.get(c, 0) for c in subject_cols if c in last.index and pd.notna(last.get(c, 0))]
    if scores:
        last['min_score']  = min(scores)
        last['max_score']  = max(scores)
        last['score_std']  = float(np.std(scores))
        last['weak_subjects']    = sum(1 for s in scores if s < 50)
        last['failing_subjects'] = sum(1 for s in scores if s < 35)
    else:
        # Use existing score_std / weak_subjects from CSV if available
        if pd.isna(last.get('score_std', np.nan)):
            last['score_std'] = 0
        if pd.isna(last.get('weak_subjects', np.nan)):
            last['weak_subjects'] = 0
        if pd.isna(last.get('failing_subjects', np.nan)):
            last['failing_subjects'] = 0

    # Trend features (difference between last and previous year)
    if len(group) > 1:
        last['attendance_trend']  = group['attendance_rate'].iloc[-1] - group['attendance_rate'].iloc[-2]
        last['performance_trend'] = group['avg_score'].iloc[-1]       - group['avg_score'].iloc[-2]
        last['study_hours_trend'] = group['study_hours_per_week'].iloc[-1] - group['study_hours_per_week'].iloc[-2]
    else:
        last['attendance_trend'] = last['performance_trend'] = last['study_hours_trend'] = 0.0

    # Derived composites (computable from form data)
    hw_comp = last.get('homework_completion_rate', 0.7)
    hw_time = last.get('homework_on_time_rate',    0.7)
    cw_comp = last.get('classwork_completion_rate',0.8)
    lms_eng = last.get('lms_engagement_score',     0.7)
    par_eng = last.get('parent_engagement_score',  0.7)
    iq      = float(last.get('iq_level', 100))
    study_h = float(last.get('study_hours_per_week', 5))
    att     = float(last.get('attendance_rate', 80))
    avg     = float(last.get('avg_score', 50))
    std     = float(last.get('score_std',  0))

    last['homework_discipline']  = float(hw_comp) * 0.5 + float(hw_time) * 0.5
    last['overall_engagement']   = (float(hw_comp) * 0.25 + float(cw_comp) * 0.25 +
                                    float(lms_eng)  * 0.25 + float(par_eng) * 0.25)
    last['academic_consistency'] = 1.0 / (std + 1.0)
    last['critical_attendance']  = 1 if att < 75 else 0
    last['failing_performance']  = 1 if avg < 40 else 0
    last['multiple_weak_subjects'] = 1 if last.get('weak_subjects', 0) >= 3 else 0
    last['low_parental_support']   = 1 if float(par_eng) < 0.5 else 0
    last['attendance_performance_product'] = att * avg / 100.0
    last['iq_study_interaction']   = iq * study_h / 100.0
    last['risk_momentum']          = (-last['attendance_trend'] * 0.5) + (-last['performance_trend'] * 0.5)
    last['days_present']           = att * 200 / 100.0   # assume 200-day school year

    return last

print("\nEngineering per-student features...")
student_rows = []
for sid, grp in df_raw.groupby('student_id'):
    row = engineer_student(grp)
    student_rows.append(row)

df = pd.DataFrame(student_rows).reset_index(drop=True)
print(f"Engineered students: {len(df)}")
print("Risk distribution after engineering:\n", df['risk_category'].value_counts())

# ── 3. Select ONLY features we can compute from the form ─────────────────────
FEATURES = [
    # Primary academic
    'attendance_rate', 'days_present', 'avg_score', 'score_std',
    'min_score', 'max_score', 'failing_subjects', 'weak_subjects',
    # Study behaviour (from form)
    'study_hours_per_week', 'iq_level',
    'homework_completion_rate', 'homework_on_time_rate',
    # Trend features (computed from multi-year data)
    'attendance_trend', 'performance_trend', 'study_hours_trend',
    # Derived composites
    'homework_discipline', 'overall_engagement', 'academic_consistency',
    'attendance_performance_product', 'iq_study_interaction', 'risk_momentum',
    # Binary flags
    'critical_attendance', 'failing_performance',
    'multiple_weak_subjects', 'low_parental_support',
]

# Keep only cols that exist in df
FEATURES = [f for f in FEATURES if f in df.columns]
print(f"\nUsing {len(FEATURES)} features: {FEATURES}")

TARGET = 'risk_category'
df = df.dropna(subset=[TARGET])
df[FEATURES] = df[FEATURES].fillna(0)

X = df[FEATURES].astype(float)
y = df[TARGET]

print("\nTarget distribution:\n", y.value_counts())

# ── 4. Encode labels ─────────────────────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)
print("Label classes:", le.classes_)

# ── 5. Train / test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

# ── 6. Train RandomForest with balanced class weights ────────────────────────
print("\nTraining RandomForest...")
rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    class_weight='balanced',   # handles class imbalance
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

cv_scores = cross_val_score(rf, X, y_enc, cv=5, scoring='f1_macro')
print(f"\n5-fold CV macro-F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ── 7. Save artefacts ─────────────────────────────────────────────────────────
scaler = StandardScaler()
scaler.fit(X_train)   # save for potential future use, not applied by RF

joblib.dump(rf,     os.path.join(BASE_DIR, 'model_random_forest.pkl'))
joblib.dump(scaler, os.path.join(BASE_DIR, 'feature_scaler.pkl'))
joblib.dump(le,     os.path.join(BASE_DIR, 'label_encoder.pkl'))

with open(os.path.join(BASE_DIR, 'feature_names.txt'), 'w') as fh:
    fh.write('\n'.join(FEATURES))

print("\n✅ Saved:")
print(f"   model_random_forest.pkl  ({len(FEATURES)} features)")
print(f"   label_encoder.pkl        classes={list(le.classes_)}")
print(f"   feature_names.txt")

# ── 8. Quick sanity-check: simulate 3 extreme students ───────────────────────
print("\n--- Sanity checks ---")
def make_row(att, avg, study, iq, hw, g8, g9, g10):
    scores = [g10]*6
    att_trend  = g10  - g9
    perf_trend = g10  - g9
    return pd.DataFrame([{
        'attendance_rate': att, 'days_present': att*2,
        'avg_score': avg, 'score_std': np.std([g8,g9,g10]),
        'min_score': min(scores), 'max_score': max(scores),
        'failing_subjects': sum(1 for s in scores if s < 35),
        'weak_subjects': sum(1 for s in scores if s < 50),
        'study_hours_per_week': study, 'iq_level': iq,
        'homework_completion_rate': hw, 'homework_on_time_rate': hw+0.05,
        'attendance_trend': att_trend, 'performance_trend': perf_trend,
        'study_hours_trend': 0,
        'homework_discipline': hw*0.5+(hw+0.05)*0.5,
        'overall_engagement': hw*0.25+0.8*0.25+0.7*0.25+0.7*0.25,
        'academic_consistency': 1/(np.std([g8,g9,g10])+1),
        'attendance_performance_product': att*avg/100,
        'iq_study_interaction': iq*study/100,
        'risk_momentum': (-att_trend*0.5)+(-perf_trend*0.5),
        'critical_attendance': 1 if att < 75 else 0,
        'failing_performance': 1 if avg < 40 else 0,
        'multiple_weak_subjects': 1 if sum(1 for s in scores if s < 50) >= 3 else 0,
        'low_parental_support': 0,
    }], columns=FEATURES)[FEATURES].fillna(0).astype(float)

test_cases = [
    ("HIGH RISK",   make_row(60, 32, 2, 75, 0.2, 40, 35, 28)),
    ("MEDIUM RISK", make_row(80, 62, 8, 100, 0.65, 65, 60, 60)),
    ("LOW RISK",    make_row(95, 88, 15, 130, 0.95, 85, 87, 90)),
]
for label, row in test_cases:
    pred = le.inverse_transform(rf.predict(row))[0]
    prob = rf.predict_proba(row)[0]
    print(f"  Expected {label:15s} → Predicted: {pred}  "
          f"(Low={prob[list(le.classes_).index('Low Risk')]:.2f}  "
          f"Med={prob[list(le.classes_).index('Medium Risk')]:.2f}  "
          f"High={prob[list(le.classes_).index('High Risk')]:.2f})")
