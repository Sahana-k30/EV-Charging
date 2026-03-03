import React, { useState, useEffect } from 'react';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    stationId: '',
    vehicleId: '',
    startTime: '',
    duration: '',
    currentBattery: '',
    targetBattery: '',
    chargingPoint: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
    fetchStations();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStations(data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchBookings();
      }
    } catch (err) {
      console.error('Error creating booking:', err);
    }
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="bookings-container">
      <h1>My Bookings</h1>
      <button 
        onClick={() => setShowForm(!showForm)} 
        className="btn-primary"
      >
        {showForm ? 'Cancel' : 'New Booking'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Station</label>
            <select name="stationId" value={formData.stationId} onChange={handleChange} required>
              <option value="">Select Station</option>
              {stations.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Vehicle</label>
            <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Duration (hours)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Current Battery (%)</label>
            <input type="number" name="currentBattery" value={formData.currentBattery} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Target Battery (%)</label>
            <input type="number" name="targetBattery" value={formData.targetBattery} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Charging Point</label>
            <input name="chargingPoint" value={formData.chargingPoint} onChange={handleChange} placeholder="e.g., CP-01" required />
          </div>
          <button type="submit" className="btn-primary">Book Now</button>
        </form>
      )}

      {bookings.length > 0 ? (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Vehicle</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td>{booking.station?.name || 'N/A'}</td>
                <td>{booking.vehicle?.make} {booking.vehicle?.model}</td>
                <td>{new Date(booking.startTime).toLocaleString()}</td>
                <td>{booking.duration} hrs</td>
                <td>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No bookings yet.</p>
      )}
    </div>
  );
};

export default Bookings;
