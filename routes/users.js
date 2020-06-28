var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");
var api_key = "28ac16b4-b933-11ea-9fa5-0200cd936042";
var axios = require("axios");
var otpValidation = false;

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

router.post("/register", function (req, res, next) {
  addToDB(req, res);
});

async function addToDB(req, res) {
  var user = new User({
    email: req.body.email,
    username: req.body.username,
    phone: req.body.phone,
    password: User.hashPassword(req.body.password),
    creation_dt: Date.now(),
  });

  try {
    doc = await user.save();
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(501).json(err);
  }
}

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return res.status(501).json(err);
    }
    if (!user) {
      return res.status(501).json(info);
    }
    req.logIn(user, function (err) {
      if (err) {
        return res.status(501).json(err);
      }
      return res.status(200).json({ message: "Login Successful" });
    });
  })(req, res, next);
});

router.post("/validatePhone", function (req, res, next) {
  checkDB(req, res);
});

async function checkDB(req, res) {
  // var user = new User({
  //   phone: req.body.phone,
  // });

  try {
    console.log("phone", req.body.phone);
    doc = await User.find({ phone: req.body.phone });
    return res.status(201).json({ message: "Registered Phone Number" });
  } catch (err) {
    return res.status(501).json(err);
  }
}

router.post("/generateOtp", function (req, res, next) {
  createOtp(req, res);
});

async function createOtp(req, res) {
  // var user = new User({
  //   phone: req.body.phone,
  // });

  try {
    console.log("phone", req.body.phone);
    var cOtp = Math.floor(Math.random() * 100000 + 1);
    const filter = { phone: req.body.phone };
    const update = { otp: cOtp };
    console.log("created OTP", cOtp);
    doc = await User.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true, // Make this update into an upsert
    });
    //https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp}
    const url =
      "https://2factor.in/API/V1/" +
      api_key +
      "/SMS/" +
      req.body.phone +
      "/" +
      cOtp;
    console.log("doc", url);
    const sms = await axios.get(url);
    console.log("res", sms.data);
    if (doc) {
    }
    return res.status(201).json({ message: "OTP Created and sent" });
  } catch (err) {
    return res.status(501).json(err);
  }
}

router.post("/validateOtp", function (req, res, next) {
  validateOtp(req, res);
});

async function validateOtp(req, res) {
  // var user = new User({
  //   phone: req.body.phone,
  // });

  try {
    console.log("phone", req.body.phone);
    console.log("otp", req.body.otp);
    doc = await User.find({ phone: req.body.phone }, { otp: req.body.otp });
    otpValidation = !otpValidation;
    return res.status(201).json({ message: "OTP validation successful" });
  } catch (err) {
    return res.status(501).json(err);
  }
}

router.get("/user", isValidUser, function (req, res, next) {
  return res.status(200).json(req.user);
});

router.get("/logout", isValidUser, function (req, res, next) {
  otpValidation = !otpValidation;
  req.logout();
  return res.status(200).json({ message: "logout successful" });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated() || otpValidation) next();
  else return res.status(401).json({ message: "unauthorised request" });
}

module.exports = router;
