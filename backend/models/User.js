const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    location: {
        address: String,
        city: String,
        state: String
    },
    preferredChargingTypes: [{
        type: String,
        enum: ['Level 1', 'Level 2', 'DC Fast Charging']
    }],
    maxDistance: {
        type: Number,
        default: 10 // Default max distance in km
    },
    paymentMethods: [{
        type: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'Digital Wallet']
        },
        cardType: String,
        lastFourDigits: String,
        expiryMonth: Number,
        expiryYear: Number,
        isDefault: Boolean
    }],
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
userSchema.virtual('vehicles', {
    ref: 'Vehicle',
    localField: '_id',
    foreignField: 'userId'
});

userSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'user'
});

userSchema.virtual('payments', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 