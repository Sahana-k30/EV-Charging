const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

station:{
stationId:{
type:String,
required:true
},
name:{
type:String,
required:true
},
address:{
type:String,
required:true
}
},

vehicle:{
type:mongoose.Schema.Types.ObjectId,
ref:"Vehicle",
required:true
},

chargingPoint:{
pointId:{
type:String,
required:true
},

type:{
type:String,
required:true
},

power:{
type:Number,
required:true
}
},

date:{
    type:String,
    required:true
},

slot:{
type:String,
required:true
},

status:{
type:String,
enum:["Pending","Confirmed","In Progress","Completed","Cancelled","Failed"],
default:"Pending"
},

initialBatteryLevel:{
type:Number,
required:true,
min:0,
max:100
},

targetBatteryLevel:{
type:Number,
required:true,
min:0,
max:100
},

energyConsumed:{
type:Number,
default:0
},

cost:{
energyCost:{type:Number,default:0},
parkingCost:{type:Number,default:0},
tax:{type:Number,default:0},
total:{type:Number,default:0}
},
paymentStatus:{
type:String,
enum:["Pending","Paid"],
default:"Pending"
},

paymentId:{
type:String
}

},{
timestamps:true
});

bookingSchema.pre("validate",function(next){

if(this.targetBatteryLevel <= this.initialBatteryLevel){
this.invalidate(
"targetBatteryLevel",
"Target battery level must be higher than initial battery level"
);
}

next();

});

module.exports = mongoose.model("Booking",bookingSchema);