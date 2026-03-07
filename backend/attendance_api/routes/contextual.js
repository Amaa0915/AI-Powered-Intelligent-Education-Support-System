const express = require('express');
const router = express.Router();
const axios = require('axios');

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT = 180_000;

const mlErr = (err, res) => {
    if (err.code === 'ECONNREFUSED')
        return res.status(503).json({ error: 'ML service offline. Run: python ml_service/app.py' });
    if (err.response?.status === 404) return res.status(404).json({ error: err.response.data?.error });
    res.status(500).json({ error: err.message });
};

// ── GET /api/contextual/impact ──────────────────────────────────────────────
// All-student breakdown: weather / holiday / event / day-of-week / monthly
router.get('/impact', async (req, res) => {
    try {
        const r = await axios.get(`${ML_BASE}/contextual/impact`, { timeout: ML_TIMEOUT });
        res.json(r.data);
    } catch (err) { mlErr(err, res); }
});

// ── POST /api/contextual/student-impact ─────────────────────────────────────
// Same breakdown filtered to one student
router.post('/student-impact', async (req, res) => {
    try {
        const r = await axios.post(`${ML_BASE}/contextual/student-impact`, req.body, { timeout: ML_TIMEOUT });
        res.json(r.data);
    } catch (err) { mlErr(err, res); }
});

// ── POST /api/contextual/predict ─────────────────────────────────────────────
// Gradient-Boosting prediction: given weather+holiday+event → attendance %
// + weather/event comparison sweeps + feature importance
router.post('/predict', async (req, res) => {
    try {
        const r = await axios.post(`${ML_BASE}/contextual/predict`, req.body, { timeout: ML_TIMEOUT });
        res.json(r.data);
    } catch (err) { mlErr(err, res); }
});

// ── POST /api/contextual/predict-student ─────────────────────────────────────
// Same prediction but fitted only on one student's history
router.post('/predict-student', async (req, res) => {
    try {
        const r = await axios.post(`${ML_BASE}/contextual/predict-student`, req.body, { timeout: ML_TIMEOUT });
        res.json(r.data);
    } catch (err) { mlErr(err, res); }
});

// ── POST /api/contextual/guest-trend ─────────────────────────────────────────
// Context-Aware ARIMA forecast for new/guest students (no DB required)
// Accepts raw attendance array + contextual factors
// Returns ARIMA forecast + Sri Lankan calendar-aware NL explanation cards
router.post('/guest-trend', async (req, res) => {
    try {
        const r = await axios.post(`${ML_BASE}/predict/guest-trend`, req.body, { timeout: ML_TIMEOUT });
        res.json(r.data);
    } catch (err) { mlErr(err, res); }
});

module.exports = router;
