const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            req.flash('error_msg', 'User already exists');
            return res.redirect('/register');
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            phone,
            address
        });

        await user.save();

        // Set user session
        req.session.userId = user._id;

        req.flash('success_msg', 'Registration successful! Welcome to EV Charging.');
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Server Error');
        res.redirect('/register');
    }
});

// @route   POST /users/login
// @desc    Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error_msg', 'Please provide both email and password');
            return res.redirect('/login');
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/login');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/login');
        }

        // Set user session
        req.session.userId = user._id;
        
        // Set success message and redirect
        req.flash('success_msg', 'Welcome back!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Login Error:', err);
        req.flash('error_msg', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
});

// @route   GET /users/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
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
            req.flash('error_msg', 'User not found');
            return res.redirect('/dashboard');
        }
        
        res.render('users/profile', { 
            title: 'Profile',
            user: user
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching profile');
        res.redirect('/dashboard');
    }
});

// @route   PUT /users/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, address },
            { new: true, runValidators: true }
        );
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/users/profile');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating profile');
        res.redirect('/users/profile');
    }
});

module.exports = router; 