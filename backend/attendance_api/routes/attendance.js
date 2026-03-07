const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

const PRESENT_COND = { $eq: ['$status', 'Present'] };

// GET attendance for a specific student
router.get('/student/:id', async (req, res) => {
    try {
        const { year, month } = req.query;
        const query = { student_id: req.params.id };
        if (year) query.year = parseInt(year);
        if (month) query.month = parseInt(month);
        const records = await Attendance.find(query).sort({ date: 1 }).limit(500);
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET monthly attendance summary across all students
router.get('/monthly-summary', async (req, res) => {
    try {
        const summary = await Attendance.aggregate([
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                }
            },
            { $addFields: { attendance_rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET day-of-week breakdown
router.get('/day-of-week', async (req, res) => {
    try {
        const DOW_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const breakdown = await Attendance.aggregate([
            { $match: { day_of_week: { $in: DOW_ORDER } } },
            {
                $group: {
                    _id: '$day_of_week',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                }
            },
            { $addFields: { attendance_rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
            { $sort: { attendance_rate: -1 } }
        ]);
        res.json(breakdown);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET weather correlation
router.get('/weather-correlation', async (req, res) => {
    try {
        const correlation = await Attendance.aggregate([
            { $match: { weather_condition: { $exists: true, $ne: null, $ne: '' } } },
            {
                $group: {
                    _id: '$weather_condition',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                    avg_temp: { $avg: '$temperature' }
                }
            },
            { $addFields: { attendance_rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
            { $sort: { attendance_rate: -1 } }
        ]);
        res.json(correlation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET event-type breakdown across all students
router.get('/event-breakdown', async (req, res) => {
    try {
        const breakdown = await Attendance.aggregate([
            { $match: { school_event: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$school_event',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                }
            },
            { $addFields: { attendance_rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { attendance_rate: -1 } }
        ]);
        res.json(breakdown);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET attendance rate grouped by distance band
const BAND_ORDER = ['Nearby', 'Moderate', 'Far', 'Very Far'];
router.get('/distance-impact', async (req, res) => {
    try {
        const raw = await Attendance.aggregate([
            { $match: { distance_band: { $exists: true, $ne: null, $ne: '' } } },
            {
                $group: {
                    _id: '$distance_band',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                    avg_distance: { $avg: '$distance_km' },
                }
            },
            { $addFields: { attendance_rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
        ]);
        // Sort by predefined band order
        const sorted = BAND_ORDER
            .map(band => raw.find(r => r._id === band))
            .filter(Boolean)
            .map(r => ({ band: r._id, total: r.total, present: r.present, attendance_rate: r.attendance_rate, avg_distance: Math.round(r.avg_distance * 10) / 10 }));
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET filtered attendance rate for a specific student
// Query params: student_id (required), day_of_week, weather_condition, school_event, is_before_holiday
router.get('/student-filter', async (req, res) => {
    try {
        const { student_id, day_of_week, weather_condition, school_event, is_before_holiday } = req.query;
        if (!student_id) return res.status(400).json({ message: 'student_id is required' });

        // Build filtered match
        const match = { student_id };
        if (day_of_week && day_of_week !== 'All') match.day_of_week = day_of_week;
        if (weather_condition && weather_condition !== 'All') match.weather_condition = weather_condition;
        if (school_event && school_event !== 'All') match.school_event = school_event;
        if (is_before_holiday !== undefined && is_before_holiday !== 'All') match.is_before_holiday = is_before_holiday === 'true';

        // Overall filtered rate
        const [overall] = await Attendance.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [PRESENT_COND, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                }
            },
            { $addFields: { attendance_rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } }
        ]);

        // Base match without day_of_week (to show all-day breakdown)
        const baseMatch = { student_id };
        if (weather_condition && weather_condition !== 'All') baseMatch.weather_condition = weather_condition;
        if (school_event && school_event !== 'All') baseMatch.school_event = school_event;
        if (is_before_holiday !== undefined && is_before_holiday !== 'All') baseMatch.is_before_holiday = is_before_holiday === 'true';

        const DOW_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Day-of-week breakdown
        const dowRaw = await Attendance.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$day_of_week', total: { $sum: 1 }, present: { $sum: { $cond: [PRESENT_COND, 1, 0] } } } },
            { $addFields: { rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
        ]);
        const dow_breakdown = DOW_ORDER.map(d => dowRaw.find(x => x._id === d)).filter(Boolean);

        // Weather breakdown for this student
        const weather_breakdown = await Attendance.aggregate([
            { $match: { student_id, weather_condition: { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: '$weather_condition', total: { $sum: 1 }, present: { $sum: { $cond: [PRESENT_COND, 1, 0] } } } },
            { $addFields: { rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { rate: -1 } }
        ]);

        // Event breakdown for this student
        const event_breakdown = await Attendance.aggregate([
            { $match: { student_id, school_event: { $exists: true, $ne: null } } },
            { $group: { _id: '$school_event', total: { $sum: 1 }, present: { $sum: { $cond: [PRESENT_COND, 1, 0] } } } },
            { $addFields: { rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { rate: -1 } }
        ]);

        // Monthly breakdown
        const monthly = await Attendance.aggregate([
            { $match: match },
            { $group: { _id: { year: '$year', month: '$month' }, total: { $sum: 1 }, present: { $sum: { $cond: [PRESENT_COND, 1, 0] } } } },
            { $addFields: { rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Distance info for student (static per student)
        const distanceInfo = await Attendance.findOne({ student_id, distance_km: { $exists: true } }, { distance_km: 1, distance_band: 1 });

        const empty = {
            student_id, attendance_rate: null, total: 0, present: 0, absent: 0, dow_breakdown, weather_breakdown, event_breakdown, monthly,
            distance_km: distanceInfo?.distance_km ?? null, distance_band: distanceInfo?.distance_band ?? null
        };
        if (!overall) return res.json(empty);

        res.json({
            student_id,
            attendance_rate: overall.attendance_rate,
            total: overall.total,
            present: overall.present,
            absent: overall.absent,
            distance_km: distanceInfo?.distance_km ?? null,
            distance_band: distanceInfo?.distance_band ?? null,
            dow_breakdown,
            weather_breakdown,
            event_breakdown,
            monthly,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
