const express = require('express');
const router = express.Router();
const Anomaly = require('../models/Anomaly');

// GET all anomalous students
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, riskLevel = '', sort = '-anomaly_score' } = req.query;
        const query = {};
        if (riskLevel) query.risk_level = riskLevel;

        const total = await Anomaly.countDocuments(query);
        const anomalies = await Anomaly.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ anomalies, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET anomaly type summary
router.get('/type-summary', async (req, res) => {
    try {
        const summary = await Anomaly.aggregate([
            {
                $group: {
                    _id: '$anomaly_type',
                    count: { $sum: 1 },
                    avg_score: { $avg: '$anomaly_score' },
                    avg_rate: { $avg: '$attendance_rate' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single anomaly
router.get('/:id', async (req, res) => {
    try {
        const anomaly = await Anomaly.findOne({ student_id: req.params.id });
        if (!anomaly) return res.status(404).json({ message: 'Anomaly record not found' });
        res.json(anomaly);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
