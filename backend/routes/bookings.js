const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @route   GET /bookings
// @desc    Get user's bookings (API)
router.get('/', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('station', 'name location')
            .populate('vehicle', 'make model licensePlate')
            .sort('-startTime');
        res.json({ bookings });
    } catch (err) {
        console.error("Error in GET /bookings:", err);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// @route   GET /bookings/new
// @desc    Provide data needed to create booking
router.get('/new', protect, async (req, res) => {
    try {
        const { stationId, pointId } = req.query;
        const vehicles = await Vehicle.find({ userId: req.user._id });
        let station = null;
        if (stationId) {
            station = await Station.findById(stationId);
            if (!station) {
                return res.status(404).json({ error: 'Station not found' });
            }
        }
        res.json({ vehicles, station, selectedPointId: pointId });
    } catch (err) {
        console.error("Error in GET /bookings/new:",err);
        res.status(500).json({ error: 'Error loading booking form' });
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
            return res.status(400).json({ error: 'All fields are required for booking.' });
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

        const booking = await Booking.create({
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

        res.status(201).json({ booking });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: 'Error creating booking. Please try again.' });
    }
});

// @route   GET /bookings/:id
// @desc    Get booking details
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id
        })
            .populate({ path: 'station', model: 'Station' })
            .populate('vehicle');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (err) {
        console.error("Error in GET /bookings/:id :", err);
        res.status(500).json({ error: 'Error fetching booking details' });
    }
});

// @route   PUT /bookings/:id/cancel
// @desc    Cancel a booking
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id,
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