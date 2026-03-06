from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class PriorityLesson(BaseModel):
    subject: str
    lesson: str
    current_score: float
    target_score: float

class WeakAreas(BaseModel):
    student_id: str
    weak_subjects: Dict[str, float]
    priority_lessons: List[PriorityLesson]

class OnlineResource(BaseModel):
    title: str
    platform: str
    url: str
    level: str
    type: str
    duration: str
    rating: float
    language: str
    topics: str
    priority: str
    subject: str

class StreamRecommendation(BaseModel):
    rank: int
    stream: str
    total_score: float
    required_subjects_avg: float
    helpful_subjects_avg: float
    meets_minimum: bool
    min_required: float
    recommendation_strength: str
    description: str
    career_paths: List[str]

class ActionPlanItem(BaseModel):
    priority: str
    action: str
    timeline: str

class StudentPerformance(BaseModel):
    overall_avg: float
    iq_level: float
    study_hours: float
    attendance_rate: float
    student_type: str

class LearningPath(BaseModel):
    student_id: str
    current_performance: StudentPerformance
    weak_subjects: Dict[str, float]
    priority_lessons: List[PriorityLesson]
    online_resources: List[OnlineResource]
    al_stream_recommendations: List[StreamRecommendation]
    recommended_stream: str
    action_plan: List[ActionPlanItem]

class StudentSummary(BaseModel):
    student_id: str
    avg_score: float
    cluster: int
    student_type: str

class NewStudentInput(BaseModel):
    student_id: str = ""
    iq_level: float
    study_hours_per_week: float
    attendance_rate: float
    student_type: str
    subject_scores: Dict[str, float]

class ClusterDistribution(BaseModel):
    cluster: int
    count: int
    avg_score: float
    student_types: Dict[str, int]

class WeeklyScheduleDay(BaseModel):
    day: str
    subjects: List[str]
    duration: str

class StudyMaterial(BaseModel):
    subject: str
    materials: List[str]

class ALPathSuggestion(BaseModel):
    stream: str
    subjects: Dict[str, List[str]]
    career_paths: List[str]
    universities: List[str]
    target_z_score: str
    study_tips: List[str]

class StudentFullProfile(BaseModel):
    student_id: str
    name: str
    age: int
    current_grade: int
    interested_stream: str
    strengths: List[str]
    weaknesses: List[str]
    current_performance: Optional[StudentPerformance] = None
    weekly_schedule: List[WeeklyScheduleDay]
    recommended_materials: List[StudyMaterial]
    al_path: ALPathSuggestion
    created_at: str

class NewStudentInputExtended(BaseModel):
    student_id: str
    name: str
    age: int
    current_grade: int
    interested_stream: str
    strengths: List[str]
    weaknesses: List[str]
    iq_level: float
    study_hours_per_week: float
    attendance_rate: float
    student_type: str
    subject_scores: Dict[str, float]
