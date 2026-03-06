const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/", async (req,res)=>{

try{

const { station, chargingPoint, date, slot } = req.body;

const existingBooking = await Booking.findOne({
"station.stationId": station.stationId,
"chargingPoint.pointId": chargingPoint.pointId,
date,
slot,
status: { $ne: "Cancelled" }
});

if(existingBooking){
return res.status(400).json({
error:"Slot already booked"
});
}

const booking = new Booking(req.body);
await booking.save();

const io = req.app.get("io");

io.emit("slotBooked", booking);

res.status(201).json({
success:true,
booking
});

}catch(err){
res.status(400).json({error:err.message});
}

});


router.get("/user/:userId", async (req,res)=>{

try{

const bookings = await Booking.find({
user:req.params.userId
})
.populate("vehicle")
.sort({createdAt:-1});

res.json(bookings);

}catch(err){

console.error(err);

res.status(500).json({
error:err.message
});

}

});

router.get("/station/:stationId", async (req,res)=>{

try{

const bookings = await Booking.find({
"station.stationId":req.params.stationId
});

res.json(bookings);

}catch(err){

res.status(500).json({error:err.message});

}

});

router.post("/verify", async (req,res)=>{

try{

const { bookingId, paymentId } = req.body;

await Booking.findByIdAndUpdate(
bookingId,
{
status:"Confirmed",
paymentStatus:"Paid",
paymentId
}
);

res.json({success:true});

}catch(err){
res.status(500).json({error:err.message});
}

});

module.exports = router;