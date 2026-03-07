const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  studentId: { type: String, default: null },
  inputData: {
    term_mark_avg: { type: Number, required: true },
    prev_term_mark_avg: { type: Number, required: true },
    daily_study: { type: Number, required: true },
    prefer_study: { type: Number, required: true },
    travel_time: { type: Number, required: true },
    financial_status: { type: Number, required: true },
    social_media: { type: Number, required: true },
    sleep_hours: { type: Number, required: true },
    attendance: { type: Number, required: true },
    tuition_hours_per_week: { type: Number, required: true },
    disaster_impact: { type: Number, required: true }
  },
  stressLevel: { type: String, enum: ['Good', 'Bad', 'Awful'], required: true },
  predictionCode: { type: Number, min: 0, max: 2, required: true },
  aiRecommendations: [{ type: String }],
  aiPowered: { type: Boolean, default: false },
  mainCauses: [{ feature: String, impact: Number }],
  timestamp: { type: Date, default: Date.now },
  earlyWarning: {
    isHighRisk: { type: Boolean, default: false },
    consecutiveHighRisk: { type: Number, default: 0 },
    lastHighRiskDate: { type: Date, default: null }
  },
  interventionTaken: { type: Boolean, default: false },
  interventionNotes: { type: String, default: null }
}, { timestamps: true });

predictionSchema.statics.getStudentHistory = function(studentId, limit = 20) {
  return this.find({ studentId }).sort({ timestamp: -1 }).limit(limit);
};

predictionSchema.statics.getHighRiskStudents = function(days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  return this.find({
    stressLevel: { $in: ['Bad', 'Awful'] },
    timestamp: { $gte: dateThreshold }
  }).sort({ timestamp: -1 });
};

predictionSchema.statics.getEarlyWarningStudents = function() {
  return this.find({ 'earlyWarning.isHighRisk': true }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('Prediction', predictionSchema);
