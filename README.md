# 🎓 EduGuide — AI-Powered Intelligent Education Support System

An intelligent, full-stack web application that leverages **Machine Learning** and **Generative AI** to provide holistic student support — from personalized learning paths to stress detection and dropout risk prediction.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**EduGuide** is designed to assist educators and administrators in monitoring and supporting student well-being and academic performance. It combines four core AI-driven modules into a single unified platform:

| Module | Description |
|---|---|
| 🧠 **Learning Path Analyzer** | Clusters students by performance, identifies weak subjects, and generates personalized study plans with online resource recommendations |
| 😰 **Stress Level Predictor** | Uses a trained ML model to predict student stress levels (Good / Bad / Awful) based on behavioral and academic indicators |
| ⚠️ **Dropout Risk Predictor** | Employs a Random Forest classifier to assess dropout risk (Low / Medium / High) using historical academic records |
| 📊 **Attendance Trend Analyzer** | Visualizes attendance patterns, correlates them with academic performance, and flags at-risk students |

---

## Key Features

- **ML-Powered Predictions** — Pre-trained scikit-learn models for stress detection and risk assessment
- **Gemini AI Recommendations** — Google Gemini generates personalized, actionable well-being advice
- **Real-Time Analytics Dashboard** — Interactive charts and statistics for educators
- **Student Profiles** — Detailed per-student views with subject analysis, weak areas, and tailored study schedules
- **Early Warning System** — Automatic detection of consecutive high-risk stress predictions
- **MongoDB Persistence** — All predictions and student data stored in MongoDB Atlas
- **Responsive Modern UI** — Built with React, Tailwind CSS, Framer Motion, and Recharts

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│          (Vite + Tailwind + Recharts)                │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Learning │ │  Stress  │ │   Risk   │ │Attendnce│ │
│  │   Path   │ │ Predict  │ │ Predict  │ │  Trend  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
└───────┼─────────────┼───────────┼─────────────┼──────┘
        │             │           │             │
        ▼             ▼           ▼             ▼
┌─────────────────────────────────────────────────────┐
│            FastAPI Unified Backend (:8000)            │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Stress Model │  │  Risk Model  │  │  Gemini AI │ │
│  │   (.pkl)     │  │  (.pkl)      │  │   (API)    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  MongoDB Atlas  │
              │  (3 Databases)  │
              └─────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10+** | Core language |
| **FastAPI** | REST API framework |
| **scikit-learn** | ML models (stress & risk prediction) |
| **pandas / NumPy** | Data processing & feature engineering |
| **joblib** | Model serialization |
| **PyMongo** | MongoDB driver |
| **Google Gemini API** | AI-generated recommendations |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Recharts** | Data visualization (charts) |
| **Framer Motion** | Animations & transitions |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **React Router v7** | Client-side routing |

### Infrastructure
| Technology | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud database |
| **Uvicorn** | ASGI server |

---

## Project Structure

```
AI-Powered-Intelligent-Education-Support-System/
│
├── backend/
│   ├── main.py                    # Unified FastAPI app (all routes)
│   ├── requirements.txt           # Python dependencies
│   │
│   ├── learning_path/             # Learning path analysis module
│   │   ├── core/                  # Analysis engine & MongoDB handler
│   │   └── models/                # Pydantic data models
│   │
│   ├── stress_ml/                 # Stress prediction module
│   │   ├── app.py                 # Standalone stress Flask app
│   │   ├── stress_level_model_final.pkl
│   │   └── .env                   # GEMINI_API_KEY
│   │
│   ├── risk_predictor/            # Dropout risk prediction module
│   │   ├── app.py                 # Standalone risk Flask app
│   │   ├── model_random_forest.pkl
│   │   ├── feature_scaler.pkl
│   │   ├── label_encoder.pkl
│   │   └── comprehensive_risk_dataset_1000_complete.csv
│   │
│   ├── ml_service/                # ML microservice (supplementary)
│   │   └── app.py
│   │
│   ├── stress_api/                # Stress API (Node.js service)
│   │   └── server.js
│   │
│   └── attendance_api/            # Attendance API (Node.js service)
│       └── server.js
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   │
│   └── src/
│       ├── main.jsx               # Entry point
│       ├── App.jsx                # Router & layout
│       ├── index.css              # Global styles
│       │
│       ├── pages/
│       │   ├── HomePage.jsx       # Main dashboard
│       │   └── auth/              # Authentication pages
│       │
│       ├── features/
│       │   ├── learning-path/     # Learning path UI
│       │   ├── stress/            # Stress predictor UI
│       │   ├── risk-predictor/    # Risk predictor UI
│       │   └── attendance/        # Attendance analyzer UI
│       │
│       ├── components/            # Shared components (Sidebar, Layout, etc.)
│       ├── api/                   # API client configuration
│       └── services/              # Service layer
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **MongoDB Atlas** account (or local MongoDB)
- **Google Gemini API key** *(optional, for AI recommendations)*

### 1. Clone the Repository

```bash
git clone https://github.com/Amaa0915/AI-Powered-Intelligent-Education-Support-System.git
cd AI-Powered-Intelligent-Education-Support-System
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

**Configure environment variables:**

Create `backend/stress_ml/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the Application

**Start the backend** (from project root):
```bash
cd backend
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`

**Start the frontend** (in a new terminal):
```bash
cd frontend
npm run dev
```
The app will be available at `http://localhost:5173`

---

## API Endpoints

### Learning Path
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/students` | List all students |
| `GET` | `/students/{id}` | Get student learning path |
| `POST` | `/students/add` | Add a new student |
| `GET` | `/clusters` | Get cluster distribution |

### Stress Prediction
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict` | Predict stress level |
| `GET` | `/api/history/{id}` | Get prediction history |
| `GET` | `/api/analytics/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/analytics/high-risk-students` | High-risk student list |

### Risk Prediction
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/risk/{id}` | Get student risk assessment |
| `GET` | `/api/risk/history/{id}` | Get risk prediction history |
| `POST` | `/api/students` | Save student records for risk analysis |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/attendance/overview` | Attendance summary stats |
| `GET` | `/api/attendance/distribution` | Attendance bracket distribution |
| `GET` | `/api/attendance/performance-correlation` | Attendance vs. performance scatter data |
| `GET` | `/api/attendance/at-risk-students` | Students below attendance threshold |
| `GET` | `/api/attendance/monthly-trend` | Attendance trends by grade |

---

## Screenshots

> *Screenshots will be added here after deployment.*

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is developed for academic and research purposes.

---

<p align="center">
  Built with ❤️ for better education
</p>
