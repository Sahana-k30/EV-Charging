const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @route   GET /bookings
// @desc    Get user's bookings
router.get('/', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('station', 'name location')
            .populate('vehicle', 'make model licensePlate')
            .sort('-startTime');

        if (req.xhr) {
            res.json(bookings);
        } else {
            res.render('bookings/index', { bookings });
        }
    } catch (err) {
        console.error("Error in GET /bookings:", err);
        if (req.xhr) {
            res.status(500).json({ error: 'Error fetching bookings' });
        } else {
            req.flash('error_msg', 'Error fetching bookings');
            res.redirect('/dashboard');
        }
    }
});

// @route   GET /bookings/new
// @desc    Show booking form
router.get('/new', protect, async (req, res) => {
    try {
        const { stationId, pointId } = req.query;
        const vehicles = await Vehicle.find({ userId: req.user.id });
        let station = null;
        if (stationId) {
            station = await Station.findById(stationId);
            if (!station) {
                req.flash('error_msg', 'Station not found');
                return res.redirect('/stations');
            }
        }
        res.render('bookings/new', { 
            vehicles,
            station,
            selectedPointId: pointId
        });
    } catch (err) {
        console.error("Error in GET /bookings/new:",err);
        req.flash('error_msg', 'Error loading booking form');
        res.redirect('/stations');
    }
});

// @route   POST /bookings
// @desc    Create a new booking
router.post('/', protect, async (req, res) => {
    try {
        const {
            stationId,
            vehicleId,
            chargingPoint,
            startTime,
            duration,
            currentBattery,
            targetBattery
        } = req.body;

        if (!stationId || !vehicleId || !chargingPoint || !startTime || !duration || !currentBattery || !targetBattery) {
            req.flash('error_msg', 'All fields are required for booking.');
            return res.redirect('back');
        }

        let chargingPointObj = chargingPoint;
        if (typeof chargingPoint === 'string') {
            try {
                chargingPointObj = JSON.parse(chargingPoint);
            } catch (e) {
                chargingPointObj = {};
            }
        }

        const endTime = new Date(new Date(startTime).getTime() + parseFloat(duration) * 60 * 60 * 1000);

        await Booking.create({
            user: req.user._id,
            station: stationId,
            vehicle: vehicleId,
            startTime,
            endTime,
            duration: parseFloat(duration),
            initialBatteryLevel: parseInt(currentBattery),
            targetBatteryLevel: parseInt(targetBattery),
            chargingPoint: chargingPointObj,
            status: 'Pending'
        });

        // Redirect to bookings page after successful creation
        return res.redirect('/bookings');
    } catch (err) {
        console.error('Error creating booking:', err);
        req.flash('error_msg', 'Error creating booking. Please try again.');
        return res.redirect('back');
    }
});

// @route   GET /bookings/:id
// @desc    Get booking details
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        })
            .populate({ path: 'station', model: 'Station' })
            .populate('vehicle');

        if (!booking) {
            if (req.xhr) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            req.flash('error_msg', 'Booking not found');
            return res.redirect('/bookings');
        }

        if (req.xhr) {
            res.json(booking);
        } else {
            res.render('bookings/details', { booking });
        }
    } catch (err) {
        console.error("Error in GET /bookings/:id :", err);
        if (req.xhr) {
            res.status(500).json({ error: 'Error fetching booking details' });
        } else {
            req.flash('error_msg', 'Error fetching booking details');
            res.redirect('/bookings');
        }
    }
});

// @route   PUT /bookings/:id/cancel
// @desc    Cancel a booking
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: { $in: ['Scheduled', 'In Progress', 'Confirmed'] }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or cannot be cancelled' });
        }

        booking.status = 'Cancelled';
        await booking.save();

        // Update charging point status back to Available
        await Station.findOneAndUpdate(
            {
                _id: booking.station,
                'chargingPoints.pointId': booking.chargingPoint.pointId
            },
            {
                $set: {
                    'chargingPoints.$.status': 'Available',
                    'chargingPoints.$.currentBooking': null
                }
            }
        );

        res.json({ success: true, booking, message: 'Booking cancelled successfully.' });
    } catch (err) {
        console.error("Error in PUT /bookings/:id/cancel :",err);
        res.status(500).json({ success: false, message: 'Error cancelling booking' });
    }
});

// @route   PUT /bookings/:id/complete
// @desc    Complete a booking and update final battery level
router.put('/:id/complete', protect, async (req, res) => {
    try {
        const { finalBatteryLevel, energyConsumed } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'In Progress'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or cannot be completed' });
        }

        booking.status = 'Completed';
        if(finalBatteryLevel) booking.finalBatteryLevel = parseFloat(finalBatteryLevel);
        if(energyConsumed) booking.energyConsumed = parseFloat(energyConsumed);
        booking.actualEndTime = new Date();
        await booking.save();

        // Update charging point status back to Available
        await Station.findOneAndUpdate(
            {
                _id: booking.station,
                'chargingPoints.pointId': booking.chargingPoint.pointId
            },
            {
                $set: {
                    'chargingPoints.$.status': 'Available',
                    'chargingPoints.$.currentBooking': null
                }
            }
        );

        // Update vehicle's current range
        await Vehicle.findByIdAndUpdate(
            booking.vehicle,
            { 
                currentRange: booking.finalBatteryLevel || booking.targetBatteryLevel,
                lastCharged: new Date()
            }
        );

        res.json({ success: true, booking, message: 'Booking completed successfully.' });
    } catch (err) {
        console.error("Error in PUT /bookings/:id/complete :", err);
        res.status(500).json({ success: false, message: 'Error completing booking' });
    }
});

// @route   PUT /bookings/:id/start
// @desc    Start a scheduled booking
router.put('/:id/start', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'Confirmed'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or cannot be started' });
        }

        const now = new Date();
        const bookingStartTime = new Date(booking.startTime);
        const timeWindow = 15 * 60 * 1000; // 15 minutes

        if (now < new Date(bookingStartTime.getTime() - timeWindow) || now > new Date(booking.endTime)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Booking can only be started within 15 minutes of scheduled start time and before scheduled end time.' 
            });
        }

        booking.status = 'In Progress';
        booking.actualStartTime = new Date();
        await booking.save();

        await Station.updateOne(
            { _id: booking.station, 'chargingPoints.pointId': booking.chargingPoint.pointId },
            { $set: { 'chargingPoints.$.status': 'Occupied', 'chargingPoints.$.currentBooking': booking._id } }
        );

        res.json({ success: true, booking, message: 'Booking started successfully.' });
    } catch (err) {
        console.error("Error in PUT /bookings/:id/start :", err);
        res.status(500).json({ success: false, message: 'Error starting booking' });
    }
});

module.exports = router; 