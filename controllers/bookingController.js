const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');

// Get user's bookings
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('station')
            .populate('vehicle')
            .populate('payment')
            .sort('-startTime');
        res.render('bookings/index', { bookings });
    } catch (error) {
        req.flash('error', 'Error fetching bookings');
        res.redirect('/dashboard');
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        // Check if station and charging point are available
        const station = await Station.findById(req.body.station);
        const chargingPoint = station.chargingPoints.find(
            point => point.pointNumber === parseInt(req.body.chargingPoint)
        );

        if (!chargingPoint || chargingPoint.status !== 'Available') {
            req.flash('error', 'Charging point not available');
            return res.redirect(`/stations/${req.body.station}`);
        }

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            station: req.body.station,
            vehicle: req.body.vehicle,
            chargingPoint: req.body.chargingPoint,
            startTime: new Date(req.body.startTime),
            endTime: new Date(req.body.endTime)
        });

        // Update charging point status
        chargingPoint.status = 'Occupied';
        chargingPoint.currentBooking = booking._id;
        await station.save();

        // Save booking
        await booking.save();

        // Create pending payment
        const payment = new Payment({
            booking: booking._id,
            user: req.user._id,
            amount: req.body.estimatedCost,
            paymentMethod: req.body.paymentMethod
        });
        await payment.save();

        // Update booking with payment reference
        booking.payment = payment._id;
        await booking.save();

        req.flash('success', 'Booking created successfully');
        res.redirect(`/bookings/${booking._id}`);
    } catch (error) {
        req.flash('error', 'Error creating booking');
        res.redirect(`/stations/${req.body.station}`);
    }
};

// Get booking details
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('station')
            .populate('vehicle')
            .populate('payment');
        
        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/bookings');
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/bookings');
        }

        res.render('bookings/show', { booking });
    } catch (error) {
        req.flash('error', 'Error fetching booking details');
        res.redirect('/bookings');
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/bookings');
        }

        if (booking.status !== 'Scheduled') {
            req.flash('error', 'Cannot cancel this booking');
            return res.redirect(`/bookings/${booking._id}`);
        }

        // Update booking status
        booking.status = 'Cancelled';
        await booking.save();

        // Free up charging point
        const station = await Station.findById(booking.station);
        const chargingPoint = station.chargingPoints.find(
            point => point.pointNumber === booking.chargingPoint
        );
        chargingPoint.status = 'Available';
        chargingPoint.currentBooking = null;
        await station.save();

        // Update payment status if exists
        if (booking.payment) {
            const payment = await Payment.findById(booking.payment);
            payment.status = 'Refunded';
            payment.refundedAt = new Date();
            await payment.save();
        }

        req.flash('success', 'Booking cancelled successfully');
        res.redirect('/bookings');
    } catch (error) {
        req.flash('error', 'Error cancelling booking');
        res.redirect(`/bookings/${req.params.id}`);
    }
}; 