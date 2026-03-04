import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Request user's geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.debug('Geolocation not available:', error.code);
          // Continue without location
        }
      );
    }
    fetchDashboardData();
  }, []);

  // Fetch nearby stations when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyStations();
    }
  }, [userLocation]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user vehicles
      const vehiclesRes = await fetch('/api/vehicles', {
        credentials: 'include'
      });
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData.vehicles || []);
      }
      
      // Fetch payment history
      const paymentsRes = await fetch('/api/payments', {
        credentials: 'include'
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const fetchNearbyStations = async () => {
    try {
      const maxDistance = 15000; // 15 km in meters
      const stationsRes = await fetch(
        `/api/stations/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&maxDistance=${maxDistance}`,
        { credentials: 'include' }
      );
      if (stationsRes.ok) {
        const stationsData = await stationsRes.json();
        setStations(stationsData.stations?.slice(0, 3) || []);
      } else {
        // Fallback to all stations
        const allStationsRes = await fetch('/api/stations', { credentials: 'include' });
        if (allStationsRes.ok) {
          const allStationsData = await allStationsRes.json();
          setStations(allStationsData.stations?.slice(0, 3) || []);
        }
      }
    } catch (err) {
      console.error('Error fetching nearby stations:', err);
      // Show all stations as fallback
      try {
        const allStationsRes = await fetch('/api/stations', { credentials: 'include' });
        if (allStationsRes.ok) {
          const allStationsData = await allStationsRes.json();
          setStations(allStationsData.stations?.slice(0, 3) || []);
        }
      } catch (err2) {
        console.error('Error fetching all stations:', err2);
      }
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.name || 'User'}!</h1>
      {error && <div className="error-message">{error}</div>}
      
      {/* User Info Section */}
      <section className="dashboard-section">
        <h2>📋 Profile Information</h2>
        <div className="user-info">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <Link to="/profile" className="btn-secondary">View Full Profile</Link>
        </div>
      </section>

      {/* Vehicles Section */}
      <section className="dashboard-section">
        <h2>🚗 Your Vehicles ({vehicles.length})</h2>
        {vehicles.length > 0 ? (
          <div className="vehicles-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vehicle-card">
                <h3>{vehicle.make} {vehicle.model}</h3>
                <p><strong>Year:</strong> {vehicle.year}</p>
                <p><strong>License Plate:</strong> {vehicle.licensePlate}</p>
                <p><strong>Battery:</strong> {vehicle.batteryCapacity} kWh</p>
                <p><strong>Charging Type:</strong> {vehicle.chargingType}</p>
                <Link to="/vehicles" className="btn-secondary">Manage Vehicles</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No vehicles added yet.</p>
            <Link to="/vehicles" className="btn-primary">Add a Vehicle</Link>
          </div>
        )}
      </section>

      {/* Nearby Stations Section */}
      <section className="dashboard-section">
        <h2>⚡ Nearby Charging Stations {userLocation ? '(near your location)' : ''} ({stations.length})</h2>
        {stations.length > 0 ? (
          <div className="stations-grid">
            {stations.slice(0, 3).map(station => (
              <div key={station._id} className="station-card">
                <h3>{station.name}</h3>
                <p><strong>Location:</strong> {station.location?.address || 'Location not available'}</p>
                <p><strong>City:</strong> {station.location?.city}</p>
                <p><strong>Available Points:</strong> {station.chargingPoints?.filter(cp => cp.status === 'Available').length || 0}</p>
                <Link to="/stations" className="btn-secondary">View All Stations</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No nearby stations found.</p>
            <Link to="/stations" className="btn-primary">Browse Stations</Link>
          </div>
        )}
      </section>

      {/* Recent Payments Section */}
      <section className="dashboard-section">
        <h2>Recent Payments</h2>
        {payments.length > 0 ? (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 5).map(payment => (
                <tr key={payment._id}>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>${payment.amount}</td>
                  <td><span className={`status-${payment.status}`}>{payment.status}</span></td>
                  <td>{payment.paymentType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No payment history yet.</p>
            <Link to="/bookings" className="btn-primary">Make a Booking</Link>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/bookings" className="btn-primary">View Bookings</Link>
          <Link to="/vehicles" className="btn-primary">Manage Vehicles</Link>
          <Link to="/stations" className="btn-primary">Find Stations</Link>
          <Link to="/payments" className="btn-primary">Payment History</Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
