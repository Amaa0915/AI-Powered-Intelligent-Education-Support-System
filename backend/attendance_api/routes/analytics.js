const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// GET overall dashboard summary stats
router.get('/summary', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const anomalousStudents = await Student.countDocuments({ is_anomalous: true });
        const criticalStudents = await Student.countDocuments({ risk_level: 'critical' });
        const highRiskStudents = await Student.countDocuments({ risk_level: 'high' });

        const avgRateResult = await Student.aggregate([
            { $group: { _id: null, avg_rate: { $avg: '$attendance_rate' }, avg_absences: { $avg: '$absent_days' } } }
        ]);

        const totalRecords = await Attendance.countDocuments();
        const presentRecords = await Attendance.countDocuments({ status: 'Present' });
        const overallRate = totalRecords ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0;

        res.json({
            totalStudents,
            anomalousStudents,
            criticalStudents,
            highRiskStudents,
            avgAttendanceRate: avgRateResult[0]?.avg_rate?.toFixed(2) || 0,
            overallAttendanceRate: parseFloat(overallRate),
            totalRecords,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET grade-wise attendance breakdown
router.get('/grade-breakdown', async (req, res) => {
    try {
        const breakdown = await Student.aggregate([
            {
                $group: {
                    _id: '$grade',
                    count: { $sum: 1 },
                    avg_attendance: { $avg: '$attendance_rate' },
                    anomalous: { $sum: { $cond: ['$is_anomalous', 1, 0] } },
                    critical: { $sum: { $cond: [{ $eq: ['$risk_level', 'critical'] }, 1, 0] } },
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(breakdown);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET attendance rate distribution (for histogram)
router.get('/rate-distribution', async (req, res) => {
    try {
        const distribution = await Student.aggregate([
            {
                $bucket: {
                    groupBy: '$attendance_rate',
                    boundaries: [0, 50, 60, 70, 75, 80, 85, 90, 95, 100],
                    default: '100+',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        res.json(distribution);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
