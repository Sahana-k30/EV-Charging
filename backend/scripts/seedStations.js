const mongoose = require('mongoose');
const Station = require('../models/Station');
require('dotenv').config();

// Real-world EV charging stations with geospatial coordinates (Global)
const realisticStations = [
  // ====== BANGALORE, INDIA ======
  {
    name: 'Bangalore Tech Park EV Hub',
    status: 'Operational',
    location: {
      address: '123 Sarjapur Road, Whitefield',
      city: 'Bangalore',
      coordinates: [77.6412, 12.9716] // [lng, lat]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 15 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 }
    ],
    operatingHours: { open: '6:00 AM', close: '11:00 PM' },
    amenities: ['WiFi', 'Cafe', 'Restroom'],
    pricing: { baseRate: 10, parkingRate: 5 }
  },
  {
    name: 'Koramangala Fast Charger',
    status: 'Operational',
    location: {
      address: '456 Koramangala 7th Block',
      city: 'Bangalore',
      coordinates: [77.6245, 12.9352]
    },
    chargingPoints: [
      { type: 'CCS', power: 120, status: 'Available', pricePerKWh: 18 },
      { type: 'CHAdeMO', power: 100, status: 'Occupied', pricePerKWh: 17 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 }
    ],
    operatingHours: { open: '24 Hours', close: '24 Hours' },
    amenities: ['WiFi', 'Restaurant', 'Shop', 'Restroom'],
    pricing: { baseRate: 15, parkingRate: 8 }
  },
  {
    name: 'Indiranagar Green Station',
    status: 'Operational',
    location: {
      address: '789 100 Feet Road, Indiranagar',
      city: 'Bangalore',
      coordinates: [77.6412, 12.9716]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 15 },
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 20 }
    ],
    operatingHours: { open: '6:00 AM', close: '10:00 PM' },
    amenities: ['WiFi', 'Cafe', 'Parking'],
    pricing: { baseRate: 12, parkingRate: 6 }
  },
  {
    name: 'MG Road Premium Charge Hub',
    status: 'Operational',
    location: {
      address: '234 MG Road Central',
      city: 'Bangalore',
      coordinates: [77.6099, 12.9716]
    },
    chargingPoints: [
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 20 },
      { type: 'CCS', power: 150, status: 'Occupied', pricePerKWh: 20 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 }
    ],
    operatingHours: { open: '24 Hours', close: '24 Hours' },
    amenities: ['WiFi', 'Shopping Mall', 'Restaurant', 'Restroom', 'VIP Lounge'],
    pricing: { baseRate: 18, parkingRate: 10 }
  },
  {
    name: 'Marathahalli EV Power Station',
    status: 'Operational',
    location: {
      address: '567 Marathahalli',
      city: 'Bangalore',
      coordinates: [77.6974, 12.9689]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 15 },
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 20 }
    ],
    operatingHours: { open: '6:00 AM', close: '11:00 PM' },
    amenities: ['WiFi', 'Cafe', 'Restroom', 'Parking'],
    pricing: { baseRate: 11, parkingRate: 5 }
  },

  // ====== MUMBAI, INDIA ======
  {
    name: 'Bandra Worli EV Hub',
    status: 'Operational',
    location: {
      address: '123 Bandra Worli Link Road',
      city: 'Mumbai',
      coordinates: [72.8295, 19.0596]
    },
    chargingPoints: [
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 18 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Occupied', pricePerKWh: 15 }
    ],
    operatingHours: { open: '24 Hours', close: '24 Hours' },
    amenities: ['WiFi', 'Restaurant', 'Shop', 'Restroom'],
    pricing: { baseRate: 15, parkingRate: 10 }
  },
  {
    name: 'Powai Tech Park Charger',
    status: 'Operational',
    location: {
      address: '456 Powai, Hiranandani',
      city: 'Mumbai',
      coordinates: [72.9081, 19.1136]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 15 },
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 20 }
    ],
    operatingHours: { open: '6:00 AM', close: '10:00 PM' },
    amenities: ['WiFi', 'Office Space', 'Cafe'],
    pricing: { baseRate: 13, parkingRate: 7 }
  },

  // ====== DELHI, INDIA ======
  {
    name: 'Delhi Cyber City Fast Charger',
    status: 'Operational',
    location: {
      address: '789 Cyber City, Gurgaon',
      city: 'Delhi',
      coordinates: [77.1025, 28.4595]
    },
    chargingPoints: [
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 16 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 11 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 14 }
    ],
    operatingHours: { open: '24 Hours', close: '24 Hours' },
    amenities: ['WiFi', 'Office Space', 'Cafe', 'Restroom'],
    pricing: { baseRate: 13, parkingRate: 6 }
  },
  {
    name: 'Connaught Place EV Station',
    status: 'Operational',
    location: {
      address: '234 Connaught Place',
      city: 'Delhi',
      coordinates: [77.1910, 28.6309]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 12 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 15 }
    ],
    operatingHours: { open: '6:00 AM', close: '11:00 PM' },
    amenities: ['WiFi', 'Shopping', 'Cafe', 'Restroom'],
    pricing: { baseRate: 12, parkingRate: 8 }
  },

  // ====== HYDERABAD, INDIA ======
  {
    name: 'HITEC City EV Hub',
    status: 'Operational',
    location: {
      address: '567 HITEC City',
      city: 'Hyderabad',
      coordinates: [78.3788, 17.3850]
    },
    chargingPoints: [
      { type: 'CCS', power: 120, status: 'Available', pricePerKWh: 16 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 11 },
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 19 }
    ],
    operatingHours: { open: '6:00 AM', close: '10:00 PM' },
    amenities: ['WiFi', 'Office Space', 'Cafe'],
    pricing: { baseRate: 12, parkingRate: 5 }
  },

  // ====== PUNE, INDIA ======
  {
    name: 'Pune IT Hub Charger',
    status: 'Operational',
    location: {
      address: '890 Hinjewadi, Pune',
      city: 'Pune',
      coordinates: [73.7997, 18.5904]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 11 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 14 },
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 18 }
    ],
    operatingHours: { open: '6:00 AM', close: '10:00 PM' },
    amenities: ['WiFi', 'Cafe', 'Parking'],
    pricing: { baseRate: 11, parkingRate: 5 }
  },

  // ====== US CITIES (KEPT FOR REFERENCE) ======
  {
    name: 'Downtown NYC EV Hub',
    status: 'Operational',
    location: {
      address: '123 Manhattan Street',
      city: 'New York',
      coordinates: [-74.0060, 40.7128]
    },
    chargingPoints: [
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 0.35 },
      { type: 'CCS', power: 50, status: 'Occupied', pricePerKWh: 0.45 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 0.35 }
    ],
    operatingHours: { open: '6:00 AM', close: '11:00 PM' },
    amenities: ['WiFi', 'Restroom', 'Parking'],
    pricing: { baseRate: 0.40, parkingRate: 0.15 }
  },
  {
    name: 'Silicon Valley Supercharger',
    status: 'Operational',
    location: {
      address: '456 Tech Drive',
      city: 'San Jose',
      coordinates: [-121.8863, 37.3382]
    },
    chargingPoints: [
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 0.48 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 0.32 },
      { type: 'CCS', power: 50, status: 'Available', pricePerKWh: 0.42 }
    ],
    operatingHours: { open: '6:00 AM', close: '10:00 PM' },
    amenities: ['WiFi', 'Office Space', 'Parking'],
    pricing: { baseRate: 0.35, parkingRate: 0.10 }
  },
  {
    name: 'San Francisco Bay Charger',
    status: 'Operational',
    location: {
      address: '789 Marina Boulevard',
      city: 'San Francisco',
      coordinates: [-122.4194, 37.7749]
    },
    chargingPoints: [
      { type: 'CCS', power: 150, status: 'Available', pricePerKWh: 0.55 },
      { type: 'Type2', power: 22, status: 'Available', pricePerKWh: 0.40 }
    ],
    operatingHours: { open: '24 Hours', close: '24 Hours' },
    amenities: ['WiFi', 'Restaurant', 'Shop', 'EV Lounge'],
    pricing: { baseRate: 0.55, parkingRate: 0.25 }
  }
];

async function seedStations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing stations
    await Station.deleteMany({});
    console.log('Cleared existing stations');

    // Insert realistic stations
    const insertedStations = await Station.insertMany(realisticStations);
    console.log(`✅ Successfully seeded ${insertedStations.length} EV charging stations!`);

    // List inserted stations by city
    const cityStats = {};
    insertedStations.forEach(station => {
      const city = station.location.city;
      if (!cityStats[city]) {
        cityStats[city] = { count: 0, points: 0 };
      }
      cityStats[city].count += 1;
      cityStats[city].points += station.chargingPoints.length;
      console.log(`✓ ${station.name} (${city}) - ${station.chargingPoints.length} charging points`);
    });

    console.log('\n📊 City Summary:');
    Object.entries(cityStats).forEach(([city, stats]) => {
      console.log(`  ${city}: ${stats.count} stations, ${stats.points} total charging points`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (err) {
    console.error('Error seeding stations:', err);
    process.exit(1);
  }
}

// Run the seed function
seedStations();
