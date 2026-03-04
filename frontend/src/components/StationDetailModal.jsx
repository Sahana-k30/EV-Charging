import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StationDetailModal.css";

const StationDetailModal = ({ station, isOpen, onClose }) => {

  const [activeTab, setActiveTab] = useState("details");
  const navigate = useNavigate();

  if (!isOpen || !station) return null;

  const handleBookStation = () => {
    console.log("Station object:", station);
    // save station in localStorage
    localStorage.setItem("selectedStation", JSON.stringify(station));

    // redirect to booking page
    navigate("/bookings");

  };

  return (

    <div className="modal-overlay" onClick={onClose}>

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>{station.name}</h2>
          <p className="station-address">
            {station.location?.address || "Address unavailable"}
          </p>
        </div>


        {/* Tabs */}

        <div className="modal-tabs">

          <button
            className={activeTab === "details" ? "active" : ""}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>

          <button
            className={activeTab === "book" ? "active" : ""}
            onClick={() => setActiveTab("book")}
          >
            Book
          </button>

        </div>



        {/* DETAILS TAB */}

        {activeTab === "details" && (

          <div className="modal-details">

            <div className="detail-section">
              <h3>📍 Location</h3>
              <p>{station.location?.address}</p>
              <p>{station.location?.city}</p>
            </div>

            <div className="detail-section">
              <h3>⚡ Charging Points</h3>

              {station.chargingPoints?.length ? (

                station.chargingPoints.map((point, idx) => (

                  <div key={idx} className="charging-point">

                    <strong>{point.type}</strong>

                    <p>{point.power} kW</p>

                  </div>

                ))

              ) : (

                <p>No charging points available</p>

              )}

            </div>

            <div className="detail-section">
              <h3>🕐 Operating Hours</h3>
              <p>
                {station.operatingHours?.open} - {station.operatingHours?.close}
              </p>
            </div>

          </div>

        )}



        {/* BOOK TAB */}

        {activeTab === "book" && (

          <div className="modal-book">

            <p>
              Ready to charge your vehicle at <strong>{station.name}</strong>?
            </p>

            <button
              className="btn-success"
              onClick={handleBookStation}
            >
              Book Station
            </button>

          </div>

        )}

      </div>

    </div>

  );

};

export default StationDetailModal;