const Vehicle = require('../models/Vehicle');

// Get user's vehicles
exports.getUserVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user._id });
        res.render('vehicles/index', { vehicles });
    } catch (error) {
        req.flash('error', 'Error fetching vehicles');
        res.redirect('/dashboard');
    }
};

// Add new vehicle
exports.addVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle({
            owner: req.user._id,
            make: req.body.make,
            model: req.body.model,
            year: req.body.year,
            licensePlate: req.body.licensePlate,
            batteryCapacity: req.body.batteryCapacity,
            chargingType: req.body.chargingType
        });

        await vehicle.save();
        req.flash('success', 'Vehicle added successfully');
        res.redirect('/vehicles');
    } catch (error) {
        req.flash('error', 'Error adding vehicle');
        res.redirect('/vehicles/new');
    }
};

// Get vehicle details
exports.getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (!vehicle) {
            req.flash('error', 'Vehicle not found');
            return res.redirect('/vehicles');
        }

        if (vehicle.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/vehicles');
        }

        res.render('vehicles/show', { vehicle });
    } catch (error) {
        req.flash('error', 'Error fetching vehicle details');
        res.redirect('/vehicles');
    }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (!vehicle || vehicle.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/vehicles');
        }

        vehicle.make = req.body.make;
        vehicle.model = req.body.model;
        vehicle.year = req.body.year;
        vehicle.licensePlate = req.body.licensePlate;
        vehicle.batteryCapacity = req.body.batteryCapacity;
        vehicle.chargingType = req.body.chargingType;

        await vehicle.save();
        req.flash('success', 'Vehicle updated successfully');
        res.redirect(`/vehicles/${vehicle._id}`);
    } catch (error) {
        req.flash('error', 'Error updating vehicle');
        res.redirect(`/vehicles/${req.params.id}/edit`);
    }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (!vehicle || vehicle.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/vehicles');
        }

        await vehicle.remove();
        req.flash('success', 'Vehicle deleted successfully');
        res.redirect('/vehicles');
    } catch (error) {
        req.flash('error', 'Error deleting vehicle');
        res.redirect('/vehicles');
    }
}; 