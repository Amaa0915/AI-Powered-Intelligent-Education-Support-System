from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB Connection
MONGO_URI = "mongodb://admin:1234@ac-d11ealg-shard-00-00.spi8fnl.mongodb.net:27017,ac-d11ealg-shard-00-01.spi8fnl.mongodb.net:27017,ac-d11ealg-shard-00-02.spi8fnl.mongodb.net:27017/?ssl=true&replicaSet=atlas-g0x1t5-shard-0&authSource=admin&retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client['student_risk_db']
students_col    = db['students']
predictions_col = db['risk_predictions']

# Load models and data
print("Loading trained models and data...")
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    best_model = joblib.load(os.path.join(BASE_DIR, 'model_random_forest.pkl'))
    scaler = joblib.load(os.path.join(BASE_DIR, 'feature_scaler.pkl'))
    label_encoder = joblib.load(os.path.join(BASE_DIR, 'label_encoder.pkl'))

    with open(os.path.join(BASE_DIR, 'feature_names.txt'), 'r') as f:
        feature_names = f.read().strip().split('\n')

    df_complete = pd.read_csv(os.path.join(BASE_DIR, 'comprehensive_risk_dataset_1000_complete.csv'))
    print("Models and data loaded successfully.")
except Exception as e:
    print(f"Error loading models/data: {e}")
    raise


def engineer_features(historical_records):
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

    df = df.sort_values(['year', 'grade']).reset_index(drop=True)
    latest = df.iloc[-1].copy()

    if len(df) > 1:
        latest['attendance_trend'] = df['attendance_rate'].iloc[-1] - df['attendance_rate'].iloc[-2]
        latest['performance_trend'] = df['avg_score'].iloc[-1] - df['avg_score'].iloc[-2]
        latest['study_hours_trend'] = df['study_hours_per_week'].iloc[-1] - df['study_hours_per_week'].iloc[-2]
    else:
        latest['attendance_trend'] = 0
        latest['performance_trend'] = 0
        latest['study_hours_trend'] = 0

    latest['homework_discipline'] = (
        latest.get('homework_completion_rate', 0) * 0.5 +
        latest.get('homework_on_time_rate', 0) * 0.5
    )
    latest['overall_engagement'] = (
        latest.get('homework_completion_rate', 0) * 0.25 +
        latest.get('classwork_completion_rate', 0) * 0.25 +
        latest.get('lms_engagement_score', 0) * 0.25 +
        latest.get('parent_engagement_score', 0) * 0.25
    )
    latest['academic_consistency'] = 1 / (latest.get('score_std', 0) + 1)

    latest['critical_attendance'] = 1 if latest['attendance_rate'] < 75 else 0
    latest['failing_performance'] = 1 if latest['avg_score'] < 40 else 0
    latest['multiple_weak_subjects'] = 1 if latest.get('weak_subjects', 0) >= 3 else 0
    latest['low_parental_support'] = 1 if latest.get('parent_engagement_score', 0) < 0.5 else 0

    latest['attendance_performance_product'] = latest['attendance_rate'] * latest['avg_score'] / 100
    latest['iq_study_interaction'] = latest['iq_level'] * latest['study_hours_per_week'] / 100
    latest['risk_momentum'] = (-latest['attendance_trend'] * 0.5) + (-latest['performance_trend'] * 0.5)

    return latest


def get_student_data(student_id, df):
    cursor = students_col.find({'student_id': student_id}).sort([('grade', 1), ('year', 1)])
    mongo_records = list(cursor)

    if mongo_records:
        for r in mongo_records:
            r.pop('_id', None)
        return engineer_features(mongo_records)

    student_data = df[df['student_id'] == student_id]
    if student_data.empty:
        return None

    return engineer_features(student_data.to_dict('records'))


def predict_risk(student_data, model, feature_names):
    try:
        if isinstance(student_data, dict):
            student_data = pd.Series(student_data)

        features = []
        for feat in feature_names:
            val = student_data.get(feat, 0)
            if pd.isna(val):
                val = 0
            features.append(val)

        features_arr = np.array([features])

        prediction = model.predict(features_arr)[0]
        probabilities = model.predict_proba(features_arr)[0]
        risk_category = label_encoder.inverse_transform([prediction])[0]

        return {
            'risk_category': risk_category,
            'risk_code': int(prediction),
            'low_risk_prob': float(probabilities[0]),
            'medium_risk_prob': float(probabilities[1]),
            'high_risk_prob': float(probabilities[2]),
            'confidence': float(probabilities.max())
        }
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise


def analyze_contributing_factors(student_data):
    factors = []
    recommendations = []

    att = float(student_data['attendance_rate'])
    if att < 75:
        recommendations.append("URGENT: Immediate parent meeting required to address attendance")
    elif att < 85:
        recommendations.append("Schedule parent meeting to discuss attendance issues")

    avg = float(student_data['avg_score'])
    if avg < 40:
        recommendations.append("URGENT: Immediate academic intervention and remedial classes needed")
    elif avg < 55:
        recommendations.append("Enroll in subject-specific tutoring programs")

    study = float(student_data['study_hours_per_week'])
    if study < 6:
        recommendations.append("Time management counseling and study plan development needed")

    if not recommendations:
        recommendations.append("Continue current performance and maintain consistency")
        recommendations.append("Consider joining advanced academic workshops")

    return factors, recommendations


@app.route('/api/risk/<student_id>', methods=['GET'])
def get_student_risk(student_id):
    try:
        search_id = student_id
        student_data = get_student_data(search_id, df_complete)

        if student_data is None:
            try:
                search_id = int(student_id)
                student_data = get_student_data(search_id, df_complete)
            except ValueError:
                pass

        if student_data is None:
            return jsonify({'error': 'Student not found'}), 404

        prediction = predict_risk(student_data, best_model, feature_names)
        factors, recommendations = analyze_contributing_factors(student_data)

        response_data = {
            'student_info': {
                'name': f"Student {student_id}",
                'id': student_id,
                'grade': f"{int(student_data['grade'])}-A",
                'school': 'Secondary School'
            },
            'risk_assessment': {
                'risk_level': prediction['risk_category'],
                'probabilities': {
                    'low': float(prediction['low_risk_prob']),
                    'medium': float(prediction['medium_risk_prob']),
                    'high': float(prediction['high_risk_prob'])
                }
            },
            'metrics': {
                'academic_performance': {
                    'value': float(student_data['avg_score']),
                    'status': 'Excellent' if student_data['avg_score'] >= 80 else 'Good' if student_data['avg_score'] >= 60 else 'Average' if student_data['avg_score'] >= 45 else 'Critical'
                },
                'attendance_rate': {
                    'value': float(student_data['attendance_rate']),
                    'status': 'Present'
                },
                'study_habits': {
                    'value': float(student_data['study_hours_per_week']),
                    'hours_per_week': float(student_data['study_hours_per_week']),
                    'status': 'On Track'
                },
                'health_status': {
                    'value': str(student_data.get('health_status', 'N/A')).title(),
                    'status': 'Good'
                }
            },
            'subject_analysis': {
                'Math': float(student_data.get('Mathematics_score', 0)),
                'Science': float(student_data.get('Science_score', 0)),
                'English': float(student_data.get('English_score', 0)),
                'History': float(student_data.get('History_score', 0)),
                'Sinhala': float(student_data.get('Sinhala_score', 0)),
                'Religion': float(student_data.get('Buddhism_score', 0))
            },
            'action_plan': recommendations
        }

        # ── Save prediction result to MongoDB ──────────────────────────
        try:
            predictions_col.insert_one({
                'student_id':    student_id,
                'risk_level':    prediction['risk_category'],
                'risk_code':     prediction['risk_code'],
                'probabilities': {
                    'low':    prediction['low_risk_prob'],
                    'medium': prediction['medium_risk_prob'],
                    'high':   prediction['high_risk_prob'],
                },
                'confidence':       prediction['confidence'],
                'metrics': {
                    'avg_score':             float(student_data['avg_score']),
                    'attendance_rate':       float(student_data['attendance_rate']),
                    'study_hours_per_week':  float(student_data['study_hours_per_week']),
                },
                'action_plan':   recommendations,
                'predicted_at':  datetime.now(),
            })
        except Exception as save_err:
            print(f'⚠️  Could not save prediction to DB: {save_err}')
        # ────────────────────────────────────────────────────────────────

        return jsonify(response_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


@app.route('/api/students', methods=['POST'])
def save_student():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        student_id = data.get('student_id')
        records = data.get('records')

        if not student_id or not records:
            return jsonify({'error': 'student_id and records are required'}), 400

        students_col.delete_many({'student_id': student_id})

        subject_map = {
            'mathematics': 'Mathematics_score',
            'science': 'Science_score',
            'english': 'English_score',
            'history': 'History_score',
            'sinhala': 'Sinhala_score',
            'buddhism': 'Buddhism_score',
        }

        trend_map = {'Improving': 5, 'Stable': 0, 'Declining': -5}

        timestamp = datetime.now()
        transformed_records = []
        for record in records:
            subject_marks = record.get('subject_marks', {})
            subject_scores = [float(subject_marks.get(k, 0)) for k in subject_map.keys()]
            avg_score = float(record.get('average_score', 0)) or (sum(subject_scores) / len(subject_scores) if subject_scores else 0)

            weak = sum(1 for s in subject_scores if s < 50)
            failing = sum(1 for s in subject_scores if s < 35)
            score_std = float(np.std(subject_scores)) if subject_scores else 0

            transformed = {
                'student_id': student_id,
                'grade': int(record.get('grade', 10)),
                'year': int(record.get('year', 2025)),
                'attendance_rate': float(record.get('attendance_percentage', 0)),
                'avg_score': avg_score,
                'study_hours_per_week': float(record.get('study_hours_per_week', 0)),
                'performance_trend_value': trend_map.get(record.get('performance_trend', 'Stable'), 0),
                'disciplinary_actions': int(record.get('behavior_frequency', 0)),
                **{model_key: float(subject_marks.get(form_key, 0)) for form_key, model_key in subject_map.items()},
                'weak_subjects': weak,
                'failing_subjects': failing,
                'score_std': score_std,
                'homework_completion_rate': 0.8,
                'classwork_completion_rate': 0.8,
                'lms_engagement_score': 0.7,
                'parent_engagement_score': 0.7,
                'iq_level': 100,
                'health_status': 'Good',
                'homework_on_time_rate': 0.9,
                'has_learning_difficulty': 0,
                'extracurricular_participation': 1,
                'travel_time_to_school': 20,
                'sleep_hours_per_night': 8,
                'social_media_usage_hours': 1,
                'peer_influence_score': 0.5,
                'financial_status_score': 0.8,
                'family_support_score': 0.9,
                'teacher_support_score': 0.9,
                'school_environment_score': 0.9,
                'counseling_sessions_attended': 0,
                'previous_year_fail': 0,
                'resource_availability': 0.9,
                'motivation_level': 0.8,
                'standardized_test_score': avg_score,
                'created_at': timestamp,
            }
            transformed_records.append(transformed)

        result = students_col.insert_many(transformed_records)

        return jsonify({
            'message': f'Data for {len(transformed_records)} grades saved successfully',
            'ids': [str(id) for id in result.inserted_ids]
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/risk/history/<student_id>', methods=['GET'])
def get_risk_history(student_id):
    try:
        limit = int(request.args.get('limit', 20))
        records = list(
            predictions_col.find({'student_id': student_id})
                           .sort('predicted_at', -1)
                           .limit(limit)
        )
        for r in records:
            r['_id'] = str(r['_id'])
            if 'predicted_at' in r and hasattr(r['predicted_at'], 'isoformat'):
                r['predicted_at'] = r['predicted_at'].isoformat()
        return jsonify(records)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        result = students_col.delete_many({'student_id': student_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Student not found'}), 404
        return jsonify({'message': f'Deleted {result.deleted_count} records for {student_id}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5002, use_reloader=False)
