const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/", async (req,res)=>{

try{

const booking = new Booking(req.body);

await booking.save();

res.status(201).json({
success:true,
booking
});

}catch(err){

console.error(err);

res.status(400).json({
error:err.message
});

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

module.exports = router;