const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ChargingStation = require('../models/Station');

// @route   GET /payments
// @desc    Get user's payment history (API)
router.get('/', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate({
                path: 'booking',
                populate: {
                    path: 'station',
                    select: 'name location'
                }
            })
            .sort('-createdAt');
        res.json({ payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching payments' });
    }
});

// @route   POST /payments/process
// @desc    Process payment for a booking
router.post('/process', protect, async (req, res) => {
    try {
        const { bookingId, paymentMethod, paymentDetails } = req.body;

        // Validate input
        if (!bookingId || !paymentMethod || !paymentDetails) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get booking details
        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user._id,
            'payment.status': 'Pending'
        }).populate('station');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or payment already processed' });
        }

        // Validate payment details
        if (!paymentDetails.cardNumber || !paymentDetails.expiryMonth || 
            !paymentDetails.expiryYear || !paymentDetails.cvv) {
            return res.status(400).json({ error: 'Invalid payment details' });
        }

        // Create payment record
        const payment = await Payment.create({
            user: req.user.id,
            booking: bookingId,
            amount: booking.cost.total,
            paymentMethod,
            paymentDetails: {
                cardType: getCardType(paymentDetails.cardNumber),
                lastFourDigits: paymentDetails.cardNumber.slice(-4),
                expiryMonth: parseInt(paymentDetails.expiryMonth),
                expiryYear: parseInt(paymentDetails.expiryYear)
            },
            breakdown: {
                energyCost: booking.cost.energyCost,
                parkingCost: booking.cost.parkingCost,
                tax: booking.cost.tax,
                discount: 0
            },
            status: 'Processing'
        });

        // Simulate payment processing with a payment gateway
        try {
            // In a real application, you would integrate with a payment gateway here
            const success = await processPaymentWithGateway(payment, paymentDetails);
            
            if (success) {
                payment.status = 'Completed';
                payment.transactionId = 'TXN' + Date.now();
                payment.paidAt = new Date();
                await payment.save();

                // Update booking payment status
                booking.payment.status = 'Completed';
                booking.payment.transactionId = payment.transactionId;
                await booking.save();

                res.json({ success: true, payment });
            } else {
                payment.status = 'Failed';
                payment.error = {
                    code: 'PAYMENT_FAILED',
                    message: 'Payment processing failed'
                };
                await payment.save();

                res.status(400).json({ error: 'Payment processing failed' });
            }
        } catch (error) {
            payment.status = 'Failed';
            payment.error = {
                code: 'GATEWAY_ERROR',
                message: error.message
            };
            await payment.save();

            res.status(500).json({ error: 'Payment gateway error' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error processing payment' });
    }
});

// @route   GET /payments/page
// @desc    Demo payments data
router.get('/page', (req, res) => {
    const payments = [
        {
            _id: '1',
            paymentId: 'PMT001',
            status: 'Completed',
            booking: { station: { name: 'Green City Station' } },
            date: new Date(),
            amount: 12.50,
            paymentMethod: 'Credit Card'
        },
        {
            _id: '2',
            paymentId: 'PMT002',
            status: 'Pending',
            booking: { station: { name: 'Eco Plaza' } },
            date: new Date(),
            amount: 8.75,
            paymentMethod: 'Debit Card'
        },
        {
            _id: '3',
            paymentId: 'PMT003',
            status: 'Completed',
            booking: { station: { name: 'Sunshine Mall' } },
            date: new Date(),
            amount: 15.00,
            paymentMethod: 'Digital Wallet'
        }
    ];
    res.json({ payments, demo: true });
});

// @route   GET /payments/demo/:id
// @desc    Get demo payment details page
router.get('/demo/:id', (req, res) => {
    const payment = {
        _id: req.params.id,
        status: req.params.id === '2' ? 'Pending' : 'Completed',
        amount: req.params.id === '1' ? 12.50 : req.params.id === '2' ? 8.75 : 15.00,
        paymentMethod: req.params.id === '1' ? 'Credit Card' : req.params.id === '2' ? 'Debit Card' : 'Digital Wallet',
        createdAt: new Date(),
        booking: {
            station: { name: req.params.id === '1' ? 'Green City Station' : req.params.id === '2' ? 'Eco Plaza' : 'Sunshine Mall' },
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(),
            energyConsumed: 18.2,
            vehicle: { make: 'Tesla', model: 'Model 3', licensePlate: 'EV1234' }
        },
        breakdown: {
            energyCost: 8.00,
            parkingCost: 2.00,
            tax: 2.50,
            discount: 0
        }
    };
    res.json({ payment, demo: true });
});

// @route   GET /payments/demo-analysis
// @desc    Get demo payment analysis page
router.get('/demo-analysis', (req, res) => {
    const stats = {
        totalSpent: 36.25,
        totalEnergy: 54.6,
        averageCost: 12.08,
        numberOfSessions: 3,
        monthlySpending: { 'April 2024': 36.25 },
        paymentMethods: { 'Credit Card': 1, 'Debit Card': 1, 'Digital Wallet': 1 },
        topStations: [
            { name: 'Green City Station', visits: 1, spent: 12.50 },
            { name: 'Eco Plaza', visits: 1, spent: 8.75 },
            { name: 'Sunshine Mall', visits: 1, spent: 15.00 }
        ],
        costBreakdown: { energy: 24, parking: 6, tax: 6.25 }
    };
    res.render('payments/analysis', { stats });
});

// @route   GET /payments/:id
// @desc    Get payment details
router.get('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate({
            path: 'booking',
            populate: {
                path: 'station vehicle',
                select: 'name location make model licensePlate'
            }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json({ payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching payment details' });
    }
});

// @route   GET /payments/analysis
// @desc    Get payment analysis and statistics
router.get('/analysis', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { user: req.user.id, status: 'Completed' };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const payments = await Payment.find(query)
            .populate({
                path: 'booking',
                select: 'energyConsumed startTime endTime station',
                populate: {
                    path: 'station',
                    select: 'name'
                }
            });

        // Calculate statistics
        const stats = {
            totalSpent: 0,
            totalEnergy: 0,
            averageCost: 0,
            numberOfSessions: payments.length,
            monthlySpending: {},
            paymentMethods: {},
            topStations: {},
            costBreakdown: {
                energy: 0,
                parking: 0,
                tax: 0
            }
        };

        payments.forEach(payment => {
            stats.totalSpent += payment.amount;
            stats.totalEnergy += payment.booking.energyConsumed;
            stats.costBreakdown.energy += payment.breakdown.energyCost;
            stats.costBreakdown.parking += payment.breakdown.parkingCost;
            stats.costBreakdown.tax += payment.breakdown.tax;
            const month = payment.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' });
            stats.monthlySpending[month] = (stats.monthlySpending[month] || 0) + payment.amount;
            stats.paymentMethods[payment.paymentMethod] = 
                (stats.paymentMethods[payment.paymentMethod] || 0) + 1;
            const stationName = payment.booking.station.name;
            if (!stats.topStations[stationName]) {
                stats.topStations[stationName] = { visits: 0, spent: 0 };
            }
            stats.topStations[stationName].visits += 1;
            stats.topStations[stationName].spent += payment.amount;
        });

        stats.averageCost = stats.totalSpent / (stats.numberOfSessions || 1);

        stats.topStations = Object.entries(stats.topStations)
            .map(([name, data]) => ({ name, visits: data.visits, spent: data.spent }))
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 5);

        res.json({ stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error generating payment analysis' });
    }
});

// @route   GET /payments/:id/receipt
// @desc    Download payment receipt
router.get('/:id/receipt', protect, async (req, res) => {
    // Receipt generation is not implemented in API mode
    res.status(501).json({ error: 'Receipt endpoint not implemented' });
});

// Helper function to determine card type
function getCardType(cardNumber) {
    // Basic regex patterns for card types
    const patterns = {
        visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
        mastercard: /^5[1-5][0-9]{14}$/,
        amex: /^3[47][0-9]{13}$/,
        discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(cardNumber)) {
            return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }
    return 'Unknown';
}

// Simulate payment gateway processing
async function processPaymentWithGateway(payment, paymentDetails) {
    return new Promise((resolve) => {
        // Simulate API call to payment gateway
        setTimeout(() => {
            // In a real application, this would be actual payment gateway logic
            const success = Math.random() > 0.1; // 90% success rate
            resolve(success);
        }, 2000);
    });
}

// Helper function to generate receipt (implementation depends on your needs)
async function generateReceipt(payment) {
    // This is a placeholder. In a real application, you would use a PDF generation
    // library like PDFKit to create a proper receipt
    return Buffer.from('Receipt placeholder');
}

module.exports = router; 