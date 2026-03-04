const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Latitude and longitude required"
      });
    }

    const response = await axios.get(
      "https://api.openchargemap.io/v3/poi",
      {
        params: {
          output: "json",
          latitude: lat,
          longitude: lng,
          distance: 10,
          maxresults: 20,
          key: process.env.OPENCHARGE_API_KEY
        }
      }
    );

    const stations = response.data.map((s) => ({
      _id: s.ID.toString(),
      name: s.AddressInfo?.Title || "EV Station",
      location: {
        address: s.AddressInfo?.AddressLine1 || "Unknown",
        city: s.AddressInfo?.Town || "Unknown",
        coordinates: [
          s.AddressInfo?.Longitude,
          s.AddressInfo?.Latitude
        ]
      },
      availablePoints: 2,
      totalPoints: 4,
      status: "Operational"
    }));

    res.json({ stations });

  } catch (error) {
    console.error("External API error:", error.message);

    res.status(500).json({
      error: "Failed to fetch EV stations"
    });
  }
});

module.exports = router;