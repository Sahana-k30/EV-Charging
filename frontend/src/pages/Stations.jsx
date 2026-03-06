import React, { useState, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import StationDetailModal from "../components/StationDetailModal";
import "../styles/Stations.css";

const Stations = () => {

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // -----------------------------------------
  // GET USER LOCATION ON PAGE LOAD
  // -----------------------------------------

  useEffect(() => {

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        setUserLocation(location);

        fetchStations(location.lat, location.lng, "nearby");
      },
      () => {
        setError("Location permission denied");
      }
    );

  }, []);


  // -----------------------------------------
  // FETCH STATIONS FROM BACKEND
  // -----------------------------------------

  const fetchStations = async (lat, lng, mode = "nearby") => {

    try {

      setLoading(true);

      const distance = mode === "nearby" ? 15 : 100;

      const res = await fetch(
        `/api/external-stations/nearby?lat=${lat}&lng=${lng}&distance=${distance}`
      );

      const data = await res.json();

      const mappedStations = data.stations.map((s) => ({

        _id: s._id || s.id || s.name,

        name: s.name,

        location: {
          address: s.location?.address || s.address,
          city: s.location?.city || s.city,
          coordinates: s.location?.coordinates || s.coordinates
        },

        status: "Operational",

        chargingPoints: [

          {
            pointId: "CP-01",
            type: "CCS",
            power: 50
          },

          {
            pointId: "CP-02",
            type: "Type2",
            power: 22
          },

          {
            pointId: "CP-03",
            type: "CHAdeMO",
            power: 50
          }

        ],

        availablePoints: 3,
        totalPoints: 3

      }));
      setStations(mappedStations);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch stations");
    }

    setLoading(false);

  };


  // -----------------------------------------
  // SEARCH CITY (GEOCODING)
  // -----------------------------------------

  const searchCity = async () => {

    if (!searchQuery.trim()) {

      if (userLocation) {
        fetchStations(userLocation.lat, userLocation.lng, "nearby");
      }

      return;
    }

    try {

      setLoading(true);

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json`
      );

      const geoData = await geoRes.json();

      if (!geoData.length) {
        setError("City not found");
        setLoading(false);
        return;
      }

      const lat = geoData[0].lat;
      const lng = geoData[0].lon;

      fetchStations(lat, lng, filter);

    } catch (err) {
      console.error(err);
      setError("City search failed");
      setLoading(false);
    }

  };


  // -----------------------------------------
  // HANDLE FILTER CHANGE
  // -----------------------------------------

  const handleFilterChange = (mode) => {

    setFilter(mode);

    if (searchQuery.trim()) {
      searchCity();
    }
    else if (userLocation) {
      fetchStations(userLocation.lat, userLocation.lng, mode);
    }

  };


  // -----------------------------------------
  // CLICK STATION
  // -----------------------------------------

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowModal(true);
  };


  // -----------------------------------------
  // UI
  // -----------------------------------------

  if (loading) {
    return (
      <div className="stations-page">
        <div className="loading-container">
          <p>Loading charging stations...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="stations-page">

      <div className="stations-header">
        <h1>⚡ EV Charging Stations</h1>
        <p className="subtitle">
          Find charging stations near you in real-time
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}


      {/* MAP */}

      <div className="map-section">

        <MapComponent
          stations={stations}
          userLocation={userLocation}
          onStationClick={handleStationClick}
        />

      </div>


      {/* CONTROLS */}

      <div className="stations-controls">

        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="nearby">Nearby (15 km)</option>
          <option value="all">All stations in city</option>
        </select>


        <input
          type="text"
          placeholder="Search city (ex: Chennai)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchCity();
            }
          }}
        />

        <button onClick={searchCity}>Search</button>

      </div>


      {/* STATION LIST */}

      <div className="stations-grid">

        {stations.map((station) => (

          <div
            key={station._id || station.name}
            className="station-card flexflex-col justify-between"
            onClick={() => handleStationClick(station)}
          >

            <h3 className="text-xl font-bold">{station.name}</h3>

            <p>{station.location?.address}</p>

            <p>{station.location?.city}</p>

            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 "
              onClick={(e) => {
                e.stopPropagation();
                handleStationClick(station);
              }}
            >
              View & Book
            </button>

          </div>

        ))}

      </div>


      {/* MODAL */}

      <StationDetailModal
        station={selectedStation}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

    </div>

  );

};

export default Stations;