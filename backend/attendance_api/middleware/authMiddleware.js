const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'eduguide_secret_2030';

const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer '))
            return res.status(401).json({ error: 'Access denied. No token provided.' });

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ error: 'User no longer exists.' });

        req.user = { id: user._id, role: user.role, name: user.name, email: user.email };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError')
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
