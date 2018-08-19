var mongoose = require("mongoose");

var schema = new mongoose.Schema({ message: 'string' , reason: 'string' , authorid : {type : mongoose.Schema.Types.ObjectId , ref : "user"} , 
author : 'string' , date: { type: Date, default: Date.now } 
 }); 

module.exports = mongoose.model('spam', schema);