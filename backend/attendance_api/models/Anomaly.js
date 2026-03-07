const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    grade: { type: String },
    anomaly_type: { type: String },
    anomaly_score: { type: Number },
    attendance_rate: { type: Number },
    consecutive_absences: { type: Number, default: 0 },
    risk_level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    description: { type: String },
    year: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Anomaly', AnomalySchema);
