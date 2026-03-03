const express = require('express');
const router = express.Router();
const { protect, isLoggedIn } = require('../middleware/auth');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
// const { isAuthenticated } = require('../middleware/auth'); // not exported any longer, use protect


// @route   GET /
// @desc    Home page (API)
router.get('/', isLoggedIn, (req, res) => {
    res.json({ message: 'Welcome to the EV Charging API', user: req.user || null });
});

// @route   GET /dashboard
// @desc    Dashboard data (API)
router.get('/dashboard', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('vehicles')
            .lean();

        const activeBookings = await Booking.find({
            user: req.user._id,
            status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
        })
        .populate('station')
        .populate('vehicle')
        .sort({ startTime: 1 })
        .lean();

        const recentPayments = await Payment.find({
            user: req.user._id
        })
        .populate('booking')
        .populate('station')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        const bookingStats = await Booking.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);

        const totalSpentAgg = await Payment.aggregate([
            { $match: { 
                user: req.user._id,
                status: 'Completed'
            }},
            { $group: {
                _id: null,
                total: { $sum: '$amount' }
            }}
        ]);

        const favoriteStations = await Booking.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$station',
                visits: { $sum: 1 }
            }},
            { $sort: { visits: -1 } },
            { $limit: 3 }
        ]);

        res.json({
            user,
            activeBookings,
            recentPayments,
            bookingStats: Object.fromEntries(bookingStats.map(stat => [stat._id, stat.count])),
            totalSpent: totalSpentAgg[0]?.total || 0,
            favoriteStations
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Error loading dashboard' });
    }
});

// registration/login handled by app.js POST endpoints; GETs return minimal JSON
router.get('/register', (req, res) => { res.json({}); });
router.get('/login', (req, res) => { res.json({}); });

module.exports = router; 