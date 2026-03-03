# EV Charging Station System

This repository is now split into two major parts: a **backend** powered by Express/MongoDB and a **frontend** created with React. The original EJS views remain under the backend for reference until the React UI fully replaces them.

A web-based EV Charging Station management system built with Node.js, Express, MongoDB on the server and React on the client.

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

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside `backend` with the following variables:
   ```
   # Server Configuration
   PORT=9000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://127.0.0.1:27017/ev_charging

   # Session Configuration
   SESSION_SECRET=your-strong-secret-key-here
   ```
4. Start the backend server:
   ```bash
   npm run dev   # or "npm start" for production
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies (this was done by `create-react-app`; run again if needed):
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173` by default.

The React project includes a `src/pages` folder with a component for each of the legacy EJS pages (home, login, register, dashboard, profile, stations, vehicles, bookings, payments).  These components are currently simple stubs; you can copy markup from the corresponding files in `backend/views` and convert them into JSX, wiring forms and data fetching to the backend routes (the Express app continues to expose them under `/register`, `/login`, `/stations`, etc.).

In production, build the React app (`npm run build`) and the backend will serve the static files from `frontend/build` automatically when `NODE_ENV=production`.

## Project Structure

```
backend/            # Express server, database models, and legacy EJS views
  ├── config/
  ├── controllers/
  ├── data/
  ├── middleware/
  ├── models/
  ├── routes/
  ├── public/       # Static assets used by server (before React migration)
  ├── scripts/
  ├── views/        # EJS templates (to be phased out)
  ├── app.js        # Server entry point
  ├── package.json  # Backend dependencies & scripts
  └── .env          # Environment configuration (not checked in)

frontend/           # React application created with Create React App
  ├── public/       # CRA public assets
  ├── src/          # React components, services, etc.
  ├── package.json  # Frontend dependencies & scripts
  └── ...

README.md           # this file (updated with split instructions)
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