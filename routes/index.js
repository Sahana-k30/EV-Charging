const express = require('express');
const router = express.Router();
const { protect, isLoggedIn } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /
// @desc    Home page
router.get('/', isLoggedIn, (req, res) => {
    res.render('index');
});

// @route   GET /dashboard
// @desc    Dashboard page
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // Get user with populated vehicles
        const user = await User.findById(req.user._id)
            .populate('vehicles')
            .lean();

        // Get user's active bookings
        const activeBookings = await Booking.find({
            user: req.user._id,
            status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
        })
        .populate('station')
        .populate('vehicle')
        .sort({ startTime: 1 })
        .lean();

        // Get user's recent payments
        const recentPayments = await Payment.find({
            user: req.user._id
        })
        .populate('booking')
        .populate('station')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        // Get booking statistics
        const bookingStats = await Booking.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);

        // Get total amount spent
        const totalSpent = await Payment.aggregate([
            { $match: { 
                user: req.user._id,
                status: 'Completed'
            }},
            { $group: {
                _id: null,
                total: { $sum: '$amount' }
            }}
        ]);

        // Get favorite charging stations (most used)
        const favoriteStations = await Booking.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$station',
                visits: { $sum: 1 }
            }},
            { $sort: { visits: -1 } },
            { $limit: 3 }
        ]);

        res.render('dashboard', {
            user,
            activeBookings,
            recentPayments,
            bookingStats: Object.fromEntries(bookingStats.map(stat => [stat._id, stat.count])),
            totalSpent: totalSpent[0]?.total || 0,
            favoriteStations
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// @route   GET /register
// @desc    Register page
router.get('/register', (req, res) => {
    res.render('register');
});

// @route   GET /login
// @desc    Login page
router.get('/login', (req, res) => {
    res.render('login');
});

module.exports = router; 