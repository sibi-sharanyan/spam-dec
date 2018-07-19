var express     = require("express"),
    app         = express(),
    bodyParser = require("body-parser"),
    stringSimilarity = require('string-similarity'),
    mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/spamDB'  , { useNewUrlParser: true });
var schema = new mongoose.Schema({ message: 'string' , reason: 'string'  });
var Spam = mongoose.model('spam', schema);


    
let max;
let si;
let matchedSpam;
let re;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
    
app.get("/" , function(req,res){
    res.redirect("/index");
})

app.get("/index" , function(req,res){
    res.render("front.ejs");
})

app.get("/submit" , function(req,res){
    res.render("submit.ejs");
})

app.post("/thanks" , function(req,res){
    
    var sub =  req.body.submission;
    var rea =  req.body.reason;
    Spam.create({message : sub , reason : rea} , 
 function(err , spam)
 {
     if(err)
     {
         console.log("Error");
     }
     else
     {
         res.render("thanks.ejs" , {sub : spam.message , rea :spam.reason});
     }
 });

    
    
}  )

app.post("/result" , function(req,res){
var a = req.body.comment;

Spam.find({} , function(err , spam){
    if(err)
    {
        console.log("Error");
    }
    else
    {
        max = 0;
        spam.forEach( function(msg) {
            if(msg.message != undefined) {
            si = stringSimilarity.compareTwoStrings(msg.message , a);
            if(si > max) 
            {
               
                max = si;
                matchedSpam = msg.message;
                re = msg.reason;
            }
            }
            
        });


    }
            if(max > 0.7)
{
    console.log(a + " matches with " + matchedSpam + " with a scale of " + max );
    
}
  res.render("result" , {match : matchedSpam , max : max , inp : a , reason : re });

});

  
})


app.listen(process.env.PORT, process.env.IP, function(){
  console.log("The SpamDec Server Has Started!");
});

