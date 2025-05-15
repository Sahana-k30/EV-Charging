const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // Check if session exists
        if (!req.session.userId) {
            req.flash('error_msg', 'Please log in to access this page');
            return res.redirect('/login');
        }

        try {
            // Find user and populate necessary data
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
                req.flash('error_msg', 'User not found');
                return res.redirect('/login');
            }

            // Set user in request and locals
            req.user = user;
            res.locals.user = user;
            next();
        } catch (err) {
            console.error('Auth Error:', err);
            req.flash('error_msg', 'Error authenticating user');
            return res.redirect('/login');
        }
    } catch (err) {
        console.error('Auth Error:', err);
        next(err);
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).render('error', {
                error: 'User role is not authorized to access this route'
            });
        }
        next();
    };
};

// Check if user is logged in for templates
const isLoggedIn = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId)
                .select('-password')
                .populate('vehicles');
            
            res.locals.user = user;
        } catch (err) {
            console.error('IsLoggedIn Error:', err);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
};

const guest = (req, res, next) => {
    if (req.user) {
        return res.redirect('/dashboard');
    }
    next();
};

module.exports = {
    protect,
    authorize,
    isLoggedIn,
    guest
}; 