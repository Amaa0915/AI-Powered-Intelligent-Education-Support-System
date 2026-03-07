const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    grade: { type: String },
    section: { type: String },
    total_days: { type: Number, default: 0 },
    present_days: { type: Number, default: 0 },
    absent_days: { type: Number, default: 0 },
    attendance_rate: { type: Number, default: 0 },
    is_anomalous: { type: Boolean, default: false },
    anomaly_score: { type: Number, default: 0 },
    risk_level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    distance_km: { type: Number },
    distance_band: { type: String },       // Nearby | Moderate | Far | Very Far
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
