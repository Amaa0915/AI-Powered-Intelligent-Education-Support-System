from pymongo import MongoClient
from datetime import datetime
from typing import Dict, List, Any


class MongoDBHandler:
    def __init__(self):
        self.client = None
        self.db = None
        self.students_collection = None
        self.connected = False

        try:
            connection_string = "mongodb+srv://admin:1234@paf.spi8fnl.mongodb.net/"
            self.client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            self.client.admin.command('ping')
            self.db = self.client['student_monitoring_db']
            self.students_collection = self.db['students']
            self.connected = True
            print("[OK] SUCCESS: Connected to MongoDB Atlas!")
        except Exception as e:
            print(f"[WARN] WARNING: MongoDB connection failed: {e}")
            print("[INFO] Running in OFFLINE mode")
            self.connected = False

    def generate_weekly_schedule(self, stream: str) -> List[Dict[str, Any]]:
        schedules = {
            "Science": [
                {"day": "Monday", "subjects": ["Mathematics", "Physics"], "duration": "2 hours each"},
                {"day": "Tuesday", "subjects": ["Chemistry", "Biology"], "duration": "2 hours each"},
                {"day": "Wednesday", "subjects": ["Mathematics", "Combined Maths"], "duration": "2 hours each"},
                {"day": "Thursday", "subjects": ["Physics", "Chemistry"], "duration": "2 hours each"},
                {"day": "Friday", "subjects": ["Biology", "General English"], "duration": "2 hours each"},
                {"day": "Saturday", "subjects": ["Revision & Practice Tests"], "duration": "4 hours"},
                {"day": "Sunday", "subjects": ["Weak subjects focus"], "duration": "3 hours"}
            ],
            "Commerce": [
                {"day": "Monday", "subjects": ["Accounting", "Economics"], "duration": "2 hours each"},
                {"day": "Tuesday", "subjects": ["Business Studies", "Accounting"], "duration": "2 hours each"},
                {"day": "Wednesday", "subjects": ["Economics", "Statistics"], "duration": "2 hours each"},
                {"day": "Thursday", "subjects": ["Business Studies", "General English"], "duration": "2 hours each"},
                {"day": "Friday", "subjects": ["Accounting", "Economics"], "duration": "2 hours each"},
                {"day": "Saturday", "subjects": ["Revision & Practice Tests"], "duration": "4 hours"},
                {"day": "Sunday", "subjects": ["Weak subjects focus"], "duration": "3 hours"}
            ],
            "Arts": [
                {"day": "Monday", "subjects": ["Sinhala", "History"], "duration": "2 hours each"},
                {"day": "Tuesday", "subjects": ["Geography", "Political Science"], "duration": "2 hours each"},
                {"day": "Wednesday", "subjects": ["Economics", "Logic"], "duration": "2 hours each"},
                {"day": "Thursday", "subjects": ["Sinhala", "General English"], "duration": "2 hours each"},
                {"day": "Friday", "subjects": ["History", "Geography"], "duration": "2 hours each"},
                {"day": "Saturday", "subjects": ["Revision & Practice Tests"], "duration": "4 hours"},
                {"day": "Sunday", "subjects": ["Weak subjects focus"], "duration": "3 hours"}
            ]
        }
        return schedules.get(stream, schedules["Science"])

    def recommend_study_materials(self, stream: str) -> List[Dict[str, Any]]:
        materials = {
            "Science": [
                {"subject": "Mathematics", "materials": ["Siyawara A/L Mathematics Book", "Perera & Karunaratne Mathematics", "Past Papers (2015-2024)", "Vinodh Academy MCQ Book"]},
                {"subject": "Physics", "materials": ["Ranjith Jayawardena Physics", "Past Papers with Answers", "Practicals Guide Book", "MCQ Practice Book"]},
                {"subject": "Chemistry", "materials": ["Ranjith Jayawardena Chemistry", "Past Papers Collection", "Lab Manual & Practicals", "Organic Chemistry Guide"]},
                {"subject": "Biology", "materials": ["Chandima Mapatuna Biology", "Past Papers (Last 10 years)", "Practical Guide Book", "Diagrams & Charts Collection"]},
            ],
            "Commerce": [
                {"subject": "Accounting", "materials": ["Wijesinghe Accounting Book", "Past Papers (2015-2024)", "Practice MCQ Book", "Double Entry Practice Book"]},
                {"subject": "Economics", "materials": ["Ariyaratne Economics", "Past Papers with Essays", "Essay Writing Practice", "MCQ Practice Book"]},
                {"subject": "Business Studies", "materials": ["Business Studies Textbook", "Past Papers Collection", "Case Studies Book", "Model Answers Guide"]},
            ],
            "Arts": [
                {"subject": "Sinhala", "materials": ["Sahithya Kalawa", "Past Papers Collection", "Essay Writing Guide", "Grammar Book"]},
                {"subject": "History", "materials": ["History Textbooks (All 3)", "Past Papers (2015-2024)", "Timeline Charts", "Map Practice Book"]},
                {"subject": "Geography", "materials": ["Geography Atlas", "Past Papers", "Map Practice Guide", "Diagrams Collection"]},
            ]
        }
        return materials.get(stream, materials["Science"])

    def suggest_al_path(self, stream: str) -> Dict[str, Any]:
        paths = {
            "Science": {
                "stream": "Physical Science / Biological Science",
                "subjects": {"Physical Science": ["Combined Maths", "Physics", "Chemistry"], "Biological Science": ["Biology", "Chemistry", "Physics"]},
                "career_paths": ["MBBS (Medicine)", "Engineering", "Pharmacy", "Dental Surgery", "Veterinary Science", "Agricultural Science"],
                "universities": ["University of Colombo", "University of Peradeniya", "University of Moratuwa", "University of Kelaniya"],
                "target_z_score": "1.8 - 2.0+ (for Medicine & Engineering)",
                "study_tips": ["Practice past papers from last 10-15 years", "Do MCQ questions daily", "Understand concepts deeply", "Complete all practicals", "Attend revision classes regularly"]
            },
            "Commerce": {
                "stream": "Commerce",
                "subjects": {"Main Subjects": ["Accounting", "Economics", "Business Studies"]},
                "career_paths": ["CA Sri Lanka", "Business Management", "Banking & Finance", "Marketing", "HRM", "Accounting Degrees"],
                "universities": ["University of Colombo", "University of Sri Jayewardenepura", "University of Kelaniya"],
                "target_z_score": "1.5 - 1.8+ (for top courses)",
                "study_tips": ["Focus on Accounting subject", "Read newspaper for Economics", "Practice essay writing", "Study real business cases"]
            },
            "Arts": {
                "stream": "Arts",
                "subjects": {"Common Subjects": ["Sinhala, History, Geography (based on interest)"]},
                "career_paths": ["Law", "Teaching", "Mass Communication", "Social Sciences", "Languages", "Public Administration"],
                "universities": ["University of Colombo", "University of Peradeniya", "University of Kelaniya"],
                "target_z_score": "1.2 - 1.6+ (varies by subject combination)",
                "study_tips": ["Develop essay writing skills", "Read widely", "Follow current affairs", "Practice structured answers"]
            }
        }
        return paths.get(stream, paths["Science"])

    def identify_weak_subjects_and_recommend(self, subject_scores: Dict[str, float], threshold: float = 60) -> Dict[str, Any]:
        weak_subjects = {}
        recommendations = []

        for subject, score in subject_scores.items():
            if score < threshold:
                weak_subjects[subject] = score

        sorted_weak = sorted(weak_subjects.items(), key=lambda x: x[1])

        material_database = {
            "Mathematics": [
                {"title": "Siyawara Mathematics - Complete Guide", "type": "Textbook", "priority": "High"},
                {"title": "Mathematics MCQ Practice Book", "type": "Workbook", "priority": "High"},
                {"title": "Khan Academy Mathematics", "type": "Online", "priority": "Medium"},
                {"title": "Past Papers (Last 5 years)", "type": "Practice", "priority": "High"}
            ],
            "Science": [
                {"title": "Science Textbook - Grade Level", "type": "Textbook", "priority": "High"},
                {"title": "Practical Science Guide", "type": "Workbook", "priority": "Medium"},
                {"title": "YouTube - Science Lessons Sri Lanka", "type": "Video", "priority": "High"}
            ],
            "English": [
                {"title": "English Grammar in Use", "type": "Textbook", "priority": "High"},
                {"title": "Vocabulary Builder", "type": "Workbook", "priority": "Medium"},
                {"title": "BBC Learning English", "type": "Online", "priority": "High"}
            ],
            "Sinhala": [
                {"title": "Sinhala Language Foundation Book", "type": "Textbook", "priority": "High"},
                {"title": "Grammar Practice Book", "type": "Workbook", "priority": "Medium"}
            ],
            "History": [
                {"title": "History Complete Guide", "type": "Textbook", "priority": "High"},
                {"title": "Timeline Charts & Maps", "type": "Visual Aid", "priority": "High"}
            ],
            "Buddhism": [
                {"title": "Buddhism Study Guide", "type": "Textbook", "priority": "High"}
            ],
            "Geography": [
                {"title": "Geography Complete Book", "type": "Textbook", "priority": "High"},
                {"title": "Atlas & Map Practice Book", "type": "Workbook", "priority": "High"}
            ],
            "ICT": [
                {"title": "ICT Textbook - Theory & Practical", "type": "Textbook", "priority": "High"},
                {"title": "ICT Past Papers with Answers", "type": "Practice", "priority": "High"}
            ]
        }

        for subject, score in sorted_weak:
            if subject in material_database:
                subject_recommendation = {
                    "subject": subject,
                    "current_score": score,
                    "status": "Critical" if score < 40 else "Needs Improvement" if score < 60 else "Fair",
                    "recommended_materials": material_database[subject],
                    "study_plan": {
                        "daily_hours": 2 if score < 40 else 1.5 if score < 50 else 1,
                        "focus_areas": self._get_focus_areas(subject, score),
                        "target_score": 75,
                        "estimated_weeks": 8 if score < 40 else 6 if score < 50 else 4
                    }
                }
                recommendations.append(subject_recommendation)

        return {
            "weak_subjects_count": len(weak_subjects),
            "weak_subjects": weak_subjects,
            "recommendations": recommendations,
            "overall_advice": self._get_overall_advice(len(weak_subjects))
        }

    def _get_focus_areas(self, subject: str, score: float) -> List[str]:
        focus_areas = {
            "Mathematics": ["Basic Operations", "Equations", "Geometry", "Statistics"],
            "Science": ["Physics Principles", "Chemistry Basics", "Biology Fundamentals"],
            "English": ["Grammar", "Vocabulary", "Reading Comprehension", "Writing Skills"],
            "Sinhala": ["Grammar", "Essay Writing", "Reading Comprehension"],
            "History": ["Key Events", "Timelines", "Historical Figures"],
            "Buddhism": ["Buddha's Teachings", "Dhamma Principles", "Buddhist History"],
            "Geography": ["Physical Geography", "Map Reading", "Economic Geography"],
            "ICT": ["Computer Basics", "Programming Fundamentals", "Software Applications"]
        }
        return focus_areas.get(subject, ["Core Concepts", "Past Papers Practice"])

    def _get_overall_advice(self, weak_count: int) -> str:
        if weak_count == 0:
            return "Excellent! All subjects are performing well. Maintain current level."
        elif weak_count <= 2:
            return "A few weak subjects found. Give extra attention to these. Dedicate 2-3 hours daily."
        elif weak_count <= 4:
            return "Multiple subjects need improvement. Consider joining tuition classes or study groups. Study 5-6 days a week."
        else:
            return "Many subjects need attention. Seek extra help from teachers daily. Dedicate maximum time to studies."

    def add_student_with_recommendations(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        weekly_schedule = self.generate_weekly_schedule(student_data['interested_stream'])
        study_materials = self.recommend_study_materials(student_data['interested_stream'])
        al_path = self.suggest_al_path(student_data['interested_stream'])

        student_doc = {
            **student_data,
            "weekly_schedule": weekly_schedule,
            "recommended_materials": study_materials,
            "al_path": al_path,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        mongodb_id = None
        if self.connected and self.students_collection is not None:
            try:
                result = self.students_collection.insert_one(student_doc)
                mongodb_id = str(result.inserted_id)
            except Exception as e:
                print(f"[WARN] Failed to save to MongoDB: {e}")

        return {
            "success": True,
            "message": "Student processed!" + (" (Saved to MongoDB)" if mongodb_id else " (Offline mode)"),
            "student_id": student_data['student_id'],
            "mongodb_id": mongodb_id,
            "weekly_schedule": weekly_schedule,
            "recommended_materials": study_materials,
            "al_path": al_path
        }

    def get_student_by_id(self, student_id: str) -> Dict[str, Any]:
        if not self.connected or self.students_collection is None:
            return None
        try:
            student = self.students_collection.find_one({"student_id": student_id})
            if student:
                student['_id'] = str(student['_id'])
                return student
        except Exception as e:
            print(f"[WARN] Failed to get student: {e}")
        return None

    def get_all_students(self) -> List[Dict[str, Any]]:
        if not self.connected or self.students_collection is None:
            return []
        try:
            students = list(self.students_collection.find({}))
            for student in students:
                student['_id'] = str(student['_id'])
            return students
        except Exception as e:
            print(f"[WARN] Failed to get students: {e}")
            return []

    def close(self):
        if self.client:
            self.client.close()


# Global instance
mongodb_handler = MongoDBHandler()
