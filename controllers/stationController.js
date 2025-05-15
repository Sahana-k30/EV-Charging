const Station = require('../models/Station');

// Get all stations
exports.getAllStations = async (req, res) => {
    try {
        const stations = await Station.find();
        res.render('stations/index', { stations });
    } catch (error) {
        req.flash('error', 'Error fetching stations');
        res.redirect('/');
    }
};

// Get station details
exports.getStation = async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) {
            req.flash('error', 'Station not found');
            return res.redirect('/stations');
        }
        res.render('stations/show', { station });
    } catch (error) {
        req.flash('error', 'Error fetching station details');
        res.redirect('/stations');
    }
};

// Create new station (admin only)
exports.createStation = async (req, res) => {
    try {
        const station = new Station(req.body);
        await station.save();
        req.flash('success', 'Station created successfully');
        res.redirect('/stations');
    } catch (error) {
        req.flash('error', 'Error creating station');
        res.redirect('/stations/new');
    }
};

// Update station (admin only)
exports.updateStation = async (req, res) => {
    try {
        const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
        req.flash('success', 'Station updated successfully');
        res.redirect(`/stations/${station._id}`);
    } catch (error) {
        req.flash('error', 'Error updating station');
        res.redirect(`/stations/${req.params.id}/edit`);
    }
};

// Delete station (admin only)
exports.deleteStation = async (req, res) => {
    try {
        await Station.findByIdAndDelete(req.params.id);
        req.flash('success', 'Station deleted successfully');
        res.redirect('/stations');
    } catch (error) {
        req.flash('error', 'Error deleting station');
        res.redirect('/stations');
    }
}; 