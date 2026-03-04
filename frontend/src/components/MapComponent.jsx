import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ stations = [], userLocation = null, onStationClick }) => {

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {

    if (!mapInstance.current && mapRef.current) {

      const defaultCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [12.9716, 77.5946]; // Bangalore fallback

      mapInstance.current = L.map(mapRef.current).setView(defaultCenter, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(mapInstance.current);

    }

  }, []);


  // Show user location marker
  useEffect(() => {

    if (!userLocation || !mapInstance.current) return;

    const userMarker = L.circleMarker(
      [userLocation.lat, userLocation.lng],
      {
        radius: 8,
        fillColor: "#2ecc71",
        color: "#27ae60",
        weight: 2,
        fillOpacity: 0.9
      }
    )
      .bindPopup("📍 Your Location")
      .addTo(mapInstance.current);

    userMarker.isUserLocation = true;
    markersRef.current.push(userMarker);

    mapInstance.current.setView(
      [userLocation.lat, userLocation.lng],
      12
    );

  }, [userLocation]);


  // Show station markers
  useEffect(() => {

    if (!mapInstance.current) return;

    // remove old station markers
    markersRef.current
      .filter(m => !m.isUserLocation)
      .forEach(marker => mapInstance.current.removeLayer(marker));

    markersRef.current = markersRef.current.filter(m => m.isUserLocation);

    stations.forEach(station => {

      if (!station.location?.coordinates) return;

      const [lng, lat] = station.location.coordinates;

      const available = station.availablePoints || 0;
      const total = station.totalPoints || 0;

      let color = "#e74c3c";
      if (available === total) color = "#2ecc71";
      else if (available > 0) color = "#f1c40f";

      const marker = L.circleMarker(
        [lat, lng],
        {
          radius: 10,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.9
        }
      );

      marker
        .bindPopup(`
          <div style="font-size:13px">
            <strong>${station.name}</strong><br/>
            📍 ${station.location.address}<br/>
            ⚡ ${available}/${total} available
          </div>
        `)
        .addTo(mapInstance.current);

      marker.on("click", () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);

    });

    // adjust map bounds
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }

  }, [stations, userLocation, onStationClick]);


  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "10px"
      }}
    />
  );

};

export default MapComponent;