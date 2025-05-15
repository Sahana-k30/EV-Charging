# EV Charging Station System

A web-based EV Charging Station management system built with the MERN stack (MongoDB, Express.js, and EJS for views).

## Features

- User Authentication (Login/Register)
- Vehicle Management
- Charging Station Locator
- Slot Booking System
- Real-time Session Tracking
- Payment Integration
- Payment Analysis Dashboard

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://127.0.0.1:27017/ev_charging

   # Session Configuration
   SESSION_SECRET=your-strong-secret-key-here
   ```
4. Run the application:
   ```bash
   npm start
   ```

## Project Structure

```
├── config/         # Configuration files
├── models/         # Database models
├── routes/         # Route handlers
├── controllers/    # Business logic
├── middleware/     # Custom middleware
├── public/         # Static files
│   ├── css/       # Stylesheets
│   ├── js/        # Client-side JavaScript
│   └── img/       # Images
├── views/          # EJS templates
│   ├── layout.ejs # Main layout template
│   ├── partials/  # Reusable template parts
│   └── pages/     # Individual page templates
└── app.js         # Main application file
```

## Security Notes

1. Environment Variables:
   - Never commit the .env file to version control
   - Use strong, unique secrets for SESSION_SECRET
   - In production, use secure MongoDB connection strings

2. Session Security:
   - Sessions are stored in MongoDB and expire after 24 hours
   - Cookies are configured with secure options in production
   - sameSite protection is enabled

3. Error Handling:
   - Detailed errors are only shown in development
   - Production errors are user-friendly without sensitive details

## License

MIT 