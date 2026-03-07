import { useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";
import { API_URLS } from "../../api/config";

function StressPrediction() {
  const [formData, setFormData] = useState({
    studentName: "Student",
    term_mark_avg: "",
    prev_term_mark_avg: "",
    daily_study: "",
    prefer_study: "1",
    travel_time: "",
    financial_status: "0",
    social_media: "",
    sleep_hours: "",
    attendance: "",
    tuition_hours_per_week: "",
    disaster_impact: "0"
  });

  const [prediction, setPrediction] = useState(null);
  const [stressScore, setStressScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [stressFactors, setStressFactors] = useState({
    academic: 0,
    lifestyle: 0,
    external: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [predictionId, setPredictionId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const numericData = {
        studentName: formData.studentName,
        term_mark_avg: parseFloat(formData.term_mark_avg) || 0,
        prev_term_mark_avg: parseFloat(formData.prev_term_mark_avg) || 0,
        daily_study: parseFloat(formData.daily_study) || 0,
        prefer_study: parseInt(formData.prefer_study) || 1,
        travel_time: parseFloat(formData.travel_time) || 0,
        financial_status: parseInt(formData.financial_status) || 0,
        social_media: parseFloat(formData.social_media) || 0,
        sleep_hours: parseFloat(formData.sleep_hours) || 0,
        attendance: parseFloat(formData.attendance) || 0,
        tuition_hours_per_week: parseFloat(formData.tuition_hours_per_week) || 0,
        disaster_impact: parseInt(formData.disaster_impact) || 0
      };

      const response = await axios.post(`${API_URLS.STRESS_BACKEND}/api/predict`, numericData);
      setPrediction(response.data.stress_level);
      setStressScore(response.data.prediction_code === 0 ? 25 : response.data.prediction_code === 1 ? 50 : 75);
      setPredictionId(response.data.predictionId);
      
      if (response.data.predictionId) {
        try {
          const historyResponse = await axios.get(`${API_URLS.STRESS_BACKEND}/api/history/${response.data.predictionId}`);
          if (historyResponse.data && Array.isArray(historyResponse.data)) {
            const last7 = historyResponse.data.slice(0, 7).reverse();
            const scores = last7.map(pred => {
              if (pred.predictionCode === 0) return 25;
              if (pred.predictionCode === 1) return 50;
              return 75;
            });
            while (scores.length < 7) {
              scores.unshift(stressScore || 50);
            }
            setTrendData(scores);
          }
        } catch (err) {
          console.log("Could not fetch trend data", err);
          setTrendData([50, 48, 52, 51, 49, 47, stressScore || 50]);
        }
      } else {
        setTrendData([50, 48, 52, 51, 49, 47, stressScore || 50]);
      }
      
      const academicScore = (
        (100 - numericData.term_mark_avg) * 0.5 + 
        (100 - numericData.attendance) * 0.5
      ) / 2;
      
      const lifestyleScore = (
        (8 - numericData.sleep_hours) * 12.5 + 
        numericData.social_media * 15 + 
        numericData.daily_study * 5
      ) / 3;
      
      const externalScore = (
        numericData.financial_status * 25 + 
        numericData.disaster_impact * 25 + 
        numericData.travel_time * 10
      ) / 3;
      
      setStressFactors({
        academic: Math.min(100, Math.max(0, Math.round(academicScore))),
        lifestyle: Math.min(100, Math.max(0, Math.round(lifestyleScore))),
        external: Math.min(100, Math.max(0, Math.round(externalScore)))
      });
      
      if (response.data.ai_recommendations && Array.isArray(response.data.ai_recommendations)) {
        setRecommendations(response.data.ai_recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error getting prediction. Please try again.");
    }
  };

  const getStressColor = () => {
    if (!stressScore) return "#94a3b8";
    if (stressScore <= 33) return "#10b981";
    if (stressScore <= 66) return "#f59e0b";
    return "#ef4444";
  };

  const getStressLabel = () => {
    if (!stressScore) return "No Data";
    if (stressScore <= 33) return "Low Risk";
    if (stressScore <= 66) return "Medium Risk";
    return "High Risk";
  };

  const chartData = trendData.length > 0 ? trendData : [50, 48, 52, 51, 49, 47, 45];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Layout title="Exam Stress Prediction">
      {/* Dashboard Content Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        gap: "24px",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Left Panel - Predict Stress */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{
              width: "40px", height: "40px", background: "#14b8a6", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
            }}>🎯</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
              Predict Stress
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Academic Section */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                ACADEMIC
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <SliderField label="Current Term Marks (%)" name="term_mark_avg" value={formData.term_mark_avg} onChange={handleChange} min={0} max={100} step={1} unit="%" />
                <SliderField label="Previous Term Marks (%)" name="prev_term_mark_avg" value={formData.prev_term_mark_avg} onChange={handleChange} min={0} max={100} step={1} unit="%" />
              </div>
              <SliderField label="Attendance (%)" name="attendance" value={formData.attendance} onChange={handleChange} min={0} max={100} step={1} unit="%" />
            </div>

            {/* Lifestyle Section */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                LIFESTYLE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <SliderField label="Sleep Hours/Night" name="sleep_hours" value={formData.sleep_hours} onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
                <SliderField label="Daily Study (hrs)" name="daily_study" value={formData.daily_study} onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <ToggleField label="Study Preference" name="prefer_study" value={formData.prefer_study} onChange={handleChange}
                  options={[{ value: "0", label: "Morning" }, { value: "1", label: "Afternoon" }, { value: "2", label: "Night" }]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <SliderField label="Tuition Hours/Week" name="tuition_hours_per_week" value={formData.tuition_hours_per_week} onChange={handleChange} min={0} max={25} step={1} unit="hrs" />
                <SliderField label="Travel Time (hrs)" name="travel_time" value={formData.travel_time} onChange={handleChange} min={0} max={6} step={0.5} unit="hrs" />
              </div>
            </div>

            {/* External Section */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                EXTERNAL
              </div>
              <div style={{ marginBottom: "16px" }}>
                <SliderField label="Social Media (hrs/day)" name="social_media" value={formData.social_media} onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
              </div>
              <div style={{ marginTop: "16px" }}>
                <ToggleField label="Financial Status" name="financial_status" value={formData.financial_status} onChange={handleChange}
                  options={[{ value: "0", label: "Stable" }, { value: "1", label: "Moderate" }, { value: "2", label: "Critical" }]} />
              </div>
              <div style={{ marginTop: "16px" }}>
                <ToggleField label="Disaster Impact" name="disaster_impact" value={formData.disaster_impact} onChange={handleChange}
                  options={[{ value: "0", label: "None" }, { value: "1", label: "Moderate" }, { value: "2", label: "Severe" }]} />
              </div>
            </div>

            <button type="submit" style={{
              width: "100%", padding: "14px", background: "#14b8a6", color: "white", border: "none",
              borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              🎯 Predict Stress Level
            </button>
          </form>
        </div>

        {/* Middle Panel - AI Academic Coach */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{
              width: "40px", height: "40px", background: "#8b5cf6", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
            }}></div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>AI Academic Coach</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Personalized recommendations</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recommendations.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>
                  No Recommendations Yet
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                  Submit your wellness data to receive<br />
                  personalized AI-powered recommendations
                </div>
              </div>
            ) : (
              recommendations.map((rec, index) => {
                const icons = ["", "", "", ""];
                const colors = ["#f59e0b", "#10b981", "#8b5cf6", "#14b8a6"];
                return (
                  <RecommendationCard
                    key={index}
                    icon={icons[index % icons.length]}
                    title={`Recommendation ${index + 1}`}
                    description={rec}
                    borderColor={colors[index % colors.length]}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Current Stress Level */}
        <div>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                Current Stress Level
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
                <div style={{
                  padding: "20px 40px", background: `${getStressColor()}20`, color: getStressColor(),
                  borderRadius: "16px", fontSize: "36px", fontWeight: "700", textAlign: "center",
                  border: `3px solid ${getStressColor()}`
                }}>
                  {getStressLabel()}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                ⓘ Stress Factor Breakdown
              </div>
              <FactorBar label="Academic Pressure" percent={stressFactors.academic} color="#6366f1" />
              <FactorBar label="Lifestyle Factors" percent={stressFactors.lifestyle} color="#14b8a6" />
              <FactorBar label="External Factors" percent={stressFactors.external} color="#f97316" />
            </div>
          </div>

          {/* 7-Day Trend Chart */}
          <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                7-Day Trend
              </div>
              
              <svg width="100%" height="200" style={{ marginBottom: "8px" }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#14b8a6", stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: "#14b8a6", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                
                {[0, 25, 50, 75, 100].map((val) => (
                  <line key={val} x1="0" y1={200 - (val * 2)} x2="100%" y2={200 - (val * 2)} stroke="#f1f5f9" strokeWidth="1" />
                ))}
                
                <path
                  d={`M 0 ${200 - chartData[0] * 2} ${chartData.map((val, i) => 
                    `L ${(i / (chartData.length - 1)) * 100}% ${200 - val * 2}`
                  ).join(' ')} L 100% 200 L 0 200 Z`}
                  fill="url(#chartGradient)"
                />
                
                <path
                  d={`M 0 ${200 - chartData[0] * 2} ${chartData.map((val, i) => 
                    `L ${(i / (chartData.length - 1)) * 100}% ${200 - val * 2}`
                  ).join(' ')}`}
                  fill="none" stroke="#14b8a6" strokeWidth="2"
                />
                
                {chartData.map((val, i) => (
                  <circle key={i} cx={`${(i / (chartData.length - 1)) * 100}%`} cy={200 - val * 2} r="4" fill="#14b8a6" />
                ))}
              </svg>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                {days.map((day) => (
                  <div key={day} style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>{day}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FactorBar({ label, percent, color }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
        <span style={{ color: "#1e293b" }}>{label}</span>
        <span style={{ fontWeight: "600", color: "#1e293b" }}>{percent}%</span>
      </div>
      <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.3s ease" }}></div>
      </div>
    </div>
  );
}

function RecommendationCard({ icon, title, description, borderColor }) {
  return (
    <div style={{ padding: "16px", background: "#fafafa", borderLeft: `4px solid ${borderColor}`, borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{title}</span>
      </div>
      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>{description}</div>
    </div>
  );
}

function SliderField({ label, name, value, onChange, min, max, step, unit }) {
  const displayValue = value || min;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{label}</label>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#14b8a6", minWidth: "60px", textAlign: "right" }}>
          {displayValue} {unit}
        </span>
      </div>
      <input
        type="range" name={name} value={displayValue} onChange={onChange} min={min} max={max} step={step}
        className="stress-slider"
        style={{
          width: "100%", height: "6px", borderRadius: "3px",
          background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((displayValue - min) / (max - min)) * 100}%, #e2e8f0 ${((displayValue - min) / (max - min)) * 100}%, #e2e8f0 100%)`,
          outline: "none", cursor: "pointer", WebkitAppearance: "none", appearance: "none"
        }}
      />
    </div>
  );
}

function ToggleField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "500" }}>{label}</label>
      <div style={{ display: "flex", gap: "8px" }}>
        {options.map((option) => (
          <button key={option.value} type="button"
            onClick={() => onChange({ target: { name, value: option.value } })}
            style={{
              flex: 1, padding: "10px 16px",
              border: value === option.value ? "2px solid #14b8a6" : "1px solid #e2e8f0",
              background: value === option.value ? "#14b8a620" : "white",
              color: value === option.value ? "#14b8a6" : "#64748b",
              borderRadius: "8px", fontSize: "12px",
              fontWeight: value === option.value ? "600" : "500",
              cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { if (value !== option.value) { e.target.style.borderColor = "#94a3b8"; e.target.style.background = "#f8fafb"; } }}
            onMouseLeave={(e) => { if (value !== option.value) { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "white"; } }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StressPrediction;
