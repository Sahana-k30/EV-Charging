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
        type: String,
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
paymentSchema.pre("save", async function(next) {

try {

const booking = await mongoose.model("Booking").findById(this.booking);

if (!booking) return next();

if (this.status === "Completed") {

booking.paymentStatus = "Paid";
booking.paymentId = this.transactionId;

await booking.save();

}

next();

} catch (err) {

next(err);

}

});
// Calculate subtotal before saving
paymentSchema.pre('save', function(next) {
    if (this.isModified('breakdown')) {
        const { energyCost, parkingCost, tax, discount } = this.breakdown;
        this.breakdown.subtotal = energyCost + parkingCost + tax - discount;
    }
    next();
});


const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment; 