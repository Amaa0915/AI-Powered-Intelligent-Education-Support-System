from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import os
import random
import string
from core import analysis
from core.mongodb_handler import mongodb_handler
from models.student import (
    StudentSummary, LearningPath, NewStudentInput, ClusterDistribution,
    NewStudentInputExtended, StudentFullProfile
)

app = FastAPI(title="Student Monitoring System API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_student_id():
    """Auto-generate a unique student ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"STU{timestamp}{random_suffix}"

@app.on_event("startup")
async def startup_event():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "academic_performance_1000_students_with_iq_study_hours.csv")
    if os.path.exists(data_path):
        analysis.load_data(data_path)
    else:
        print(f"WARNING: Data file not found at {data_path}")

@app.get("/")
async def read_root():
    return {"message": "Welcome to Student Monitoring System API"}

@app.get("/students", response_model=List[StudentSummary])
async def get_students():
    students = analysis.get_all_students_summary()
    return students

@app.get("/students/{student_id}", response_model=LearningPath)
async def get_student(student_id: str):
    student_data = analysis.get_student_details(student_id)
    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_data

@app.get("/clusters", response_model=List[ClusterDistribution])
async def get_cluster_distribution():
    try:
        clusters = analysis.get_cluster_distribution()
        return clusters
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/students/add")
async def add_student(student: NewStudentInput):
    """Add a new student - saves to MongoDB with recommendations for weak subjects"""
    try:
        if not student.student_id or student.student_id.strip() == "":
            generated_id = generate_student_id()
        else:
            generated_id = student.student_id.strip().upper()

        student_data = {
            "student_id": generated_id,
            "name": generated_id,
            "age": 16,
            "current_grade": 11,
            "interested_stream": "Science",
            "strengths": [],
            "weaknesses": [],
            "iq_level": student.iq_level,
            "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate,
            "student_type": student.student_type,
            "subject_scores": student.subject_scores
        }

        weak_analysis = mongodb_handler.identify_weak_subjects_and_recommend(
            student.subject_scores, threshold=60
        )

        weekly_schedule = mongodb_handler.generate_weekly_schedule(student_data['interested_stream'])
        study_materials = mongodb_handler.recommend_study_materials(student_data['interested_stream'])
        al_path = mongodb_handler.suggest_al_path(student_data['interested_stream'])

        student_doc = {
            "student_id": student_data['student_id'],
            "name": student_data['name'],
            "age": student_data['age'],
            "current_grade": student_data['current_grade'],
            "interested_stream": student_data['interested_stream'],
            "strengths": student_data.get('strengths', []),
            "weaknesses": list(weak_analysis['weak_subjects'].keys()),
            "iq_level": student_data.get('iq_level', 0),
            "study_hours_per_week": student_data.get('study_hours_per_week', 0),
            "attendance_rate": student_data.get('attendance_rate', 0),
            "student_type": student_data.get('student_type', ''),
            "subject_scores": student_data.get('subject_scores', {}),
            "weak_subject_analysis": weak_analysis,
            "weekly_schedule": weekly_schedule,
            "recommended_materials": study_materials,
            "al_path": al_path,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        mongodb_id = None
        if mongodb_handler.connected and mongodb_handler.students_collection is not None:
            try:
                result = mongodb_handler.students_collection.insert_one(student_doc)
                mongodb_id = str(result.inserted_id)
            except Exception as e:
                print(f"⚠️ Failed to save to MongoDB: {e}")

        basic_student_data = {
            "student_id": generated_id,
            "iq_level": student.iq_level,
            "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate,
            "student_type": student.student_type,
            "subject_scores": student.subject_scores
        }
        analysis_result = analysis.add_new_student(basic_student_data)

        return {
            "success": True,
            "message": "Student added successfully!" + (" (Saved to MongoDB)" if mongodb_id else " (Offline mode - not saved to DB)"),
            "student_id": generated_id,
            "mongodb_id": mongodb_id,
            "cluster": analysis_result.get('cluster'),
            "avg_score": analysis_result.get('avg_score'),
            "weak_subjects": weak_analysis['weak_subjects'],
            "weak_subjects_count": weak_analysis['weak_subjects_count'],
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
        basic_student_data = {
            "student_id": student.student_id,
            "iq_level": student.iq_level,
            "study_hours_per_week": student.study_hours_per_week,
            "attendance_rate": student.attendance_rate,
            "student_type": student.student_type,
            "subject_scores": student.subject_scores
        }
        analysis_result = analysis.add_new_student(basic_student_data)
        result['cluster'] = analysis_result.get('cluster')
        result['learning_path'] = analysis_result.get('learning_path')
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/students/mongodb/{student_id}", response_model=StudentFullProfile)
async def get_student_from_mongodb(student_id: str):
    try:
        student = mongodb_handler.get_student_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found in MongoDB")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/attendance")
async def get_attendance_data():
    """Get attendance analytics data"""
    try:
        from core.analysis import df_performance
        if df_performance is None:
            raise HTTPException(status_code=503, detail="Data not loaded")
        attendance_data = df_performance.groupby('student_id').agg(
            attendance_rate=('attendance_rate', 'first'),
            avg_score=('score', 'mean'),
            student_type=('student_type', 'first')
        ).reset_index()
        return attendance_data.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
