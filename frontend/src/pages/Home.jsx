import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to EV Charging Management System</h1>
        <p className="text-black">Find and book charging stations for your electric vehicle</p>
        
        {!user ? (
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary btn-lg">Get Started</Link>
            <Link to="/login" className="btn-secondary btn-lg">Login</Link>
          </div>
        ) : (
          <div className="welcome-back">
            <p>Welcome back, {user.name}!</p>
            <Link to="/dashboard" className="btn-primary btn-lg">Go to Dashboard</Link>
          </div>
        )}
      </div>

      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Find Stations</h3>
            <p>Locate charging stations near you with real-time availability</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Easy Booking</h3>
            <p>Book your charging slot in advance and manage your bookings</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Transparent Pricing</h3>
            <p>No hidden charges, track your payments easily</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Fast</h3>
            <p>Safe payment gateway and quick checkout process</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
