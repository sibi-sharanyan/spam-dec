var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  stringSimilarity = require("string-similarity"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose"),
  user = require("./models/user"),
  Spam = require("./models/spam"), 
  person = require("./models/userDetails") , 
  spamcnt,
  usercnt;

mongoose.connect(
  "mongodb://localhost:27017/spamDB",
  { useNewUrlParser: true }
);

let max;
let si;
let matchedSpam;
let re;
app.use(
  require("express-session")({
    secret: "Sibi the great",
    resave: false,
    saveUninitialized: false
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
passport.use(new LocalStrategy(user.authenticate()));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// The root that redirects to index
app.get("/", function(req, res) {
  res.redirect("/index");
});

// The landing page
app.get("/index", function(req, res) {
  Spam.find({}, function(err, spams) {
    if (err) {
      console.log(err);
    } else {
      spamcnt = spams.length;
      user.find({}, function(err, users) {
        if (err) {
          console.log(err);
        } else {
          usercnt = users.length;
          res.render("front.ejs", {
            user: req.user,
            ucnt: usercnt,
            scnt: spamcnt
          });
        }
      });
    }
  });
});

// Display form to register the user
app.get("/register", function(req, res) {
  res.render("register" , {user: req.user} );
});

// Register the user
var mail , uname;
app.post("/register", function(req, res) {
  req.body.username;
  req.body.password;
  mail = req.body.mail;
  uname = req.body.username;

  user.register(
    new user({ username: req.body.username }),
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        if (err.name == "UserExistsError") {
          return res.render("login", { userexist: true });
        }
      } else {
        person.create( { id: user.id , spamCount: 0 , email: mail , name: uname} , function(err , per)
      {
        if(err)
        {
          console.log(err);
        }
        else
        {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/submit");
          });
        }
      }) 
        
      }
    }
  );
});

// Display login form to the user
app.get("/login", function(req, res) {
  res.render("login", { userexist: false , user: req.user});
});

// Logging in the user
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/index",
    failureRedirect: "/login"
  }),
  function(req, res) {}
);

// Log out the user
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

// Display form to submit the spam message by logged in user
app.get("/submit", isLoggedIn, function(req, res) {
  res.render("submit.ejs" , {user: req.user});
});

// Post the spam message to the database
var msgid;
app.post("/thanks", isLoggedIn, function(req, res) {
  var sub = req.body.submission;
  var rea = req.body.reason;
  var usr = req.user._id;

  Spam.find({}, function(err, spam) {
    if (err) {
      console.log("Error");
    } else {
      max = 0;
      spam.forEach(function(msg) {
        if (msg.message != undefined) {
          si = stringSimilarity.compareTwoStrings(msg.message, sub);
          if (si > max) {
            max = si;
            matchedSpam = msg.message;
            re = msg.reason;
            msgid = msg._id;
          }
        }
      });
    }
    if (max > 0.8) {
      Spam.findById(msgid, function(err, msg) {
        if (err) {
          console.log(err);
        } else {
          msg.certainity = msg.certainity + 1;
          msg.save();
          res.render("already", { similar: matchedSpam, cert: max });
        }
      });
    } else {
      Spam.create({ message: sub.trim(), reason: rea.trim(), certainity: 1 }, function(
        err,
        spam
      ) {
        if (err) {
          console.log("Error");
        } else {
          spam.authorid = req.user._id;
          spam.author = req.user.username;
          spam.save();
          person.findOne({id: spam.authorid} , function(err , pers)
          {
            if(err)
            {
              console.log(err);
            }
            else{
              pers.spamCount = pers.spamCount + 1;
              pers.save();
              res.render("thanks.ejs", { sub: spam.message, rea: spam.reason , user: req.user });
            }
          })
          


        }
      });
    }
  });
});

// To show all the spams currently in the database
app.get("/showall", function(req, res) {
  Spam.find({}, function(err, spam) {
    if (err) {
      console.log(err);
    } else {
      spamcnt = spam.length;
      console.log(spam);
      res.render("showall.ejs", { spams: spam, cnt: spamcnt , user: req.user });
    }
  });
});

// To show all the registered users
app.get("/users", function(req, res) {
  person.find({}, function(err, user) {
    if (err) {
      console.log(err);
    } else {
      usercnt = user.length;

      res.render("alluser", { users: user, cnt: usercnt , user: req.user });
    }
  });
});

// Result of a search by a user to check for spam
app.post("/result", function(req, res) {
  var a = req.body.comment;

  Spam.find({}, function(err, spam) {
    if (err) {
      console.log("Error");
    } else {
      max = 0;
      spam.forEach(function(msg) {
        if (msg.message != undefined) {
          si = stringSimilarity.compareTwoStrings(msg.message, a);
          if (si > max) {
            max = si;
            matchedSpam = msg.message;
            re = msg.reason;
          }
        }
      });
    }
    if (max > 0.7) {
      console.log(
        a + " matches with " + matchedSpam + " with a scale of " + max
      );
    }
    res.render("result", { match: matchedSpam, max: max, inp: a, reason: re , user: req.user });
  });
});

app.listen(process.env.PORT || 3000, process.env.IP, function() {
  console.log("The SpamDec Server Has Started!");
});
