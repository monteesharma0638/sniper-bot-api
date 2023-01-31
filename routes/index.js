var express = require('express');
var router = express.Router();

// router.use(express.static(path.join(__dirname, "../../build")));

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.sendFile(path.join(__dirname, "../../build", "index.html"));
  res.send("response");
});

router.post("/login", function(req, res, next){
  const { username, password } = req.body;
  if(username==="greatbenji" && password==="2zero23"){
    req.session.loggedIn = true;
    res.send({code: 1, message: "Logged In Successfully"});
  }
  else {
    res.send({code: 0, message: "Invalid Credentails"});
  }
})

router.get("/logout", function(req, res, next){
  if(req.session.loggedIn){
    req.session.loggedIn = false;
    req.session.destroy();
    res.send({code: 1, message: "Logged Out"});
  }
  else {
    res.send({code: 0, message: "No Session Detected"});
  }
})

router.get("/checkLogin", function (req, res, next){
  if(req.session.loggedIn){
    res.send({code: 1, message: "Logged In"});
  }
  else {
    res.send({code: 0, message: "Logged Out"});
  }
})

module.exports = router;
