require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Station = require('./models/Station');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const bookingsRouter = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');

// All route files are commented out for a simpler app.js-centric approach
// const stationRoutes = require('./routes/stations'); 
// const vehicleRoutes = require('./routes/vehicles'); 
// const bookingRoutes = require('./routes/bookings'); 
// const paymentRoutes = require('./routes/payments'); 

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.set('layout extractMetas', true);

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging'
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
    const successMsg = req.flash('success_msg');
    const errorMsg = req.flash('error_msg');
    res.locals.success_msg = successMsg.length > 0 ? successMsg[0] : null; // Get first message
    res.locals.error_msg = errorMsg.length > 0 ? errorMsg[0] : null;     // Get first message
    res.locals.user = req.session.user || null;
    next();
});

// Basic Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address, city, state } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/register');
        }
        const user = await User.create({ name, email, password, phoneNumber, location: { address, city, state } });
        req.session.user = { id: user._id, name: user.name, email: user.email };
        req.flash('success_msg', 'Registration successful! Welcome.');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Registration error:', err);
        req.flash('error_msg', 'Error in registration. Please check fields.');
        res.redirect('/register');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid credentials.');
            return res.redirect('/login');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid credentials.');
            return res.redirect('/login');
        }
        req.session.user = { id: user._id, name: user.name, email: user.email };
        req.flash('success_msg', 'You are now logged in.');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        req.flash('error_msg', 'Error in login.');
        res.redirect('/login');
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view this resource.');
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.user.id).select('-password').lean();
        if (!user) {
            req.session.destroy();
            req.flash('error_msg', 'User session error. Please log in again.');
            return res.redirect('/login');
        }
        
        const vehicles = await Vehicle.find({ userId: user._id }).lean();

        // Restore fetching for payment statistics and recent payments
        const totalSpentResult = await Payment.aggregate([
            { $match: { userId: user._id, status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingAmountResult = await Payment.aggregate([
            { $match: { userId: user._id, status: 'Pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const recentPayments = await Payment.find({ userId: user._id })
            .populate({
                path: 'booking',
                populate: {
                    path: 'station',
                    select: 'name' // Select specific fields from station
                }
            })
            .sort('-createdAt')
            .limit(5)
            .lean();

        res.render('dashboard', { 
            title: 'Dashboard',
            user: user,
            vehicles: vehicles || [],
            totalSpent: totalSpentResult[0]?.total || 0,
            pendingAmount: pendingAmountResult[0]?.total || 0,
            recentPayments: recentPayments || [] 
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        req.flash('error_msg', 'Error loading dashboard.');
        // Ensure all expected variables are passed in catch block as well
        res.render('dashboard', { 
            title: 'Dashboard', 
            user: req.session.user, // Use user from session as a fallback
            vehicles: [], 
            totalSpent: 0,
            pendingAmount: 0,
            recentPayments: [] 
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            req.flash('error_msg', 'Logout failed.');
            return res.redirect('/');
        }
        req.flash('success_msg', 'You have successfully logged out.');
        res.redirect('/login');
    });
});

// Stations list page (direct handler in app.js)
app.get('/stations', async (req, res) => {
    console.log("APP.JS: GET /stations route");
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view stations');
        return res.redirect('/login');
    }
    try {
        const stations = await Station.find({}).lean();
        // Vehicles might be needed by the layout or other parts, fetch if user exists
        const vehicles = req.session.user ? await Vehicle.find({ userId: req.session.user.id }).lean() : [];
        console.log(`APP.JS: Found ${stations.length} stations for display.`);
        res.render('stations/index', {
            title: 'Charging Stations',
            stations: stations,
            vehicles: vehicles,
            user: req.session.user // Pass full user from session
        });
    } catch (err) {
        console.error('APP.JS: Error fetching stations:', err);
        req.flash('error_msg', 'Could not load stations.');
        res.render('stations/index', { title: 'Charging Stations', stations: [], vehicles: [], user: req.session.user });
    }
});

// Removed /api/stations/:id and POST /bookings/new as they were for booking functionality

// --- Vehicle Routes (Restored in app.js) ---
app.get('/vehicles/new', (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to add a vehicle');
        return res.redirect('/login');
    }
    // Assuming you have a view at 'views/vehicles/new.ejs'
    res.render('vehicles/new', { title: 'Add New Vehicle' });
});

app.post('/vehicles/new', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to add a vehicle');
        return res.redirect('/login');
    }
    try {
        const { make, model, year, licensePlate, batteryCapacity, chargingType } = req.body;
        const vehicleExists = await Vehicle.findOne({ licensePlate });
        if (vehicleExists) {
            req.flash('error_msg', 'Vehicle with this license plate already exists');
            return res.redirect('/vehicles/new');
        }
        await Vehicle.create({
            userId: req.session.user.id,
            make,
            model,
            year,
            licensePlate,
            batteryCapacity,
            chargingType,
            // currentRange: batteryCapacity * 4, // Example default, adjust as needed
            // lastCharged: new Date()          // Example default, adjust as needed
        });
        req.flash('success_msg', 'Vehicle added successfully');
        res.redirect('/dashboard'); // Or to /vehicles list page
    } catch (err) {
        console.error('Error adding vehicle:', err);
        req.flash('error_msg', 'Error adding vehicle. Please check all fields.');
        res.redirect('/vehicles/new');
    }
});

app.get('/vehicles', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view your vehicles');
        return res.redirect('/login');
    }
    try {
        const vehicles = await Vehicle.find({ userId: req.session.user.id }).lean();
        // Assuming you have a view at 'views/vehicles/index.ejs'
        res.render('vehicles/index', { title: 'My Vehicles', vehicles: vehicles || [] });
    } catch (err) {
        console.error('Error fetching vehicles:', err);
        req.flash('error_msg', 'Could not load your vehicles.');
        res.redirect('/dashboard');
    }
});

app.get('/vehicles/:id', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view vehicle details');
        return res.redirect('/login');
    }
    try {
        const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found.');
            return res.redirect('/vehicles'); // Or dashboard
        }
        // Assuming you have a view at 'views/vehicles/details.ejs'
        res.render('vehicles/details', { title: `${vehicle.make} ${vehicle.model}`, vehicle });
    } catch (err) {
        console.error('Error fetching vehicle details:', err);
        req.flash('error_msg', 'Could not load vehicle details.');
        res.redirect('/vehicles');
    }
});

app.post('/vehicles/:id/delete', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to delete a vehicle');
        return res.redirect('/login');
    }
    try {
        const result = await Vehicle.deleteOne({ _id: req.params.id, userId: req.session.user.id });
        if (result.deletedCount === 0) {
            req.flash('error_msg', 'Vehicle not found or you do not have permission to delete it.');
        } else {
            req.flash('success_msg', 'Vehicle deleted successfully.');
        }
        res.redirect('/vehicles'); // Or dashboard
    } catch (err) {
        console.error('Error deleting vehicle:', err);
        req.flash('error_msg', 'Error deleting vehicle.');
        res.redirect('/vehicles');
    }
});

app.get('/vehicles/:id/edit', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to edit vehicle');
        return res.redirect('/login');
    }
    try {
        const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found.');
            return res.redirect('/vehicles');
        }
        res.render('vehicles/edit', { title: 'Edit Vehicle', vehicle });
    } catch (err) {
        console.error('Error loading edit vehicle:', err);
        req.flash('error_msg', 'Could not load vehicle for editing.');
        res.redirect('/vehicles');
    }
});

app.post('/vehicles/:id/edit', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to edit vehicle');
        return res.redirect('/login');
    }
    try {
        const { make, model, year, licensePlate, batteryCapacity, chargingType, currentRange } = req.body;
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.user.id },
            { make, model, year, licensePlate, batteryCapacity, chargingType, currentRange },
            { new: true, runValidators: true }
        );
        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found.');
            return res.redirect('/vehicles');
        }
        req.flash('success_msg', 'Vehicle updated successfully.');
        res.redirect(`/vehicles/${req.params.id}`);
    } catch (err) {
        console.error('Error updating vehicle:', err);
        req.flash('error_msg', 'Error updating vehicle.');
        res.redirect(`/vehicles/${req.params.id}/edit`);
    }
});

// --- Booking Routes (Added to app.js) ---
// Route to display all bookings for a user
app.get('/bookings', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view your bookings.');
        return res.redirect('/login');
    }
    try {
        const bookings = await Booking.find({ user: req.session.user.id })
            .populate('station')
            .populate('vehicle')
            .sort({ startTime: -1 })
            .lean();
        res.render('bookings/index', { 
            title: 'My Bookings', 
            bookings: bookings || [] 
        });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        req.flash('error_msg', 'Could not load your bookings.');
        res.redirect('/dashboard');
    }
});

// Route to display the form for creating a new booking
app.get('/bookings/new', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to make a booking.');
        return res.redirect('/login');
    }
    try {
        const vehicles = await Vehicle.find({ userId: req.session.user.id }).lean();
        if (vehicles.length === 0) {
            req.flash('error_msg', 'You need to add a vehicle before you can make a booking.');
            return res.redirect('/vehicles/new');
        }

        let station = null;
        if (req.query.stationId) {
            station = await Station.findById(req.query.stationId).lean();
        }
        res.render('bookings/new', {
            title: 'New Booking',
            vehicles: vehicles,
            station: station,
            selectedStationId: req.query.stationId
        });
    } catch (err) {
        console.error('Error preparing new booking page:', err);
        req.flash('error_msg', 'Could not load the new booking page.');
        res.redirect('/stations');
    }
});

// Route to handle the creation of a new booking
app.post('/bookings', async (req, res) => {
    if (!req.session.user) {
        // For fetch requests, send JSON error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ success: false, message: 'Please log in to make a booking.'});
        } else {
            req.flash('error_msg', 'Please log in to make a booking.');
            return res.redirect('/login');
        }
    }
    try {
        const { 
            stationId, 
            vehicleId, 
            startTime, 
            duration, 
            currentBattery, 
            targetBattery,
            chargingPoint
        } = req.body;
        
        // Basic validation (more can be added)
        if (!stationId || !vehicleId || !startTime || !duration || !currentBattery || !targetBattery || !chargingPoint) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
            } else {
                req.flash('error_msg', 'Please fill in all required fields.');
                return res.redirect('back');
            }
        }

        // TODO: Add more robust validation and conflict checking (e.g., station availability, vehicle already booked)
        const calculatedEndTime = new Date(new Date(startTime).getTime() + parseFloat(duration) * 60 * 60 * 1000);

        // Parse chargingPoint if it's a string
        let chargingPointObj = chargingPoint;
        if (typeof chargingPoint === 'string') {
            try {
                chargingPointObj = JSON.parse(chargingPoint);
            } catch (e) {
                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    return res.status(400).json({ success: false, message: 'Invalid charging point data.' });
                } else {
                    req.flash('error_msg', 'Invalid charging point data.');
                    return res.redirect('back');
                }
            }
        }

        await Booking.create({
            user: req.session.user.id,
            station: stationId,
            vehicle: vehicleId,
            startTime,
            endTime: calculatedEndTime, 
            duration: parseFloat(duration),
            initialBatteryLevel: parseInt(currentBattery),
            targetBatteryLevel: parseInt(targetBattery),
            chargingPoint: chargingPointObj,
            status: 'Pending'
        });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.json({ success: true, message: 'Booking created successfully! It is pending confirmation.' });
        } else {
            req.flash('success_msg', 'Booking created successfully! It is pending confirmation.');
            res.redirect('/bookings');
        }
    } catch (err) {
        console.error('Error creating booking:', err);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.status(500).json({ success: false, message: 'Error creating booking. Please try again.'});
        } else {
            req.flash('error_msg', 'Error creating booking. Please try again.');
            res.redirect('back');
        }
    }
});

// Simple profile page route
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to view your profile.');
        return res.redirect('/login');
    }
    res.render('users/profile', {
        title: 'Profile',
        user: {
            name: req.session.user.name,
            email: req.session.user.email,
            createdAt: new Date() // Placeholder, replace with actual user creation date if available
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err.stack);
    res.status(500).render('error', { title: 'Error', message: 'An unexpected error occurred!' });
});

// CRITICAL: MongoDB Connection and app.listen() at the VERY END 
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ev_charging')
    .then(() => {
        console.log('MongoDB Connected Successfully (Main App from app.js)');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error (Main App from app.js):', err);
        process.exit(1);
    }); 

app.use('/bookings', bookingsRouter);
app.use('/payments', paymentRoutes); 