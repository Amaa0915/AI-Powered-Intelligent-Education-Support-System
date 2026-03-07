const express = require('express');
const router = express.Router();
const axios = require('axios');
const Forecast = require('../models/Forecast');

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CACHE_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes cache

/**
 * Fetch from ML service and upsert in MongoDB.
 * Returns the cached Forecast doc if it is fresh (< 30 min old).
 */
async function getOrRefreshForecast({ modelType, scope, studentId = null, mlPath, mlBody }) {
    // Check cache
    const query = { model_type: modelType, scope, student_id: studentId };
    const cached = await Forecast.findOne(query).sort({ generated_at: -1 });

    const age = cached ? Date.now() - new Date(cached.generated_at).getTime() : Infinity;
    if (cached && age < CACHE_MAX_AGE_MS) {
        return { data: cached, fromCache: true };
    }

    // Call ML service
    const response = await axios.post(`${ML_BASE}${mlPath}`, mlBody, { timeout: 120_000 });
    const mlData = response.data;

    const doc = await Forecast.findOneAndUpdate(
        query,
        {
            model_type: modelType,
            scope,
            student_id: studentId,
            generated_at: new Date(),
            steps: mlData.steps,
            order: mlData.order || [],
            look_back: mlData.look_back || null,
            converged: mlData.converged !== false,
            forecast: mlData.forecast,
            historical: mlData.historical,
            meta: {
                input_shape: mlData.input_shape,
                model: mlData.model,
            },
        },
        { upsert: true, new: true }
    );

    return { data: doc, fromCache: false };
}

// ─── GET /api/forecast/global/lstm ───────────────────────────────────────────
router.get('/global/lstm', async (req, res) => {
    try {
        const steps = parseInt(req.query.steps) || 30;
        const force = req.query.force === 'true';

        if (force) await Forecast.deleteOne({ model_type: 'LSTM', scope: 'global' });

        const { data, fromCache } = await getOrRefreshForecast({
            modelType: 'LSTM',
            scope: 'global',
            mlPath: '/predict/lstm',
            mlBody: { steps },
        });

        res.json({ fromCache, ...data.toObject() });
    } catch (err) {
        const isML = err.code === 'ECONNREFUSED';
        res.status(isML ? 503 : 500).json({
            error: isML ? 'ML service is not running. Start it with: python ml_service/app.py' : err.message,
        });
    }
});

// ─── GET /api/forecast/global/arima ──────────────────────────────────────────
router.get('/global/arima', async (req, res) => {
    try {
        const steps = parseInt(req.query.steps) || 12;
        const force = req.query.force === 'true';

        if (force) await Forecast.deleteOne({ model_type: 'ARIMA', scope: 'global' });

        const { data, fromCache } = await getOrRefreshForecast({
            modelType: 'ARIMA',
            scope: 'global',
            mlPath: '/predict/arima',
            mlBody: { steps, order: [2, 1, 2] },
        });

        res.json({ fromCache, ...data.toObject() });
    } catch (err) {
        const isML = err.code === 'ECONNREFUSED';
        res.status(isML ? 503 : 500).json({
            error: isML ? 'ML service is not running. Start it with: python ml_service/app.py' : err.message,
        });
    }
});

// ─── GET /api/forecast/student/:id ───────────────────────────────────────────
router.get('/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const steps = parseInt(req.query.steps) || 6;
        const force = req.query.force === 'true';

        if (force) await Forecast.deleteOne({ model_type: 'ARIMA', scope: 'student', student_id: studentId });

        const { data, fromCache } = await getOrRefreshForecast({
            modelType: 'ARIMA',
            scope: 'student',
            studentId,
            mlPath: '/predict/student',
            mlBody: { student_id: studentId, steps },
        });

        res.json({ fromCache, ...data.toObject() });
    } catch (err) {
        const isML = err.code === 'ECONNREFUSED';
        if (err.response?.status === 404) return res.status(404).json({ error: err.response.data?.error });
        res.status(isML ? 503 : 500).json({
            error: isML ? 'ML service is not running.' : err.message,
        });
    }
});

// ─── GET /api/forecast/model/info ────────────────────────────────────────────
router.get('/model/info', async (req, res) => {
    try {
        const response = await axios.get(`${ML_BASE}/model/info`, { timeout: 60_000 });
        res.json(response.data);
    } catch (err) {
        res.status(503).json({ error: 'ML service not available' });
    }
});

// ─── POST /api/forecast/refresh ──────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    try {
        await Forecast.deleteMany({ scope: 'global' });
        // Trigger both forecasts in parallel
        const [lstm, arima] = await Promise.allSettled([
            getOrRefreshForecast({ modelType: 'LSTM', scope: 'global', mlPath: '/predict/lstm', mlBody: { steps: 30 } }),
            getOrRefreshForecast({ modelType: 'ARIMA', scope: 'global', mlPath: '/predict/arima', mlBody: { steps: 12, order: [2, 1, 2] } }),
        ]);

        res.json({
            lstm: lstm.status === 'fulfilled' ? 'ok' : lstm.reason?.message,
            arima: arima.status === 'fulfilled' ? 'ok' : arima.reason?.message,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/forecast/health ────────────────────────────────────────────────
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${ML_BASE}/health`, { timeout: 5_000 });
        res.json({ ml_service: 'online', ...response.data });
    } catch {
        res.json({ ml_service: 'offline', message: 'Start with: python ml_service/app.py' });
    }
});

module.exports = router;
