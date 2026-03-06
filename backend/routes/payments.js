const express = require("express");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const router = express.Router();

const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post("/create-order", async (req,res)=>{

try{

const { amount } = req.body;

const options = {
amount: amount * 100,
currency: "INR",
receipt: "receipt_" + Date.now()
};

const order = await razorpay.orders.create(options);

res.json(order);

}catch(err){
res.status(500).json({error:err.message});
}

});


router.post("/save", async (req,res)=>{

try{

const { bookingId, amount, paymentId } = req.body;

const booking = await Booking.findById(bookingId);

const payment = new Payment({

booking: bookingId,
user: booking.user,
station: booking.station.stationId,
amount,
currency:"INR",
status:"Completed",
paymentMethod:"Digital Wallet",
transactionId: paymentId,
paidAt:new Date()

});

await payment.save();

res.json({success:true});

}catch(err){

console.log("Payment save error:",err);
res.status(500).json({error:err.message});

}

});

router.get("/", async (req,res)=>{

try{

const payments = await Payment.find()
.sort({createdAt:-1});

res.json({payments});

}catch(err){
res.status(500).json({error:err.message});
}

});

router.get("/user/:userId", async (req,res)=>{

try{

const payments = await Payment.find({
user:req.params.userId
}).sort({createdAt:-1});

res.json({payments});

}catch(err){
res.status(500).json({error:err.message});
}

});
module.exports = router;