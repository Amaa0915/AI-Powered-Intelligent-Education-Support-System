const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'eduguide_secret_2030';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const signToken = (id, role) =>
    jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required' });

        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
            return res.status(409).json({ error: 'An account with this email already exists' });

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role === 'admin' ? 'admin' : 'student',
        });

        const token = signToken(user._id, user.role);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        if (err.code === 11000)
            return res.status(409).json({ error: 'Email already registered' });
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !user.password)
            return res.status(401).json({ error: 'Invalid email or password' });

        const match = await user.comparePassword(password);
        if (!match)
            return res.status(401).json({ error: 'Invalid email or password' });

        const token = signToken(user._id, user.role);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/google
exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential)
            return res.status(400).json({ error: 'Google credential token is required' });

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID || undefined,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Find or create user
        let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

        if (!user) {
            user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                avatar: picture,
                role: 'student',
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.avatar = picture;
            await user.save();
        }

        const token = signToken(user._id, user.role);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        });
    } catch (err) {
        res.status(401).json({ error: 'Google authentication failed: ' + err.message });
    }
};

// GET /api/auth/me  (requires auth middleware)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
