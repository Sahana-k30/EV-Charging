import React, { useEffect, useState } from "react";
import axios from "axios";

const Bookings = () => {

const [bookings,setBookings] = useState([]);
const [vehicles,setVehicles] = useState([]);
const [selectedStation,setSelectedStation] = useState(null);
const [estimatedCost,setEstimatedCost] = useState(0);

const [formData,setFormData] = useState({
vehicle:"",
chargingPointIndex:"",
slot:"",
initialBatteryLevel:"",
targetBatteryLevel:""
});

const storedUser = JSON.parse(localStorage.getItem("user"));

const userId =
storedUser?._id ||
storedUser?.id ||
storedUser?.user?._id;
const token = localStorage.getItem("token");

useEffect(()=>{

if(!userId) return;

const station = JSON.parse(localStorage.getItem("selectedStation"));
setSelectedStation(station);

fetchBookings();
fetchVehicles();

},[userId]);


const fetchBookings = async () => {

if(!userId){
console.log("User ID missing");
return;
}

try{

const res = await axios.get(`/api/bookings/user/${userId}`);

setBookings(res.data);

}catch(err){
console.log(err);
}

};


const fetchVehicles = async()=>{

try{

const res = await axios.get("/api/vehicles",{
headers:{
Authorization:`Bearer ${token}`
}
});

setVehicles(res.data.vehicles);

}catch(err){
console.log(err);
}

};


const handleChange=(e)=>{

setFormData({
...formData,
[e.target.name]:e.target.value
});

};


const getPricePerUnit=(power)=>{

if(power>=50) return 20;
if(power>=22) return 15;
return 10;

};


useEffect(()=>{

if(
selectedStation &&
formData.initialBatteryLevel &&
formData.targetBatteryLevel &&
formData.chargingPointIndex!==""
){

const cp = selectedStation.chargingPoints[formData.chargingPointIndex];

const energy =
formData.targetBatteryLevel - formData.initialBatteryLevel;

const pricePerUnit = getPricePerUnit(cp.power);

setEstimatedCost(energy * pricePerUnit);

}

},[formData,selectedStation]);


const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    if (!selectedStation || !selectedStation._id) {
  alert("Station not selected correctly.");
  return;
}

    if (!formData.vehicle) {
      alert("Please select a vehicle");
      return;
    }

    if (formData.chargingPointIndex === "") {
      alert("Please select a charger");
      return;
    }

    const cp = selectedStation?.chargingPoints?.[formData.chargingPointIndex];

    if (!cp) {
      alert("Invalid charging point selected");
      return;
    }

    const initialBattery = Number(formData.initialBatteryLevel);
    const targetBattery = Number(formData.targetBatteryLevel);

    if (!initialBattery || !targetBattery) {
      alert("Enter battery levels");
      return;
    }

    if (initialBattery < 0 || initialBattery > 100) {
      alert("Initial battery must be between 0 and 100");
      return;
    }

    if (targetBattery < 0 || targetBattery > 100) {
      alert("Target battery must be between 0 and 100");
      return;
    }

    if (targetBattery <= initialBattery) {
      alert("Target battery must be higher than initial battery");
      return;
    }

    const bookingData = {

user:userId,

station: {
  stationId: selectedStation._id,
  name: selectedStation.name,
  address: selectedStation.location?.address
},

vehicle:formData.vehicle,

chargingPoint:{
pointId:cp.pointId,
type:cp.type,
power:cp.power
},

slot:formData.slot,

status:"Pending",

initialBatteryLevel:initialBattery,
targetBatteryLevel:targetBattery,

energyConsumed:0,

cost:{
energyCost:estimatedCost,
parkingCost:0,
tax:0,
total:estimatedCost
}

};
    console.log("Booking payload:", bookingData);

    const res = await axios.post(
      "/api/bookings",
      bookingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Booking saved:", res.data);

    fetchBookings();

    alert("Booking Successful ⚡");

  } catch (err) {

    console.error("Booking error:", err.response?.data || err.message);
    alert("Booking Failed");

  }
};


return(

<div className="min-h-screen bg-gray-100 p-10">

<h1 className="text-3xl font-bold mb-8">
⚡ EV Charging Bookings
</h1>


{/* BOOKINGS SECTION */}

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

{bookings.map((b)=>(
<div
key={b._id}
className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition border">

<h2 className="font-semibold text-lg mb-2">
{b.station?.name}
</h2>

<p className="text-sm text-gray-500">
Vehicle : {b.vehicle?.make} {b.vehicle?.model}
</p>

<p className="text-sm text-gray-500">
Slot : {b.slot}
</p>

<p className="text-sm text-gray-500">
Battery : {b.initialBatteryLevel}% → {b.targetBatteryLevel}%
</p>

<p className="text-indigo-600 font-semibold mt-2">
₹ {b.cost?.total}
</p>

</div>
))}

</div>


{/* BOOKING FORM */}

{selectedStation && (

<div className="bg-white rounded-2xl shadow-xl p-10 max-w-3xl border">

<h2 className="text-2xl font-semibold mb-6">
Book Charging Slot
</h2>


{/* STATION CARD */}

<div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl mb-8">

<p className="text-lg font-semibold text-indigo-700">
{selectedStation.name}
</p>

<p className="text-sm text-gray-600">
{selectedStation.location?.address}
</p>

</div>


<form onSubmit={handleSubmit} className="space-y-6">


{/* VEHICLE */}

<div>

<label className="font-medium text-gray-700">
Select Vehicle
</label>

<select
name="vehicle"
onChange={handleChange}
required
className="w-full border rounded-lg p-3 mt-2">

<option value="">Choose Vehicle</option>

{vehicles.map(v=>(
<option key={v._id} value={v._id}>
{v.make} {v.model} ({v.licensePlate})
</option>
))}

</select>

</div>


{/* CHARGER SELECTION */}

<div>

<label className="font-medium text-gray-700">
Select Charger
</label>

<div className="grid grid-cols-3 gap-4 mt-3">

{selectedStation?.chargingPoints?.map((cp,i)=>{

const price = getPricePerUnit(cp.power);

return(

<div
key={i}
onClick={() =>
  setFormData((prev) => ({
    ...prev,
    chargingPointIndex: i
  }))
}
className={`cursor-pointer p-4 rounded-xl border text-center transition

${formData.chargingPointIndex==i
?"border-indigo-600 bg-indigo-50"
:"border-gray-200 hover:border-indigo-400"}
`}>

<p className="font-semibold">{cp.type}</p>

<p className="text-sm text-gray-500">
{cp.power} kW
</p>

<p className="text-indigo-600 font-medium">
₹{price}/kWh
</p>

</div>

);

})}

</div>

</div>


{/* SLOT */}

<div>

<label className="font-medium text-gray-700">
Slot
</label>

<select
name="slot"
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2">

<option>08:00 - 09:00</option>
<option>09:00 - 10:00</option>
<option>10:00 - 11:00</option>
<option>11:00 - 12:00</option>

</select>

</div>


{/* BATTERY INPUT */}

<div className="grid grid-cols-2 gap-4">

<input
type="number"
name="initialBatteryLevel"
min="0"
max="100"
onChange={handleChange}
className="border rounded-lg p-3"
/>

<input
type="number"
name="targetBatteryLevel"
min="0"
max="100"
onChange={handleChange}
className="border rounded-lg p-3"
/>

</div>


{/* COST CARD */}

<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between">

<p className="font-medium text-gray-700">
Estimated Cost
</p>

<p className="text-green-600 font-bold text-lg">
₹ {estimatedCost}
</p>

</div>


<button
className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition">

Confirm Booking

</button>

</form>

</div>

)}

</div>

);

};

export default Bookings;