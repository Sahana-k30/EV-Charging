const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res) => {
    try {
        // Fetch user's vehicles
        const vehicles = await Vehicle.find({ owner: req.user._id });

        // Fetch user's recent bookings
        const recentBookings = await Booking.find({ user: req.user._id })
            .populate('station')
            .populate('vehicle')
            .populate('payment')
            .sort('-startTime')
            .limit(5);

        // Fetch active bookings
        const activeBookings = await Booking.find({
            user: req.user._id,
            status: { $in: ['Scheduled', 'In Progress'] }
        })
            .populate('station')
            .populate('vehicle')
            .populate('payment')
            .sort('startTime');

        // Fetch nearby stations (simple example - you might want to add geolocation)
        const nearbyStations = await Station.find({
            status: 'Operational'
        }).limit(5);

        // Fetch recent payments
        const recentPayments = await Payment.find({
            user: req.user._id
        })
            .populate('booking')
            .sort('-createdAt')
            .limit(5);

        res.render('dashboard', {
            vehicles,
            recentBookings,
            activeBookings,
            nearbyStations,
            recentPayments,
            user: req.user
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
}; 