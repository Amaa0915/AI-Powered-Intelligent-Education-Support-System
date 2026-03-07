import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Tuple
from .config import ONLINE_RESOURCES, AL_STREAM_REQUIREMENTS
import os

# Global DataFrame to hold data
df_performance = None
student_metrics = None
subject_performance = None
scaler = None
kmeans_model = None

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

def load_data(file_path: str):
    global df_performance, student_metrics, subject_performance

    print(f"Loading data from {file_path}...")
    df_performance = pd.read_csv(file_path)

    student_metrics = df_performance.groupby('student_id').agg({
        'score': ['mean', 'std', 'min', 'max'],
        'iq_level': 'first',
        'study_hours_per_week': 'first',
        'attendance_rate': 'first',
        'student_type': 'first'
    }).reset_index()

    student_metrics.columns = ['student_id', 'avg_score', 'score_std', 'min_score',
                                'max_score', 'iq_level', 'study_hours', 'attendance_rate',
                                'student_type']

    subject_performance = df_performance.pivot_table(
        index='student_id',
        columns='subject',
        values='score',
        aggfunc='mean'
    ).reset_index()

    perform_clustering()

def perform_clustering():
    global subject_performance, scaler, kmeans_model

    subjects = ['Sinhala', 'Mathematics', 'Science', 'English', 'History',
                'Buddhism', 'Geography', 'ICT']

    X_cluster = subject_performance[subjects].fillna(subject_performance[subjects].mean())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_cluster)

    kmeans_model = KMeans(n_clusters=3, random_state=RANDOM_SEED, n_init=10)
    clusters = kmeans_model.fit_predict(X_scaled)

    subject_performance['cluster'] = clusters + 1

def get_all_students_summary() -> List[Dict[str, Any]]:
    if student_metrics is None:
        return []

    summary = pd.merge(student_metrics[['student_id', 'avg_score', 'student_type']],
                       subject_performance[['student_id', 'cluster']],
                       on='student_id')

    return summary.to_dict(orient='records')

def get_student_details(student_id: str) -> Dict[str, Any]:
    if df_performance is None:
        return None

    student_data = df_performance[df_performance['student_id'] == student_id]
    if student_data.empty:
        return None

    return generate_complete_learning_path(student_id)

def identify_weak_subjects(student_id, threshold=60):
    student_data = df_performance[df_performance['student_id'] == student_id]

    subject_scores = student_data.groupby('subject')['score'].mean().sort_values()
    weak_subjects = subject_scores[subject_scores < threshold]

    lesson_scores = student_data.groupby(['subject', 'lesson'])['score'].mean()

    weak_areas = {
        'student_id': student_id,
        'weak_subjects': weak_subjects.to_dict(),
        'priority_lessons': []
    }

    for subject in weak_subjects.index:
        if subject in lesson_scores.index.get_level_values(0):
            subject_lessons = lesson_scores[subject].sort_values()
            weak_lessons = subject_lessons[subject_lessons < threshold].head(5)

            for lesson, score in weak_lessons.items():
                weak_areas['priority_lessons'].append({
                    'subject': subject,
                    'lesson': lesson,
                    'current_score': round(score, 1),
                    'target_score': 75
                })

    return weak_areas

def recommend_online_resources(student_id, top_n=5):
    weak_areas = identify_weak_subjects(student_id)
    weak_subjects = list(weak_areas['weak_subjects'].keys())

    if not weak_subjects:
        return []

    recommendations = []

    student_data = df_performance[df_performance['student_id'] == student_id]
    avg_score = student_data['score'].mean()

    if avg_score < 50:
        preferred_level = 'Beginner'
    elif avg_score < 70:
        preferred_level = 'Intermediate'
    else:
        preferred_level = 'All Levels'

    for subject in weak_subjects[:3]:
        if subject in ONLINE_RESOURCES:
            subject_resources = ONLINE_RESOURCES[subject]

            level_matched = [r for r in subject_resources
                           if r['level'] == preferred_level or r['level'] == 'All Levels']

            if not level_matched:
                level_matched = subject_resources

            level_matched = sorted(level_matched, key=lambda x: x['rating'], reverse=True)

            for resource in level_matched[:2]:
                recommendations.append({
                    'subject': subject,
                    'title': resource['title'],
                    'platform': resource['platform'],
                    'url': resource['url'],
                    'level': resource['level'],
                    'type': resource['type'],
                    'duration': resource['duration'],
                    'rating': resource['rating'],
                    'language': resource['language'],
                    'topics': resource['topics'],
                    'priority': 'High' if weak_areas['weak_subjects'][subject] < 50 else 'Medium'
                })

    return recommendations[:top_n]

def recommend_al_stream(student_id):
    student_data = df_performance[df_performance['student_id'] == student_id]

    subject_avg = student_data.groupby('subject')['score'].mean()
    overall_avg = student_data['score'].mean()

    iq = student_data['iq_level'].iloc[0]
    study_hours = student_data['study_hours_per_week'].iloc[0]
    student_type = student_data['student_type'].iloc[0]

    stream_scores = {}

    for stream, requirements in AL_STREAM_REQUIREMENTS.items():
        score = 0
        details = {
            'required_subjects_score': 0,
            'helpful_subjects_score': 0,
            'meets_minimum': False,
            'strength_alignment': 0
        }

        required_scores = []
        for subject in requirements['required_subjects']:
            if subject in subject_avg:
                required_scores.append(subject_avg[subject])

        if required_scores:
            required_avg = np.mean(required_scores)
            details['required_subjects_score'] = required_avg
            score += required_avg * 0.50

        helpful_scores = []
        for subject in requirements['helpful_subjects']:
            if subject in subject_avg:
                helpful_scores.append(subject_avg[subject])

        if helpful_scores:
            helpful_avg = np.mean(helpful_scores)
            details['helpful_subjects_score'] = helpful_avg
            score += helpful_avg * 0.20

        details['meets_minimum'] = overall_avg >= requirements['min_avg_score']
        if details['meets_minimum']:
            score += 10

        type_alignment = {
            'Combined Maths': {'science_oriented': 15, 'balanced': 5, 'practical': 10},
            'Bio Science': {'science_oriented': 15, 'balanced': 8, 'language_oriented': 3},
            'Technology': {'science_oriented': 12, 'practical': 15, 'balanced': 8},
            'Commerce': {'balanced': 15, 'language_oriented': 8, 'practical': 5},
            'Arts': {'language_oriented': 15, 'balanced': 10}
        }

        if stream in type_alignment and student_type in type_alignment[stream]:
            alignment_bonus = type_alignment[stream][student_type]
            details['strength_alignment'] = alignment_bonus
            score += alignment_bonus * 0.30

        stream_scores[stream] = {
            'total_score': score,
            'details': details,
            'required_avg': details['required_subjects_score'],
            'helpful_avg': details['helpful_subjects_score']
        }

    ranked_streams = sorted(stream_scores.items(),
                           key=lambda x: x[1]['total_score'],
                           reverse=True)

    recommendations = []
    for rank, (stream, data) in enumerate(ranked_streams, 1):
        stream_info = AL_STREAM_REQUIREMENTS[stream]

        if rank == 1 and data['details']['meets_minimum']:
            recommendation_strength = 'Highly Recommended'
        elif rank <= 2 and data['details']['meets_minimum']:
            recommendation_strength = 'Recommended'
        elif data['details']['meets_minimum']:
            recommendation_strength = 'Consider'
        else:
            recommendation_strength = 'Not Recommended (Below Minimum)'

        recommendations.append({
            'rank': rank,
            'stream': stream,
            'total_score': round(data['total_score'], 2),
            'required_subjects_avg': round(data['required_avg'], 2),
            'helpful_subjects_avg': round(data['helpful_avg'], 2),
            'meets_minimum': bool(data['details']['meets_minimum']),
            'min_required': stream_info['min_avg_score'],
            'recommendation_strength': recommendation_strength,
            'description': stream_info['description'],
            'career_paths': stream_info['career_paths']
        })

    return recommendations, subject_avg, overall_avg

def generate_complete_learning_path(student_id):
    weak_areas = identify_weak_subjects(student_id)
    resources = recommend_online_resources(student_id, top_n=8)
    al_recommendations, subject_scores, overall_avg = recommend_al_stream(student_id)

    student_info = df_performance[df_performance['student_id'] == student_id].iloc[0]

    learning_path = {
        'student_id': student_id,
        'current_performance': {
            'overall_avg': round(overall_avg, 2),
            'iq_level': float(student_info['iq_level']),
            'study_hours': float(student_info['study_hours_per_week']),
            'attendance_rate': float(student_info['attendance_rate']),
            'student_type': student_info['student_type']
        },
        'weak_subjects': weak_areas['weak_subjects'],
        'priority_lessons': weak_areas['priority_lessons'][:10],
        'online_resources': resources,
        'al_stream_recommendations': al_recommendations,
        'recommended_stream': al_recommendations[0]['stream'],
        'action_plan': []
    }

    if weak_areas['weak_subjects']:
        learning_path['action_plan'].append({
            'priority': 'Immediate',
            'action': f"Focus on weak subjects: {', '.join(list(weak_areas['weak_subjects'].keys())[:3])}",
            'timeline': '2-3 months'
        })
        learning_path['action_plan'].append({
            'priority': 'High',
            'action': f"Use recommended online resources ({len(resources)} resources identified)",
            'timeline': 'Ongoing'
        })

    if student_info['study_hours_per_week'] < 10:
        learning_path['action_plan'].append({
            'priority': 'High',
            'action': f"Increase study hours from {student_info['study_hours_per_week']:.1f} to at least 12 hours/week",
            'timeline': '1 month'
        })

    if student_info['attendance_rate'] < 85:
        learning_path['action_plan'].append({
            'priority': 'Critical',
            'action': f"Improve attendance from {student_info['attendance_rate']:.1f}% to above 90%",
            'timeline': 'Immediate'
        })

    learning_path['action_plan'].append({
        'priority': 'Planning',
        'action': f"Prepare for {learning_path['recommended_stream']} stream in A/L",
        'timeline': '6-12 months'
    })

    return learning_path

def get_cluster_distribution() -> List[Dict[str, Any]]:
    if subject_performance is None or student_metrics is None:
        return []

    merged = pd.merge(
        subject_performance[['student_id', 'cluster']],
        student_metrics[['student_id', 'avg_score', 'student_type']],
        on='student_id'
    )

    cluster_stats = []
    for cluster_num in sorted(merged['cluster'].unique()):
        cluster_data = merged[merged['cluster'] == cluster_num]
        type_counts = cluster_data['student_type'].value_counts().to_dict()

        cluster_stats.append({
            'cluster': int(cluster_num),
            'count': int(len(cluster_data)),
            'avg_score': round(float(cluster_data['avg_score'].mean()), 2),
            'student_types': type_counts
        })

    return cluster_stats

def add_new_student(student_data: Dict[str, Any]) -> Dict[str, Any]:
    global df_performance, student_metrics, subject_performance

    if df_performance is None:
        raise ValueError("Data not loaded")

    student_id = student_data['student_id']

    # If student already exists, remove their rows so we re-add with updated data
    if student_id in df_performance['student_id'].values:
        df_performance = df_performance[df_performance['student_id'] != student_id].copy()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, "..", "data", "academic_performance_1000_students_with_iq_study_hours.csv")

    subjects = ['Sinhala', 'Mathematics', 'Science', 'English', 'History', 'Buddhism', 'Geography', 'ICT']
    new_rows = []

    for subject in subjects:
        score = student_data['subject_scores'].get(subject, 0)
        new_row = {
            'student_id': student_id,
            'subject': subject,
            'lesson': f"{subject}_Lesson_1",
            'score': score,
            'iq_level': student_data['iq_level'],
            'study_hours_per_week': student_data['study_hours_per_week'],
            'attendance_rate': student_data['attendance_rate'],
            'student_type': student_data['student_type']
        }
        new_rows.append(new_row)

    new_df = pd.DataFrame(new_rows)
    df_performance = pd.concat([df_performance, new_df], ignore_index=True)
    df_performance.to_csv(csv_path, index=False)

    recalculate_after_new_student()

    cluster = subject_performance[subject_performance['student_id'] == student_id]['cluster'].values[0]
    avg_score = student_data['subject_scores']
    avg_score_val = sum(avg_score.values()) / len(avg_score) if avg_score else 0

    return {
        'student_id': student_id,
        'cluster': int(cluster),
        'avg_score': round(avg_score_val, 2),
        'message': 'Student added successfully'
    }

def recalculate_after_new_student():
    global student_metrics, subject_performance

    student_metrics = df_performance.groupby('student_id').agg({
        'score': ['mean', 'std', 'min', 'max'],
        'iq_level': 'first',
        'study_hours_per_week': 'first',
        'attendance_rate': 'first',
        'student_type': 'first'
    }).reset_index()

    student_metrics.columns = ['student_id', 'avg_score', 'score_std', 'min_score',
                                'max_score', 'iq_level', 'study_hours', 'attendance_rate',
                                'student_type']

    subject_performance = df_performance.pivot_table(
        index='student_id',
        columns='subject',
        values='score',
        aggfunc='mean'
    ).reset_index()

    subjects = ['Sinhala', 'Mathematics', 'Science', 'English', 'History',
                'Buddhism', 'Geography', 'ICT']

    X_cluster = subject_performance[subjects].fillna(subject_performance[subjects].mean())

    if scaler is not None and kmeans_model is not None:
        X_scaled = scaler.transform(X_cluster)
        clusters = kmeans_model.predict(X_scaled)
        subject_performance['cluster'] = clusters + 1
