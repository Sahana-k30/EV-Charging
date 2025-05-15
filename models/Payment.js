const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
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
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'Digital Wallet'],
        required: true
    },
    paymentDetails: {
        cardType: String,
        lastFourDigits: String,
        expiryMonth: Number,
        expiryYear: Number,
        walletProvider: String
    },
    breakdown: {
        energyCost: {
            type: Number,
            required: true
        },
        parkingCost: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        subtotal: {
            type: Number,
            required: true
        }
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewayResponse: {
        success: Boolean,
        code: String,
        message: String,
        transactionReference: String
    },
    refund: {
        amount: Number,
        reason: String,
        status: {
            type: String,
            enum: ['Pending', 'Processed', 'Failed']
        },
        processedAt: Date,
        transactionId: String
    },
    metadata: {
        type: Map,
        of: String
    },
    paidAt: Date,
    refundedAt: Date
}, {
    timestamps: true
});

// Update booking payment status when payment status changes
paymentSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        try {
            const booking = await mongoose.model('Booking').findById(this.booking);
            if (booking) {
                booking.payment.status = this.status;
                booking.payment.method = this.paymentMethod;
                if (this.status === 'Completed') {
                    booking.payment.transactionId = this.transactionId;
                    booking.payment.paidAt = this.paidAt;
                } else if (this.status === 'Refunded') {
                    booking.payment.refundedAt = this.refundedAt;
                }
                await booking.save();
            }
        } catch (error) {
            next(error);
            return;
        }
    }
    next();
});

// Calculate subtotal before saving
paymentSchema.pre('save', function(next) {
    if (this.isModified('breakdown')) {
        const { energyCost, parkingCost, tax, discount } = this.breakdown;
        this.breakdown.subtotal = energyCost + parkingCost + tax - discount;
    }
    next();
});

// Create indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ station: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'refund.status': 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment; 