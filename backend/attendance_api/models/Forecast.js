const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
    model_type: { type: String, enum: ['LSTM', 'ARIMA'], required: true },
    scope: { type: String, enum: ['global', 'student'], default: 'global' },
    student_id: { type: String, default: null },
    generated_at: { type: Date, default: Date.now },
    steps: { type: Number },
    order: { type: [Number], default: [] },       // ARIMA order
    look_back: { type: Number, default: null },    // LSTM look_back
    converged: { type: Boolean, default: true },
    forecast: { type: mongoose.Schema.Types.Mixed },   // array of forecast objects
    historical: { type: mongoose.Schema.Types.Mixed }, // array of historical objects
    meta: { type: mongoose.Schema.Types.Mixed },       // extra info (input_shape etc.)
}, { timestamps: true });

// Ensure at most one active global forecast per model type
ForecastSchema.index({ model_type: 1, scope: 1, student_id: 1 });

module.exports = mongoose.model('Forecast', ForecastSchema);
