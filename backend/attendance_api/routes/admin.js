const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const User = require('../models/User');

// All admin routes require authentication + admin role
router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/stats — dashboard summary
router.get('/stats', async (req, res) => {
    try {
        const [total, students, admins, recent] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
        ]);
        res.json({ total, students, admins, recentSignups: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        if (req.params.id === req.user.id.toString())
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'admin'].includes(role))
            return res.status(400).json({ error: 'Role must be student or admin.' });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
