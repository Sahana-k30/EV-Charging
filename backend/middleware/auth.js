const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // Check if session exists
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const user = await User.findById(req.session.userId)
                .select('-password')
                .populate('vehicles')
                .populate({
                    path: 'bookings',
                    populate: {
                        path: 'station',
                        select: 'name location'
                    }
                });

            if (!user) {
                req.session.destroy();
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            res.locals.user = user;
            next();
        } catch (err) {
            console.error('Auth Error:', err);
            return res.status(500).json({ error: 'Error authenticating user' });
        }
    } catch (err) {
        console.error('Auth Error:', err);
        next(err);
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'User role is not authorized to access this route' });
        }
        next();
    };
};

// Basic middleware to attach user if logged in
const isLoggedIn = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId)
                .select('-password')
                .populate('vehicles');
            req.user = user;
            res.locals.user = user;
        } catch (err) {
            console.error('IsLoggedIn Error:', err);
            req.user = null;
            res.locals.user = null;
        }
    } else {
        req.user = null;
        res.locals.user = null;
    }
    next();
};

const guest = (req, res, next) => {
    if (req.user) {
        return res.status(400).json({ error: 'Already authenticated' });
    }
    next();
};

module.exports = {
    protect,
    authorize,
    isLoggedIn,
    guest
}; 