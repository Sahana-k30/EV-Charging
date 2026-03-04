import React, { useState, useEffect } from 'react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    batteryCapacity: '',
    chargingType: 'Level 2'
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
      } else if (res.status === 401) {
        console.error('Not authenticated');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'year' || name === 'batteryCapacity' ? parseInt(value) : value 
    });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.make.trim()) {
      setFormError('Make is required');
      return false;
    }
    if (!formData.model.trim()) {
      setFormError('Model is required');
      return false;
    }
    if (!formData.year || formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
      setFormError('Please enter a valid year');
      return false;
    }
    if (!formData.licensePlate.trim()) {
      setFormError('License plate is required');
      return false;
    }
    if (!formData.batteryCapacity || formData.batteryCapacity <= 0) {
      setFormError('Battery capacity must be greater than 0');
      return false;
    }
    if (!formData.chargingType) {
      setFormError('Charging type is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setFormSuccess(`Vehicle ${formData.make} ${formData.model} added successfully!`);
        setFormData({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          batteryCapacity: '',
          chargingType: 'Level 2'
        });
        setShowForm(false);
        fetchVehicles();
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || 'Error adding vehicle');
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setFormError('Failed to add vehicle. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setFormSuccess('Vehicle deleted successfully!');
        fetchVehicles();
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || 'Error deleting vehicle');
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setFormError('Failed to delete vehicle. Please try again.');
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

      {formError && (
        <div className="form-error" style={{ color: '#d32f2f', padding: '12px', marginTop: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="form-success" style={{ color: '#388e3c', padding: '12px', marginTop: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
          {formSuccess}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-group">
            <label>Make *</label>
            <input 
              name="make" 
              value={formData.make} 
              onChange={handleChange} 
              placeholder="e.g., Tesla"
              required 
            />
          </div>
          <div className="form-group">
            <label>Model *</label>
            <input 
              name="model" 
              value={formData.model} 
              onChange={handleChange} 
              placeholder="e.g., Model 3"
              required 
            />
          </div>
          <div className="form-group">
            <label>Year *</label>
            <input 
              type="number" 
              name="year" 
              value={formData.year} 
              onChange={handleChange} 
              min="2000"
              max={new Date().getFullYear() + 1}
              required 
            />
          </div>
          <div className="form-group">
            <label>License Plate *</label>
            <input 
              name="licensePlate" 
              value={formData.licensePlate} 
              onChange={handleChange} 
              placeholder="e.g., ABC123"
              required 
            />
          </div>
          <div className="form-group">
            <label>Battery Capacity (kWh) *</label>
            <input 
              type="number" 
              step="0.1"
              name="batteryCapacity" 
              value={formData.batteryCapacity} 
              onChange={handleChange} 
              placeholder="e.g., 75"
              required 
            />
          </div>
          <div className="form-group">
            <label>Charging Type *</label>
            <select name="chargingType" value={formData.chargingType} onChange={handleChange} required>
              <option value="Level 1">Level 1 (120V)</option>
              <option value="Level 2">Level 2 (240V)</option>
              <option value="DC Fast Charging">DC Fast Charging</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Adding Vehicle...' : 'Add Vehicle'}
          </button>
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
              <p><strong>Charging Type:</strong> {vehicle.chargingType}</p>
              
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
        <p>No vehicles added yet. Add your first vehicle to get started!</p>
      )}
    </div>
  );
};

export default Vehicles;
