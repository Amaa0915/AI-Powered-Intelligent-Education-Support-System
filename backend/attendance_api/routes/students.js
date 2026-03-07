const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', riskLevel = '', sort = '-attendance_rate' } = req.query;
        const query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (riskLevel) query.risk_level = riskLevel;

        const total = await Student.countDocuments(query);
        const students = await Student.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ students, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findOne({ student_id: req.params.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET risk level summary
router.get('/stats/risk-summary', async (req, res) => {
    try {
        const summary = await Student.aggregate([
            { $group: { _id: '$risk_level', count: { $sum: 1 }, avg_rate: { $avg: '$attendance_rate' } } },
            { $sort: { _id: 1 } }
        ]);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
