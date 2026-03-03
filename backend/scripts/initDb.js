const mongoose = require('mongoose');
const Station = require('../models/Station');
const sampleStations = require('../data/sampleStations');

const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ev_charging', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Clear existing stations
        await Station.deleteMany({});

        // Insert sample stations
        await Station.insertMany(sampleStations);

        console.log('Database initialized with sample stations!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initializeDatabase(); 