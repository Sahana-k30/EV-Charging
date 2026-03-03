const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /users/register
// @desc    Register a new user (API)
router.post('/register', async (req, res) => {
    try {
        console.log('🔍 Register attempt with data:', req.body);
        
        const { name, email, password, phoneNumber, address, city, state } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phoneNumber) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Name, email, password, and phone number are required' });
        }

        // Check if user already exists
        console.log('🔍 Checking if email exists...');
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('❌ User already exists with email:', email);
            return res.status(400).json({ error: 'Email is already registered' });
        }

        console.log('✅ Email does not exist, creating new user...');
        // Create new user
        const user = new User({
            name,
            email,
            password,
            phoneNumber,
            location: {
                address: address || '',
                city: city || '',
                state: state || ''
            }
        });

        console.log('💾 Saving user to database...');
        await user.save();
        console.log('✅ User saved successfully:', user._id);
        
        req.session.userId = user._id;
        console.log('✅ Session created');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (err) {
        console.error('❌ Registration error:', err.message);
        console.error('Stack:', err.stack);
        
        // Handle duplicate key error
        if (err.code === 11000) {
            console.log('❌ Duplicate key error');
            return res.status(400).json({ error: 'Email is already registered' });
        }
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            console.log('❌ Validation error:', messages);
            return res.status(400).json({ error: messages.join(', ') });
        }
        
        console.log('❌ Server error responding to client');
        res.status(500).json({ error: 'Error during registration. Please try again.' });
    }
});

// @route   POST /users/login
// @desc    Login user (API)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.userId = user._id;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
});

// @route   GET /users/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

// @route   GET /users/profile
// @desc    Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('vehicles')
            .populate({
                path: 'bookings',
                populate: {
                    path: 'station',
                    select: 'name location'
                }
            });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// @route   PUT /users/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, address },
            { new: true, runValidators: true }
        );
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

module.exports = router; 