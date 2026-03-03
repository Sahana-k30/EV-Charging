import React, { useState, useEffect } from 'react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    batteryCapacity: '',
    chargingType: 'AC'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          batteryCapacity: '',
          chargingType: 'AC'
        });
        setShowForm(false);
        fetchVehicles();
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  if (loading) return <div className="loading">Loading vehicles...</div>;

  return (
    <div className="vehicles-container">
      <h1>My Vehicles</h1>
      <button 
        onClick={() => setShowForm(!showForm)} 
        className="btn-primary"
      >
        {showForm ? 'Cancel' : 'Add New Vehicle'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-group">
            <label>Make</label>
            <input name="make" value={formData.make} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input name="model" value={formData.model} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>License Plate</label>
            <input name="licensePlate" value={formData.licensePlate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Battery Capacity (kWh)</label>
            <input type="number" name="batteryCapacity" value={formData.batteryCapacity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Charging Type</label>
            <select name="chargingType" value={formData.chargingType} onChange={handleChange}>
              <option value="AC">AC</option>
              <option value="DC">DC</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Add Vehicle</button>
        </form>
      )}

      {vehicles.length > 0 ? (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="vehicle-card">
              <h3>{vehicle.make} {vehicle.model}</h3>
              <p><strong>Year:</strong> {vehicle.year}</p>
              <p><strong>License Plate:</strong> {vehicle.licensePlate}</p>
              <p><strong>Battery:</strong> {vehicle.batteryCapacity} kWh</p>
              <p><strong>Type:</strong> {vehicle.chargingType}</p>
              <button 
                onClick={() => handleDelete(vehicle._id)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No vehicles added yet.</p>
      )}
    </div>
  );
};

export default Vehicles;
