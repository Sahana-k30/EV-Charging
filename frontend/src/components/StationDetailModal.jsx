import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/StationDetailModal.css';

const StationDetailModal = ({ station, isOpen, onClose, onBookingSuccess }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [bookingData, setBookingData] = useState({
    startTime: '',
    duration: '1',
    currentBattery: '20',
    targetBattery: '80'
  });
  const [vehicleFormData, setVehicleFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    batteryCapacity: '',
    chargingType: 'Level 2'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

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

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(vehicleFormData)
      });
      
      if (res.ok) {
        setVehicleFormData({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          batteryCapacity: '',
          chargingType: 'Level 2'
        });
        setShowAddVehicle(false);
        fetchVehicles();
      } else {
        const data = await res.json();
        setError(data.error || 'Error adding vehicle');
      }
    } catch (err) {
      setError('An error occurred while adding vehicle');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle || !selectedPoint || !bookingData.startTime) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const startTime = new Date(bookingData.startTime);
      const endTime = new Date(startTime.getTime() + parseInt(bookingData.duration) * 60 * 60 * 1000);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stationId: station._id,
          vehicleId: selectedVehicle,
          chargingPoint: selectedPoint,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          initialBatteryLevel: parseInt(bookingData.currentBattery),
          targetBatteryLevel: parseInt(bookingData.targetBattery)
        })
      });

      if (res.ok) {
        const data = await res.json();
        onBookingSuccess && onBookingSuccess();
        onClose();
        alert('Booking confirmed!');
      } else {
        const data = await res.json();
        setError(data.error || 'Error creating booking');
      }
    } catch (err) {
      setError('An error occurred while booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !station) return null;

  const getChargingPointLabel = (point) => {
    return `${point.type} - ${point.power}kW (${point.status})`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <h2>{station.name}</h2>
          <p className="station-address">{station.location?.address || 'Address not available'}</p>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            Book Slot
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'details' && (
          <div className="modal-details">
            <div className="detail-section">
              <h3>📍 Location</h3>
              <p>{station.location?.address}</p>
              <p className="city-state">{station.location?.city}, {station.location?.state}</p>
            </div>

            <div className="detail-section">
              <h3>⚡ Charging Points</h3>
              <div className="charging-points-list">
                {station.chargingPoints && station.chargingPoints.length > 0 ? (
                  station.chargingPoints.map((point, idx) => (
                    <div key={idx} className={`charging-point ${point.status?.toLowerCase()}`}>
                      <span className={`status-badge ${point.status?.toLowerCase()}`}>
                        {point.status}
                      </span>
                      <div className="point-info">
                        <strong>{point.type}</strong>
                        <p>{point.power}kW • ₹{point.pricePerKWh}/kWh</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No charging points available</p>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>🕐 Operating Hours</h3>
              <p>
                {station.operatingHours?.open} - {station.operatingHours?.close}
              </p>
            </div>

            <div className="detail-section">
              <h3>💰 Pricing</h3>
              <div className="pricing-info">
                <p>Energy: ₹{station.pricing?.baseRate || 0.40}/kWh</p>
                <p>Parking: ₹{station.pricing?.parkingRate || 0.10}/hour</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book' && (
          <div className="modal-booking">
            {!showAddVehicle ? (
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label>Select Vehicle *</label>
                  <select 
                    value={selectedVehicle} 
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    required
                  >
                    <option value="">Choose a vehicle...</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </option>
                    ))}
                  </select>
                </div>

                {vehicles.length === 0 && (
                  <div className="no-vehicles-warning">
                    <p>📌 You don't have any vehicles. Please add one first.</p>
                    <button 
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddVehicle(true)}
                    >
                      + Add Vehicle
                    </button>
                  </div>
                )}

                {vehicles.length > 0 && (
                  <>
                    <div className="form-group">
                      <label>Charging Point *</label>
                      <select 
                        value={selectedPoint} 
                        onChange={(e) => setSelectedPoint(e.target.value)}
                        required
                      >
                        <option value="">Choose a charging point...</option>
                        {station.chargingPoints && station.chargingPoints.map((point, idx) => (
                          <option key={idx} value={JSON.stringify(point)}>
                            {getChargingPointLabel(point)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Start Time *</label>
                      <input 
                        type="datetime-local" 
                        value={bookingData.startTime}
                        onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration (hours) *</label>
                      <input 
                        type="number" 
                        min="0.5"
                        step="0.5"
                        value={bookingData.duration}
                        onChange={(e) => setBookingData({...bookingData, duration: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Current Battery % *</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={bookingData.currentBattery}
                          onChange={(e) => setBookingData({...bookingData, currentBattery: e.target.value})}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Target Battery % *</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={bookingData.targetBattery}
                          onChange={(e) => setBookingData({...bookingData, targetBattery: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-success" disabled={loading}>
                      {loading ? 'Booking...' : '✅ Confirm Booking'}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleAddVehicle}>
                <h3>Add New Vehicle</h3>
                <div className="form-group">
                  <label>Make</label>
                  <input 
                    name="make" 
                    value={vehicleFormData.make} 
                    onChange={(e) => setVehicleFormData({...vehicleFormData, make: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input 
                    name="model" 
                    value={vehicleFormData.model} 
                    onChange={(e) => setVehicleFormData({...vehicleFormData, model: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input 
                    type="number"
                    name="year" 
                    value={vehicleFormData.year} 
                    onChange={(e) => setVehicleFormData({...vehicleFormData, year: parseInt(e.target.value)})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>License Plate</label>
                  <input 
                    name="licensePlate" 
                    value={vehicleFormData.licensePlate} 
                    onChange={(e) => setVehicleFormData({...vehicleFormData, licensePlate: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Battery Capacity (kWh)</label>
                  <input 
                    type="number"
                    name="batteryCapacity" 
                    value={vehicleFormData.batteryCapacity} 
                    onChange={(e) => setVehicleFormData({...vehicleFormData, batteryCapacity: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Charging Type</label>
                  <select 
                    name="chargingType"
                    value={vehicleFormData.chargingType}
                    onChange={(e) => setVehicleFormData({...vehicleFormData, chargingType: e.target.value})}
                  >
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="DC Fast Charging">DC Fast Charging</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-success" disabled={loading}>
                    {loading ? 'Adding...' : '✅ Add Vehicle'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowAddVehicle(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationDetailModal;
