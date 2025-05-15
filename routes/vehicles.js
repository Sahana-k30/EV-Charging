const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @route   GET /vehicles
// @desc    Get all user vehicles
router.get('/', protect, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user.id });
        res.render('vehicles/index', { vehicles });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching vehicles');
        res.redirect('/dashboard');
    }
});

// @route   GET /vehicles/add
// @desc    Show add vehicle form
router.get('/add', protect, (req, res) => {
    res.render('vehicles/add');
});

// @route   POST /vehicles
// @desc    Add a new vehicle
router.post('/', protect, async (req, res) => {
    try {
        const {
            make,
            model,
            year,
            licensePlate,
            batteryCapacity,
            chargingType,
            currentRange
        } = req.body;

        // Create vehicle
        const vehicle = await Vehicle.create({
            owner: req.user.id,
            make,
            model,
            year,
            licensePlate,
            batteryCapacity,
            chargingType,
            currentRange
        });

        // Add vehicle to user's vehicles array
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { vehicles: vehicle._id } }
        );

        req.flash('success_msg', 'Vehicle added successfully');
        res.redirect('/vehicles');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding vehicle');
        res.redirect('/vehicles/add');
    }
});

// @route   GET /vehicles/:id
// @desc    Get vehicle details
router.get('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found');
            return res.redirect('/vehicles');
        }

        res.render('vehicles/details', { vehicle });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching vehicle details');
        res.redirect('/vehicles');
    }
});

// @route   GET /vehicles/:id/edit
// @desc    Show edit vehicle form
router.get('/:id/edit', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found');
            return res.redirect('/vehicles');
        }

        res.render('vehicles/edit', { vehicle });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching vehicle');
        res.redirect('/vehicles');
    }
});

// @route   PUT /vehicles/:id
// @desc    Update vehicle
router.put('/:id', protect, async (req, res) => {
    try {
        const {
            make,
            model,
            year,
            licensePlate,
            batteryCapacity,
            chargingType,
            currentRange
        } = req.body;

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            {
                make,
                model,
                year,
                licensePlate,
                batteryCapacity,
                chargingType,
                currentRange
            },
            { new: true, runValidators: true }
        );

        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found');
            return res.redirect('/vehicles');
        }

        req.flash('success_msg', 'Vehicle updated successfully');
        res.redirect(`/vehicles/${req.params.id}`);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating vehicle');
        res.redirect(`/vehicles/${req.params.id}/edit`);
    }
});

// @route   DELETE /vehicles/:id
// @desc    Delete vehicle
router.delete('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found');
            return res.redirect('/vehicles');
        }

        // Remove vehicle from user's vehicles array
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { vehicles: req.params.id } }
        );

        req.flash('success_msg', 'Vehicle removed successfully');
        res.redirect('/vehicles');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting vehicle');
        res.redirect('/vehicles');
    }
});

// @route   PUT /vehicles/:id/update-range
// @desc    Update vehicle current range
router.put('/:id/update-range', protect, async (req, res) => {
    try {
        const { currentRange } = req.body;

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { currentRange },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ success: false, error: 'Vehicle not found' });
        }

        res.json({ success: true, vehicle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router; 