import React, { useEffect, useState } from "react";
import axios from "axios";

import { io } from "socket.io-client";

const socket = io("http://localhost:9000");
const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

const Bookings = () => {

const [bookings,setBookings] = useState([]);
const [vehicles,setVehicles] = useState([]);
const [estimatedCost,setEstimatedCost] = useState(0);

const [formData,setFormData] = useState({
vehicle:"",
chargingPointIndex:"",
date:"",
slot:"",
initialBatteryLevel:"",
targetBatteryLevel:""
});

const storedUser = JSON.parse(localStorage.getItem("user"));
const [selectedStation,setSelectedStation] = useState(null);

useEffect(() => {

  const station = JSON.parse(localStorage.getItem("selectedStation"));

  if (station) {
    setSelectedStation(station);
  }

}, []);
const userId =
storedUser?._id ||
storedUser?.id ||
storedUser?.user?._id;
const token = localStorage.getItem("token");

useEffect(()=>{

socket.on("slotBooked", ()=>{
fetchBookings();
});

return () => {
socket.off("slotBooked");
};

},[selectedStation]);

useEffect(()=>{

if(!userId) return;

fetchVehicles();

},[userId]);

useEffect(()=>{
fetchBookings();
},[userId]);


const fetchBookings = async () => {

try {

if (!userId) return;

const res = await axios.get(
`/api/bookings/user/${userId}`
);

setBookings(res.data);

} catch (err) {
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


const handleChange = (e) => {

const { name, value } = e.target;

setFormData(prev => ({
...prev,
[name]: value,
...(name === "date" ? { slot: "" } : {})
}));

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

date: formData.date,
slot: formData.slot,

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

    setFormData({
      vehicle:"",
      chargingPointIndex:"",
      date:"",
      slot:"",
      initialBatteryLevel:"",
      targetBatteryLevel:""
      });

      setEstimatedCost(0);

  } catch (err) {

    console.error("Booking error:", err.response?.data || err.message);
    alert("Booking Failed");

  }
};
const bookedSlots = bookings
.filter(b =>
b.station?.stationId === selectedStation?._id &&
b.date === formData.date &&
b.chargingPoint?.pointId === selectedStation?.chargingPoints?.[formData.chargingPointIndex]?.pointId
)
.map(b => b.slot);

const slots = [
"08:00 - 09:00",
"09:00 - 10:00",
"10:00 - 11:00",
"11:00 - 12:00"
];

const handlePayment = async (booking) => {

try{

const res = await axios.post("/api/payments/create-order",{
amount: booking.cost.total
});

const order = res.data;

const options = {

key: razorpayKey,

amount: order.amount,

currency: "INR",

name: "EV Charging",

description: "Charging Slot Booking",

order_id: order.id,

handler: async function(response){

await axios.post("/api/bookings/verify",{
bookingId: booking._id,
paymentId: response.razorpay_payment_id
});

await axios.post("/api/payments/save",{
bookingId: booking._id,
amount: booking.cost.total,
paymentId: response.razorpay_payment_id
});

alert("Payment Successful ⚡");

fetchBookings();

},

modal:{
ondismiss:function(){
alert("Payment cancelled");
}
}

};

const rzp = new window.Razorpay(options);

rzp.open();

}catch(err){

console.log(err);

}

};

return(

<div className="bg-white rounded-2xl shadow-xl max-w-4xl border m-10 ">

<h1 className="text-3xl font-bold p-100">
⚡ EV Charging Bookings
</h1>


{/* BOOKINGS SECTION */}

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">

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
Date : {b.date}
</p>

<p className="text-sm text-gray-500">
Slot : {b.slot}
</p>

<p className="text-indigo-600 font-semibold mt-2">
₹ {b.cost?.total}
</p>

<p className="text-sm mt-2">
Status : {b.status}
</p>

{b.paymentStatus === "Pending" && (

<button
className="bg-green-600 text-white px-4 py-2 mt-3 rounded"
onClick={()=>handlePayment(b)}
>
Pay Now
</button>

)}

</div>

))}

</div>


{/* BOOKING FORM */}

{!selectedStation ? (

<div className="bg-white rounded-2xl shadow-xl p-10 max-w-3xl border text-center">

<h2 className="text-2xl font-semibold mb-4">
Book Charging Slot
</h2>

<p className="text-gray-500 mb-6">
Please select a charging station from the stations page to continue booking.
</p>

<button
className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
onClick={() => window.location.href="/stations"}
>
Browse Stations
</button>

</div>

):(
  

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


<form onSubmit={handleSubmit} className="space-y-8">


{/* VEHICLE */}

<div>

<label className="font-medium text-gray-700">
Select Vehicle
</label>

<select
name="vehicle"
onChange={handleChange}
required
className="w-full border border-gray-300 rounded-lg p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">

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
className={`cursor-pointer p-5 rounded-xl border text-center transition transform hover:scale-105

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

<div>

<label className="font-medium text-gray-700">
Select Date
</label>

<input
type="date"
name="date"
min={new Date().toISOString().split("T")[0]}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
/>

</div>

{/* SLOT */}

<div>

<label className="font-medium text-gray-700">
Select Slot
</label>

<select
name="slot"
onChange={handleChange}
disabled={!formData.date}
className="w-full border rounded-lg p-3 mt-2"
> 

<option value="">Choose Slot</option>

{slots.map((slot)=>{

const isBooked = bookedSlots.includes(slot);

return(

<option
key={slot}
value={slot}
disabled={isBooked}
>

{slot} {isBooked ? "(Booked)" : "(Available)"}

</option>

);

})}

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