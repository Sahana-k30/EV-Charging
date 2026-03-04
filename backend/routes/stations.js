const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Station = require('../models/Station');
// const Vehicle = require('../models/Vehicle'); // Removed Vehicle model requirement
const sampleStationsRaw = require('../data/sampleStations');
const mongoose = require('mongoose');

// Remove _id from sampleStations before inserting
const sampleStations = sampleStationsRaw.map(({ _id, ...rest }) => rest);

// @route   GET /stations (Reverted to a simpler version)
// @desc    Get all charging stations from DB and display them
// @access  Protected
router.get('/', protect, async (req, res) => {
    console.log('DEBUG: Reached GET /stations route'); // Reverted log
    try {
        const allStationsFromDB = await Station.find({}).lean(); 
        console.log(`DEBUG: Found ${allStationsFromDB.length} stations in DB.`); // Reverted log

        if (allStationsFromDB.length === 0 && sampleStations.length > 0) {
            console.log('DEBUG: No stations in DB, attempting to render with in-memory sampleStations.'); // Reverted log
            const stationsToRender = sampleStations.map(s => ({...s, _id: s.id || new mongoose.Types.ObjectId().toString() }));
            return res.json({ stations: stationsToRender });
        }

        const stationsToRender = allStationsFromDB.map(station => ({
            ...station,
            _id: station._id.toString(),
            averageRating: station.ratings && station.ratings.length > 0
                ? (station.ratings.reduce((acc, curr) => acc + curr.rating, 0) / station.ratings.length).toFixed(1)
                : 'N/A',
            // Reverted to version without explicit check, assuming chargingPoints exists as per original structure
            availablePoints: station.chargingPoints.filter(point => point.status === 'Available').length,
            totalPoints: station.chargingPoints.length
        }));

        console.log('DEBUG: Rendering stations/index with stations from DB.'); // Reverted log
        res.json({ stations: stationsToRender });

    } catch (err) {
        console.error('DEBUG: Error in simplified GET /stations route:', err);
        res.status(500).json({ error: 'Error loading stations. Please try again.' });
    }
});

// @route   GET /nearby
// @desc    Get nearby stations based on user geolocation
// @access  Protected
router.get('/nearby', protect, async (req, res) => {
    try {
        const { lat, lng, maxDistance = 15000 } = req.query; // maxDistance in meters
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const stations = await Station.find({
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).lean();

        const stationsWithDetails = stations.map(station => ({
            ...station,
            _id: station._id.toString(),
            availablePoints: station.chargingPoints.filter(point => point.status === 'Available').length,
            totalPoints: station.chargingPoints.length
        }));

        res.json({ stations: stationsWithDetails });
    } catch (err) {
        console.error('Error fetching nearby stations:', err);
        res.status(500).json({ error: 'Error fetching nearby stations' });
    }
});

// @route   GET /stations/:id
// @desc    Get station details
router.get('/:id', protect, async (req, res) => { 
    console.log(`DEBUG: Reached GET /stations/${req.params.id} route`);
    try {
        const station = await Station.findById(req.params.id)
            .populate({
                path: 'ratings.user',
                select: 'name'
            })
            .lean();

        if (!station) {
            console.log(`DEBUG: Station with id ${req.params.id} not found.`);
            req.flash('error_msg', 'Station not found');
            return res.redirect('/stations');
        }
        console.log(`DEBUG: Found station: ${station.name}`);

        const averageRating = station.ratings && station.ratings.length > 0
            ? (station.ratings.reduce((acc, curr) => acc + curr.rating, 0) / station.ratings.length).toFixed(1)
            : 'N/A';

        const stationData = { ...station, _id: station._id.toString(), averageRating };

        res.json({ station: stationData });
    } catch (err) {
        console.error(`DEBUG: Error in GET /stations/${req.params.id} route:`, err);
        res.status(500).json({ error: 'Error fetching station details' });
    }
});

// @route   GET /stations/:id/availability
// @desc    Get real-time availability of charging points
router.get('/:id/availability', async (req, res) => {
    try {
        const station = await Station.findById(req.params.id)
            .select('chargingPoints')
            .populate({
                path: 'chargingPoints.currentBooking',
                select: 'startTime endTime status'
            });

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        const currentTime = new Date();
        const availability = station.chargingPoints.map(point => {
            let status = point.status;
            
            if (status === 'Occupied' && point.currentBooking) {
                if (point.currentBooking.status === 'Completed' || 
                    new Date(point.currentBooking.endTime) < currentTime) { // Ensure date comparison
                    status = 'Available';
                }
            }

            return {
                pointId: point.pointId || point._id.toString(), // Ensure pointId is available
                type: point.type,
                power: point.power,
                status: status,
                nextAvailable: point.currentBooking && status === 'Occupied' 
                    ? new Date(point.currentBooking.endTime).toISOString()
                    : null
            };
        });

        res.json(availability);
    } catch (err) {
        console.error('Error fetching availability:', err);
        res.status(500).json({ error: 'Error fetching availability' });
    }
});

// Admin Routes
// @route   POST /stations
// @desc    Add a new charging station
router.post('/', protect, authorize('admin'), async (req, res) => {
    console.log('DEBUG: Reached POST /stations (admin add) route');
    try {
        const station = await Station.create(req.body);
        res.status(201).json(station);
    } catch (err) {
        console.error('DEBUG: Error creating station:', err);
        res.status(500).json({ error: 'Error creating station' });
    }
});

// @route   PUT /stations/:id
// @desc    Update a charging station
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    console.log(`DEBUG: Reached PUT /stations/${req.params.id} (admin update) route`);
    try {
        const station = await Station.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        res.json(station);
    } catch (err) {
        console.error('DEBUG: Error updating station:', err);
        res.status(500).json({ error: 'Error updating station' });
    }
});

// @route   PUT /stations/:id/charging-point/:pointId
// @desc    Update charging point status
router.put('/:id/charging-point/:pointId', protect, async (req, res) => {
    console.log(`DEBUG: Reached PUT /stations/${req.params.id}/charging-point/${req.params.pointId} route`);
    try {
        const { status } = req.body;
        const station = await Station.findOneAndUpdate(
            {
                _id: req.params.id,
                'chargingPoints._id': req.params.pointId
            },
            {
                $set: {
                    'chargingPoints.$.status': status
                }
            },
            { new: true }
        );

        if (!station) {
            return res.status(404).json({ error: 'Station or charging point not found' });
        }
        res.json(station);
    } catch (err) {
        console.error('DEBUG: Error updating charging point status:', err);
        res.status(500).json({ error: 'Error updating charging point status' });
    }
});

// @route   POST /stations/:id/ratings
// @desc    Add a rating for a charging station
router.post('/:id/ratings', protect, async (req, res) => {
    console.log(`DEBUG: Reached POST /stations/${req.params.id}/ratings route`);
    try {
        const { rating, comment } = req.body;
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const station = await Station.findById(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        const existingRating = station.ratings.find(r => r.user.toString() === req.user._id.toString());
        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this station' });
        }

        station.ratings.push({
            user: req.user._id,
            rating,
            comment,
            date: new Date()
        });
        await station.save();
        res.status(201).json(station);
    } catch (err) {
        console.error('DEBUG: Error adding rating:', err);
        res.status(500).json({ error: 'Error adding rating' });
    }
});

// @route   POST /search  (This is an API endpoint for search, distinct from GET /stations)
// @desc    Search stations with filters
// @access  Protected
router.post('/search', protect, async (req, res) => {
    console.log('DEBUG: Reached POST /stations/search route');
    try {
        const {
            location: searchLocation, 
            distance = 10000, 
            query: searchQuery = '', 
            chargingTypes = [],
            amenities = [],
            availableOnly = true
        } = req.body;

        let mongoQuery = {};

        if (searchLocation && searchLocation.lat && searchLocation.lng) {
            mongoQuery.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [searchLocation.lng, searchLocation.lat]
                    },
                    $maxDistance: distance
                }
            };
        }

        if (searchQuery) {
            mongoQuery.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { 'location.address': { $regex: searchQuery, $options: 'i' } },
                { 'location.city': { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (chargingTypes.length > 0) {
            mongoQuery['chargingPoints.type'] = { $in: chargingTypes };
        }
        if (amenities.length > 0) {
            mongoQuery.amenities = { $all: amenities };
        }
        if (availableOnly) {
            mongoQuery['chargingPoints.status'] = 'Available';
        }
        
        if (!(searchLocation && searchLocation.lat && searchLocation.lng) && Object.keys(mongoQuery).length > 0) {
            if (!mongoQuery.status) { 
                 mongoQuery.status = 'Operational';
            }
        }

        console.log('DEBUG: Search query:', JSON.stringify(mongoQuery));
        let stations = await Station.find(mongoQuery)
            .select('name location address chargingPoints amenities ratings pricing status operatingHours')
            .lean();
        console.log(`DEBUG: Search found ${stations.length} stations.`);

        const stationsWithDetails = stations.map(station => ({
            ...station,
            _id: station._id.toString(),
            availablePoints: station.chargingPoints.filter(point => point.status === 'Available').length,
            totalPoints: station.chargingPoints.length,
            averageRating: station.ratings && station.ratings.length > 0
                ? (station.ratings.reduce((acc, curr) => acc + curr.rating, 0) / station.ratings.length).toFixed(1)
                : 'N/A'
        }));

        res.json(stationsWithDetails);
    } catch (error) {
        console.error('DEBUG: Station search error:', error);
        res.status(500).json({ error: 'Error searching stations' });
    }
});

// API ROUTE FOR MODAL
// @route   GET /api/stations/:id
// @desc    Get station details as JSON for booking modal
// @access  Protect (User needs to be logged in to see booking options)
router.get('/api/stations/:id', protect, async (req, res) => {
    console.log(`DEBUG: Reached GET /api/stations/${req.params.id} route`);
    try {
        const station = await Station.findById(req.params.id).lean();

        if (!station) {
            console.log(`DEBUG: API - Station with id ${req.params.id} not found.`);
            return res.status(404).json({ success: false, message: 'Station not found' });
        }
        // Ensure _id is a string and chargingPoints is an array
        const stationData = {
            ...station,
            _id: station._id.toString(),
            chargingPoints: station.chargingPoints || [] 
        };
        console.log(`DEBUG: API - Found station: ${stationData.name}, sending JSON.`);
        res.json(stationData); // Send full station data or just necessary parts

    } catch (err) {
        console.error(`DEBUG: Error in GET /api/stations/${req.params.id} route:`, err);
        res.status(500).json({ success: false, message: 'Error fetching station details' });
    }
});

module.exports = router; 