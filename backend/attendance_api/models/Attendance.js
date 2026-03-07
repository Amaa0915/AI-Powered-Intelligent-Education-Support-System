const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    student_id: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
    month: { type: Number },
    year: { type: Number },
    day_of_week: { type: String },
    weather_condition: { type: String },   // sunny, cloudy, rainy, windy
    temperature: { type: Number },
    is_holiday: { type: Boolean, default: false },
    is_before_holiday: { type: Boolean, default: false },
    is_after_holiday: { type: Boolean, default: false },
    school_event: { type: String, default: 'normal' }, // term_start, exam, sports_meet, etc.
    distance_km: { type: Number },
    distance_band: { type: String },       // Nearby | Moderate | Far | Very Far
}, { timestamps: true });

AttendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
