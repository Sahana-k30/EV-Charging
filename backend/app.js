require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const User = require('./models/User');

// route modules
const indexRoutes = require('./routes/index');
const stationRoutes = require('./routes/stations');
const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (defer until MongoDB connects)
let sessionMiddleware = null;

function initializeSessionMiddleware() {
    sessionMiddleware = session({
        secret: process.env.SESSION_SECRET || 'dev-secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging'
        }),
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    });
    app.use(sessionMiddleware);
}

function registerRoutes() {
    // Static files
    app.use(express.static('public'));

    // Basic API Route
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to the EV Charging API 🚗⚡' });
    });

    // ================= ROUTERS =================
    app.use('/api', indexRoutes);
    app.use('/api/stations', stationRoutes);
    app.use('/api/vehicles', vehicleRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/users', userRoutes);

    // ================= PRODUCTION BUILD =================
    if (process.env.NODE_ENV === 'production') {
        const reactPath = path.join(__dirname, '..', 'frontend', 'build');
        app.use(express.static(reactPath));

        app.get('*', (req, res) => {
            res.sendFile(path.join(reactPath, 'index.html'));
        });
    }

    // ================= GLOBAL ERROR HANDLER =================
    app.use((err, req, res, next) => {
        console.error("Global error handler:", err.stack);
        res.status(500).json({ error: 'An unexpected error occurred' });
    });
}


// ================= DATABASE CONNECTION =================
const PORT = process.env.PORT || 9000;

mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging',
    { 
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }
)
.then(() => {
    console.log('✅ MongoDB Connected Successfully');
    
    // Initialize session middleware after DB connection
    initializeSessionMiddleware();
    console.log('✅ Session middleware initialized');
    
    // Register routes after session is ready
    registerRoutes();
    
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('⚠️  Make sure MongoDB is running!');
    
    // Attempt fallback to local MongoDB
    console.log('🔄 Attempting fallback to local MongoDB...');
    mongoose.connect('mongodb://127.0.0.1:27017/ev_charging')
        .then(() => {
            console.log('✅ Connected to Local MongoDB');
            initializeSessionMiddleware();
            registerRoutes();
            app.listen(PORT, () => {
                console.log(`✅ Server is running on port ${PORT}`);
            });
        })
        .catch(fallbackErr => {
            console.error('❌ Local MongoDB Connection Failed:', fallbackErr.message);
            process.exit(1);
        });
});