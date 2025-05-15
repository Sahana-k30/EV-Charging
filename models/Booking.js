const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    chargingPoint: {
        pointId: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        power: {
            type: Number,
            required: true
        }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    actualStartTime: Date,
    actualEndTime: Date,
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Failed'],
        default: 'Pending'
    },
    initialBatteryLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    targetBatteryLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    finalBatteryLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    energyConsumed: {
        type: Number,
        default: 0
    },
    cost: {
        energyCost: {
            type: Number,
            default: 0
        },
        parkingCost: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    payment: {
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending'
        },
        method: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'Digital Wallet']
        },
        transactionId: String,
        paidAt: Date,
        refundedAt: Date
    },
    cancellation: {
        reason: String,
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancelledAt: Date,
        refundStatus: {
            type: String,
            enum: ['Not Required', 'Pending', 'Processed', 'Failed']
        }
    },
    notes: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual reference to payment
bookingSchema.virtual('paymentDetails', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'booking',
    justOne: true
});

// Validate endTime is after startTime
bookingSchema.pre('validate', function(next) {
    if (this.endTime <= this.startTime) {
        this.invalidate('endTime', 'End time must be after start time');
    }
    if (this.targetBatteryLevel <= this.initialBatteryLevel) {
        this.invalidate('targetBatteryLevel', 'Target battery level must be higher than initial battery level');
    }
    next();
});

// Create indexes for common queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ station: 1, status: 1 });
bookingSchema.index({ vehicle: 1, status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 