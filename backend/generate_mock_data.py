import pandas as pd
import numpy as np
import os
import random

def generate_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'academic_performance_1000_students_with_iq_study_hours.csv')
    
    subjects = ['Sinhala', 'Mathematics', 'Science', 'English', 'History', 'Buddhism', 'Geography', 'ICT']
    student_types = ['science_oriented', 'balanced', 'language_oriented', 'practical']
    
    rows = []
    for i in range(1, 101):  # 100 students
        student_id = f"STU{i:04d}"
        iq_level = random.randint(85, 140)
        study_hours = random.randint(2, 20)
        attendance = random.randint(50, 100)
        student_type = random.choice(student_types)
        
        for subject in subjects:
            score = random.randint(30, 100)
            rows.append({
                'student_id': student_id,
                'subject': subject,
                'lesson': f"{subject}_Lesson_1",
                'score': score,
                'iq_level': iq_level,
                'study_hours_per_week': study_hours,
                'attendance_rate': attendance,
                'student_type': student_type
            })
            
    df = pd.DataFrame(rows)
    df.to_csv(csv_path, index=False)
    print(f"✅ Generated mock data at {csv_path}")

if __name__ == "__main__":
    generate_data()
