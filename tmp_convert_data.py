import pandas as pd
import os

risk_data_path = r'd:\\All project\\research\\AI-Powered-Intelligent-Education-Support-System\\backend\\risk_predictor\\comprehensive_risk_dataset_1000_complete.csv'
target_data_path = r'd:\\All project\\research\\AI-Powered-Intelligent-Education-Support-System\\backend\\data\\academic_performance_1000_students_with_iq_study_hours.csv'

if not os.path.exists(os.path.dirname(target_data_path)):
    os.makedirs(os.path.dirname(target_data_path))

try:
    print(f"Reading risk data from {risk_data_path}...")
    df = pd.read_csv(risk_data_path)

    subject_cols = {
        'Sinhala_score': 'Sinhala',
        'Mathematics_score': 'Mathematics',
        'Science_score': 'Science',
        'English_score': 'English',
        'History_score': 'History',
        'Buddhism_score': 'Buddhism',
        'Geography_score': 'Geography',
        'ICT_score': 'ICT'
    }

    long_rows = []

    for _, row in df.iterrows():
        for score_col, subject_name in subject_cols.items():
            if score_col in row:
                new_row = {
                    'student_id': row['student_id'],
                    'subject': subject_name,
                    'score': row[score_col],
                    'lesson': f"{subject_name}_General",
                    'iq_level': row['iq_level'],
                    'study_hours_per_week': row['study_hours_per_week'],
                    'attendance_rate': row['attendance_rate'],
                    'student_type': row['student_type']
                }
                long_rows.append(new_row)

    long_df = pd.DataFrame(long_rows)
    print(f"Saving {len(long_df)} rows to {target_data_path}...")
    long_df.to_csv(target_data_path, index=False)
    print("Dataset recreated successfully!")
except Exception as e:
    print(f"Error recreating dataset: {e}")
