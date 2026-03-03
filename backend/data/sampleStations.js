require('dotenv').config({ path: '../.env' }); // Adjust path if .env is in a different location
const mongoose = require('mongoose');
const Station = require('../models/Station'); // Assuming Station model is in ../models/

const sampleStationsData = [
    // Existing 5 stations (I'll keep them as is, but _id will be stripped before insertion)
    {
        _id: "station1", // This will be stripped
        name: "EcoCharge Central",
        status: "Operational",
        location: {
            address: "123 Main Street",
            city: "New York",
            coordinates: [-73.935242, 40.730610],
        },
        chargingPoints: [
            { type: "Type2", power: 22, status: "Available", pricePerKWh: 0.35 },
            { type: "CCS", power: 50, status: "Available", pricePerKWh: 0.45 },
            { type: "CHAdeMO", power: 50, status: "Occupied", pricePerKWh: 0.45 }
        ],
        operatingHours: {
            open: "00:00",
            close: "24:00"
        },
        amenities: ["Restroom", "Cafe", "WiFi", "Parking"]
    },
    {
        _id: "station2", // This will be stripped
        name: "PowerHub Express",
        status: "Operational",
        location: {
            address: "456 Park Avenue",
            city: "New York",
            coordinates: [-73.945242, 40.735610],
        },
        chargingPoints: [
            { type: "Type2", power: 11, status: "Available", pricePerKWh: 0.30 },
            { type: "Type2", power: 22, status: "Occupied", pricePerKWh: 0.35 },
            { type: "CCS", power: 150, status: "Available", pricePerKWh: 0.55 }
        ],
        operatingHours: {
            open: "06:00",
            close: "22:00"
        },
        amenities: ["Shop", "Vending Machine", "Parking"]
    },
    {
        _id: "station3", // This will be stripped
        name: "GreenWay Charging",
        status: "Limited",
        location: {
            address: "789 Broadway",
            city: "New York",
            coordinates: [-73.955242, 40.740610],
        },
        chargingPoints: [
            { type: "Type1", power: 7.4, status: "Available", pricePerKWh: 0.28 },
            { type: "Type2", power: 22, status: "Maintenance", pricePerKWh: 0.35 },
            { type: "CCS", power: 50, status: "Available", pricePerKWh: 0.45 }
        ],
        operatingHours: {
            open: "00:00",
            close: "24:00"
        },
        amenities: ["Restroom", "Security"]
    },
    {
        _id: "station4", // This will be stripped
        name: "FastCharge Plus",
        status: "Operational",
        location: {
            address: "321 5th Avenue",
            city: "New York",
            coordinates: [-73.965242, 40.745610],
        },
        chargingPoints: [
            { type: "CCS", power: 350, status: "Available", pricePerKWh: 0.65 },
            { type: "CCS", power: 350, status: "Available", pricePerKWh: 0.65 },
            { type: "CHAdeMO", power: 100, status: "Available", pricePerKWh: 0.50 }
        ],
        operatingHours: {
            open: "00:00",
            close: "24:00"
        },
        amenities: ["Lounge", "Cafe", "WiFi", "Premium Parking", "Car Wash"]
    },
    {
        _id: "station5", // This will be stripped
        name: "Urban EV Stop",
        status: "Operational",
        location: {
            address: "159 Madison Avenue",
            city: "New York",
            coordinates: [-73.975242, 40.750610],
        },
        chargingPoints: [
            { type: "Type2", power: 22, status: "Available", pricePerKWh: 0.35 },
            { type: "Type2", power: 22, status: "Available", pricePerKWh: 0.35 },
            { type: "CCS", power: 50, status: "Occupied", pricePerKWh: 0.45 },
            { type: "CHAdeMO", power: 50, status: "Available", pricePerKWh: 0.45 }
        ],
        operatingHours: {
            open: "06:00",
            close: "23:00"
        },
        amenities: ["Restroom", "Shop", "WiFi"]
    },
    // Adding 7 more stations
    {
        name: "Liberty Charge Point",
        status: "Operational",
        location: {
            address: "1 Liberty Street",
            city: "New York",
            coordinates: [-74.013822, 40.707853],
        },
        chargingPoints: [
            { type: "Type2", power: 50, status: "Available", pricePerKWh: 0.40 },
            { type: "CCS", power: 120, status: "Available", pricePerKWh: 0.50 }
        ],
        operatingHours: { open: "05:00", close: "23:59" },
        amenities: ["Restaurant", "WiFi", "Valet Parking"]
    },
    {
        name: "SoHo EV Energy",
        status: "Operational",
        location: {
            address: "200 Greene Street",
            city: "New York",
            coordinates: [-73.999393, 40.726526],
        },
        chargingPoints: [
            { type: "Type1", power: 7.4, status: "Occupied", pricePerKWh: 0.25 },
            { type: "Type2", power: 22, status: "Available", pricePerKWh: 0.33 },
            { type: "CCS", power: 50, status: "Available", pricePerKWh: 0.42 }
        ],
        operatingHours: { open: "24/7", close: "24/7" },
        amenities: ["Art Gallery Nearby", "Boutique Shopping"]
    },
    {
        name: "Midtown Rapid Charge",
        status: "Operational",
        location: {
            address: "50 W 44th Street",
            city: "New York",
            coordinates: [-73.982996, 40.755382],
        },
        chargingPoints: [
            { type: "CCS", power: 180, status: "Available", pricePerKWh: 0.60 },
            { type: "CHAdeMO", power: 90, status: "Available", pricePerKWh: 0.52 }
        ],
        operatingHours: { open: "24/7", close: "24/7" },
        amenities: ["Business Center", "Restroom", "WiFi"]
    },
    {
        name: "Brooklyn Volt Depot",
        status: "Maintenance",
        location: {
            address: "90 Kent Avenue",
            city: "Brooklyn", // Changed city
            coordinates: [-73.963058, 40.722048],
        },
        chargingPoints: [
            { type: "Type2", power: 22, status: "Maintenance", pricePerKWh: 0.30 },
            { type: "CCS", power: 50, status: "Maintenance", pricePerKWh: 0.40 }
        ],
        operatingHours: { open: "08:00", close: "20:00" },
        amenities: ["Park", "Waterfront View"]
    },
    {
        name: "Queens Power Up",
        status: "Operational",
        location: {
            address: "37-01 Main Street",
            city: "Queens", // Changed city
            coordinates: [-73.830322, 40.759362],
        },
        chargingPoints: [
            { type: "Type2", power: 11, status: "Available", pricePerKWh: 0.29 },
            { type: "CCS", power: 60, status: "Available", pricePerKWh: 0.48 }
        ],
        operatingHours: { open: "07:00", close: "21:00" },
        amenities: ["Shopping Mall", "Food Court"]
    },
    {
        name: "The Bronx Charger",
        status: "Limited",
        location: {
            address: "2500 Grand Concourse",
            city: "Bronx", // Changed city
            coordinates: [-73.896550, 40.862270],
        },
        chargingPoints: [
            { type: "Type1", power: 7.4, status: "Available", pricePerKWh: 0.27 },
            { type: "Type2", power: 22, status: "Occupied", pricePerKWh: 0.36 }
        ],
        operatingHours: { open: "09:00", close: "19:00" },
        amenities: ["Museum Nearby", "Public Park"]
    },
    {
        name: "Staten Island Grid",
        status: "Operational",
        location: {
            address: "1 Richmond Terrace",
            city: "Staten Island", // Changed city
            coordinates: [-74.075960, 40.645070],
        },
        chargingPoints: [
            { type: "CCS", power: 50, status: "Available", pricePerKWh: 0.43 },
            { type: "CHAdeMO", power: 50, status: "Available", pricePerKWh: 0.43 }
        ],
        operatingHours: { open: "24/7", close: "24/7" },
        amenities: ["Ferry Terminal Nearby", "Cafe"]
    }
];

// Strip _id from sampleStations before inserting, MongoDB will generate it.
const stationsToInsert = sampleStationsData.map(({ _id, ...rest }) => rest);

const initDB = async () => {
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging';
    try {
        await mongoose.connect(dbURI);
        console.log('MongoDB Connected for DB Initialization...');

        const count = await Station.countDocuments();
        if (count === 0) {
            console.log('Stations collection is empty. Inserting sample stations...');
            const result = await Station.insertMany(stationsToInsert);
            console.log(`Successfully inserted ${result.length} stations.`);
        } else {
            console.log(`Stations collection is not empty (contains ${count} documents). No new stations inserted.`);
        }
    } catch (err) {
        console.error('Error during DB Initialization:', err.message);
    } finally {
        console.log('Closing MongoDB connection...');
        await mongoose.connection.close();
    }
};

// Export the raw data array as the default
// The initialization intentionally does NOT run automatically
// to avoid closing the MongoDB connection when imported
module.exports = sampleStationsData; 