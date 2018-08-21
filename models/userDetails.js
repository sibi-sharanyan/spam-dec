var mongoose = require("mongoose");
var personSchema = new mongoose.Schema({
    id : String ,
    spamCount : Number , 
    email : String ,
    date: { type: Date, default: Date.now } ,
    name : String
    
});

module.exports = mongoose.model("person" , personSchema);
