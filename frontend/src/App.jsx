import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { AuthContext } from './context/AuthContext.jsx';

// page components
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Stations from './pages/Stations.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Bookings from './pages/Bookings.jsx';
import Payments from './pages/Payments.jsx';

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, logout, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <nav className="navbar">
        <div className="nav-brand">EV Charging Station</div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/stations">Stations</Link>
              <Link to="/vehicles">Vehicles</Link>
              <Link to="/bookings">Bookings</Link>
              <Link to="/payments">Payments</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={logout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </nav>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/stations" element={<ProtectedRoute><Stations /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
