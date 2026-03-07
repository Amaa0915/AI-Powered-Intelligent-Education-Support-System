from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    gemini_model = "gemini-2.5-flash"
else:
    client = None
    gemini_model = None
    print("Warning: GEMINI_API_KEY not found. AI recommendations will not be available.")

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "stress_level_model_final.pkl")
model = joblib.load(MODEL_PATH)


def generate_ai_recommendations_with_gemini(data, stress_level):
    """Generate AI-powered recommendations using Google Gemini"""
    if not client:
        return ["AI service unavailable. Please configure GEMINI_API_KEY in .env file."]

    try:
        def categorize_performance(avg):
            if avg >= 75: return "excellent"
            elif avg >= 60: return "good"
            elif avg >= 50: return "fair"
            else: return "needs improvement"

        def categorize_sleep(hours):
            if hours >= 7: return "adequate"
            elif hours >= 5: return "insufficient"
            else: return "severely insufficient"

        def categorize_attendance(pct):
            if pct >= 85: return "excellent"
            elif pct >= 75: return "good"
            elif pct >= 60: return "poor"
            else: return "critical"

        prompt = f"""You are an AI student wellbeing advisor.

PRIVACY NOTE: This is anonymized educational data only.
Do NOT provide medical diagnosis or treatment.

Student Profile (ANONYMIZED):
- Overall Stress Level: {stress_level}
- Academic Performance: {categorize_performance(data['term_mark_avg'])}
- Performance Trend: {'improving' if data['term_mark_avg'] > data['prev_term_mark_avg'] else 'declining' if data['term_mark_avg'] < data['prev_term_mark_avg'] else 'stable'}
- Sleep Quality: {categorize_sleep(data['sleep_hours'])}
- Class Attendance: {categorize_attendance(data['attendance'])}
- Social Media Usage: {'high' if data['social_media'] >= 3 else 'moderate' if data['social_media'] >= 1.5 else 'low'}
- Study Commitment: {'high' if data['daily_study'] >= 4 else 'moderate' if data['daily_study'] >= 2 else 'low'}
- Workload Pressure: {'high' if data['tuition_hours_per_week'] > 10 else 'moderate' if data['tuition_hours_per_week'] >= 5 else 'light'}
- External Stressors: {'significant' if data['disaster_impact'] >= 3 or data['financial_status'] == 1 else 'minimal'}

Based on this profile, provide:
- Safe and practical stress management tips
- Healthy sleep and study routine guidance
- Lifestyle improvement suggestions
- Advice on when to seek professional support (educational only)

Provide exactly 5 SHORT and actionable recommendations.
IMPORTANT: Keep each recommendation to 1-2 sentences MAXIMUM (20-30 words each).
Do NOT use emojis.
Be concise and direct.
Include a brief safety disclaimer at the end (1 sentence).

Format:
1. [Short recommendation - max 2 sentences]
2. [Short recommendation - max 2 sentences]
3. [Short recommendation - max 2 sentences]
4. [Short recommendation - max 2 sentences]
5. [Short recommendation - max 2 sentences]

Safety Disclaimer: [One sentence disclaimer]
"""

        response = client.models.generate_content(
            model=gemini_model,
            contents=prompt
        )

        recommendations_text = response.text.strip()
        recommendations = []

        for line in recommendations_text.split('\n'):
            line = line.strip()
            if line.startswith('•') or line.startswith('-') or line.startswith('*') or (len(line) > 2 and line[0].isdigit() and line[1] == '.'):
                if line[0].isdigit():
                    rec = line.split('.', 1)[1].strip()
                else:
                    rec = line.lstrip('•-* ').strip()
                if rec and not rec.startswith('Safety') and not rec.startswith('Disclaimer'):
                    recommendations.append(rec)

        if len(recommendations) >= 3:
            return recommendations[:5]
        else:
            return ["AI response format error. Please try again."]

    except Exception as e:
        print(f"Gemini API Error: {e}")
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "quota" in str(e).lower():
            return [
                "Gemini API quota exhausted for today. Your stress prediction is still available above.",
                "Daily free quota: 20 requests. Resets at midnight Pacific Time.",
                "You can still use stress history graph and breathing exercise features.",
                "For unlimited AI recommendations, consider upgrading to paid tier at ai.google.dev",
                "General tip: Maintain 7-9 hours of sleep and take regular study breaks."
            ]
        return [
            "AI service temporarily unavailable. Your stress prediction is still shown above.",
            "Please try again later or contact support if the issue persists."
        ]


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    features = pd.DataFrame([{
        "term_mark_avg":          float(data["term_mark_avg"]),
        "prev_term_mark_avg":     float(data["prev_term_mark_avg"]),
        "daily_study":            float(data["daily_study"]),
        "prefer_study":           int(data["prefer_study"]),
        "travel_time":            float(data["travel_time"]),
        "financial_status":       int(data["financial_status"]),
        "social_media":           float(data["social_media"]),
        "sleep_hours":            float(data["sleep_hours"]),
        "attendance":             float(data["attendance"]),
        "tuition_hours_per_week": float(data["tuition_hours_per_week"]),
        "disaster_impact":        int(data["disaster_impact"]),
    }])

    pred = model.predict(features)[0]
    labels = {0: "Good", 1: "Bad", 2: "Awful"}
    stress_level = labels[int(pred)]

    ai_recommendations = generate_ai_recommendations_with_gemini(data, stress_level)

    return jsonify({
        "stress_level": stress_level,
        "prediction_code": int(pred),
        "ai_recommendations": ai_recommendations,
        "main_causes": [],
        "ai_powered": client is not None
    })


if __name__ == "__main__":
    app.run(port=5001, debug=True)
