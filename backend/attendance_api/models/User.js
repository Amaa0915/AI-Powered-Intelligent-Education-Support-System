const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // never returned by default
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
    },
    googleId: {
        type: String,
        default: null,
    },
    avatar: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password with hash
userSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
