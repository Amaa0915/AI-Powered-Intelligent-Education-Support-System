const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected — get current user
router.get('/me', authMiddleware, getMe);

module.exports = router;
