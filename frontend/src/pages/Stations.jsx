import React, { useState, useEffect } from 'react';
import StationDetailModal from '../components/StationDetailModal';
import '../styles/Stations.css';

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStations();
    // Request user's geolocation
    if ('geolocation' in navigator) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setGeoLoading(false);
        }
      );
    }
  }, []);

  useEffect(() => {
    applyFilter();
  }, [stations, filter, userLocation]);

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStations(data.stations || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Failed to load stations');
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const applyFilter = () => {
    let filtered = [...stations];

    if (filter === 'nearby' && userLocation) {
      // Filter stations within 15 km and sort by distance
      filtered = filtered.filter(station => {
        if (station.location?.coordinates) {
          const [lng, lat] = station.location.coordinates;
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng
          );
          return distance <= 15;
        }
        return false;
      }).sort((a, b) => {
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.location.coordinates[1],
          a.location.coordinates[0]
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.location.coordinates[1],
          b.location.coordinates[0]
        );
        return distA - distB;
      });
    } else if (filter === 'available') {
      // Filter stations with available charging points
      filtered = filtered.filter(station => 
        station.chargingPoints?.some(cp => cp.status === 'Available')
      );
    }

    setFilteredStations(filtered);
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowModal(true);
  };

  const getDistanceToStation = (station) => {
    if (!userLocation || !station.location?.coordinates) return null;
    const [lng, lat] = station.location.coordinates;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      lat,
      lng
    ).toFixed(1);
  };

  const getAvailablePoints = (station) => {
    return station.chargingPoints?.filter(cp => cp.status === 'Available').length || 0;
  };

  const getTotalPoints = (station) => {
    return station.chargingPoints?.length || 0;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div> Loading stations...</div>;
  }

  return (
    <div className="stations-page">
      <div className="stations-header">
        <h1>⚡ Charging Stations</h1>
        <p className="subtitle">Find and book your nearest EV charging station</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stations-controls">
        <div className="filter-section">
          <label htmlFor="filter-select">Filter Stations:</label>
          <select 
            id="filter-select"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">📍 All Stations</option>
            <option value="nearby" disabled={!userLocation && !geoLoading}>
              📍 Nearby (within 15 km) {geoLoading ? '...' : ''}
            </option>
            <option value="available">✅ Available Only</option>
          </select>
        </div>

        {userLocation && filter === 'nearby' && (
          <div className="location-info">
            ✅ Location enabled • {filteredStations.length} stations found
          </div>
        )}
      </div>

      {filteredStations.length > 0 ? (
        <div className="stations-grid">
          {filteredStations.map(station => {
            const distance = getDistanceToStation(station);
            const available = getAvailablePoints(station);
            const total = getTotalPoints(station);

            return (
              <div 
                key={station._id} 
                className="station-card"
                onClick={() => handleStationClick(station)}
              >
                <div className="station-card-header">
                  <h3>{station.name}</h3>
                  {distance && (
                    <span className="distance-badge">📍 {distance} km</span>
                  )}
                </div>

                <div className="station-card-body">
                  <div className="location-info-card">
                    <strong>📍 Location:</strong>
                    <p>{station.location?.address || 'Address not available'}</p>
                  </div>

                  <div className="charging-stats">
                    <div className="stat-item">
                      <span className="stat-label">Charging Points</span>
                      <span className="stat-value">{total}</span>
                    </div>
                    <div className="stat-item available">
                      <span className="stat-label">Available</span>
                      <span className="stat-value">{available}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status</span>
                      <span className={`status-badge ${station.status?.toLowerCase()}`}>
                        {station.status || 'Operational'}
                      </span>
                    </div>
                  </div>

                  <div className="operating-hours">
                    <span>🕐 {station.operatingHours?.open} - {station.operatingHours?.close}</span>
                  </div>
                </div>

                <div className="station-card-footer">
                  <button 
                    className="btn-book"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationClick(station);
                    }}
                  >
                    ➜ View & Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-stations">
          <div className="empty-state">
            <p className="empty-icon">🚗</p>
            <h3>No stations found</h3>
            <p>
              {filter === 'nearby' && userLocation 
                ? 'No charging stations found within 15 km of your location.' 
                : filter === 'available'
                ? 'No stations with available charging points.'
                : 'No stations available at the moment.'}
            </p>
            {filter !== 'all' && (
              <button 
                className="btn-reset-filter"
                onClick={() => setFilter('all')}
              >
                View All Stations
              </button>
            )}
          </div>
        </div>
      )}

      {/* Station Detail Modal */}
      <StationDetailModal 
        station={selectedStation}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onBookingSuccess={() => fetchStations()}
      />
    </div>
  );
};

export default Stations;
