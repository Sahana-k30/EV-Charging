const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Operational', 'Limited', 'Maintenance', 'Offline'],
        default: 'Operational'
    },
    location: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            index: '2dsphere'
        }
    },
    chargingPoints: [{
        type: {
            type: String,
            required: true,
            enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO']
        },
        power: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['Available', 'Occupied', 'Maintenance'],
            default: 'Available'
        },
        pricePerKWh: {
            type: Number,
            required: true
        }
    }],
    operatingHours: {
        open: {
            type: String,
            required: true
        },
        close: {
            type: String,
            required: true
        }
    },
    amenities: [{
        type: String
    }],
    pricing: {
        baseRate: { type: Number, required: true, default: 0.4 },
        parkingRate: { type: Number, required: true, default: 0.1 }
    }
}, {
    timestamps: true
});

// Index for geospatial queries
stationSchema.index({ 'location.coordinates': '2dsphere' });

// Method to get available points count
stationSchema.methods.getAvailablePoints = function() {
    return this.chargingPoints.filter(point => point.status === 'Available').length;
};

// Method to get total points count
stationSchema.methods.getTotalPoints = function() {
    return this.chargingPoints.length;
};

const Station = mongoose.model('Station', stationSchema);

module.exports = Station; 