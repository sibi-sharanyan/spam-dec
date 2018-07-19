var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/spamDB'  , { useNewUrlParser: true });


var schema = new mongoose.Schema({ name: 'string' });
var Spam = mongoose.model('Spam', schema);

Spam.create({name : "Sibi is a good boy" } , 
 function(err , spam)
 {
     if(err)
     {
         console.log("Error");
     }
     else
     {
         console.log(spam);
     }
 });

