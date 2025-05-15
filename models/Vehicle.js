const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true
    },
    batteryCapacity: {
        type: Number,
        required: true
    },
    chargingType: {
        type: String,
        required: true,
        enum: ['Level 1', 'Level 2', 'DC Fast Charging']
    },
    currentRange: {
        type: Number,
        default: 0
    },
    batteryHealth: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    lastCharged: {
        type: Date
    },
    chargingHistory: [{
        date: Date,
        stationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Station'
        },
        energyConsumed: Number,
        duration: Number,
        cost: Number
    }],
    status: {
        type: String,
        enum: ['Available', 'Charging', 'Maintenance', 'Inactive'],
        default: 'Available'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual references
vehicleSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'vehicle'
});

// Indexes
vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ licensePlate: 1 }, { unique: true });
vehicleSchema.index({ status: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 