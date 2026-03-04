const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');

// @route   GET /vehicles
// @desc    Get all user vehicles (API)
router.get('/', protect, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ userId: req.user._id });
        res.json({ vehicles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching vehicles' });
    }
});

// @route   GET /vehicles/add
// @desc    (deprecated) form endpoint, returns empty
router.get('/add', protect, (req, res) => {
    res.json({});
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

        // Validate required fields
        if (!make || !model || !year || !licensePlate || !batteryCapacity || !chargingType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create vehicle with userId to associate with current user
        const vehicle = await Vehicle.create({
            userId: req.user._id,
            make,
            model,
            year,
            licensePlate,
            batteryCapacity,
            chargingType,
            currentRange: currentRange || 0
        });
        
        res.status(201).json({ vehicle });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'License plate already exists' });
        }
        res.status(500).json({ error: 'Error adding vehicle' });
    }
});

// @route   GET /vehicles/:id
// @desc    Get vehicle details
router.get('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.json({ vehicle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching vehicle details' });
    }
});

// @route   GET /vehicles/:id/edit
// @desc    (deprecated) return vehicle for editing
router.get('/:id/edit', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.json({ vehicle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching vehicle' });
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
            { _id: req.params.id, userId: req.user._id },
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
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ vehicle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating vehicle' });
    }
});

// @route   DELETE /vehicles/:id
// @desc    Delete vehicle
router.delete('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting vehicle' });
    }
});

// @route   PUT /vehicles/:id/update-range
// @desc    Update vehicle current range
router.put('/:id/update-range', protect, async (req, res) => {
    try {
        const { currentRange } = req.body;

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
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