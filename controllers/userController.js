const User = require("../models/User");
const Session = require("../models/Session");

//returns true if id succefully created else false
const signup = (req, res) => {
  var user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    username: req.body.username,
    password: req.body.password,
  });
  user.save((err) => {
    if (err) {
      console.log(err);
      res.send(false);
      return;
    }
    res.send(true);
  });
};

const login = (req, res) => {
  var loginUser = {
    username: req.body.username,
    password: req.body.password,
  };
  User.findOne({ username: loginUser.username }, (err, user) => {
    if (err) {
      res.send(false);
      throw err;
    }
    user.comparePassword(loginUser.password, function (err, isMatch) {
      if (err) throw err;
      if (isMatch) console.log("[EXP] %s has logged in", loginUser.username);
      res.send(isMatch);
    });
  });
};

// TODO:
// Add room checking code here --> checking if paid or for password protected room checking password
// Check if the session is available for signup or not. ie. chk maxUsers, chk password(done!), chk if coupons
// Add game to user History if signed up games
// ------
// Signup to a room function
// 1. the request has to  specify which room it wants to signup for

const signUpRoom = async (req, res) => {
  var roomID = req.body.roomID;
  var user = req.body.username;
  var secretKey = req.body.secretKey;
  await Session.findOne({ roomID }, (err, session) => {
    if (err || session == null) {
      console.log("Something went wrong");
      res.send(false);
    } else {
      console.log(session.type);

      if (session.ownedBy === user) {
        res.send("AC"); //Admin call
      } else {
        if (session.active === false) {
          switch (session.type) {
            case "Open":
              var allsignedupusers = session.signedUpUsers;
              var newarr = [...new Set(allsignedupusers)];
              var maxUsers = session.settings.maxUsers;
              if (newarr.indexOf(user) !== -1) {
                res.send("DUS"); // duplicate user signup
              } else {
                if (allsignedupusers.length + 1 <= maxUsers) {
                  newarr.push(user);
                  console.log(newarr);
                  session.updateOne({ signedUpUsers: newarr }, (err) => {
                    if (err) res.send(false);
                    else res.send(true);
                  });
                } else {
                  res.send("MLR");
                }
              }
              break;
            case "Private":
              session.compareSecretKey(secretKey, (err, isMatch) => {
                if (err || isMatch === false) {
                  res.send(false);
                } else {
                  var allsignedupusers = session.signedUpUsers;
                  var maxUsers = session.settings.maxUsers;
                  if (allsignedupusers.length + 1 <= maxUsers) {
                    allsignedupusers.push(user);
                    session.updateOne(
                      { signedUpUsers: allsignedupusers },
                      (err) => {
                        if (err) res.send(false);
                        else res.send(true);
                      }
                    );
                  }
                }
              });
              break;
            default:
          }
        } else {
          console.log("Relogin attempt");
          res.send("RLA"); //Relogin attempt
        }
      }
    }
  });
};

// Call this  request when the user wants to enter the games
// if the request return true, handle that on the frontend and join the room
// by sending a socket emit  to the socket.io server with the same roomID to join the room
// DANGER: security breahable point
var joinRoom = async (req, res) => {
  var roomID = req.body.roomID;
  var user = req.body.username;
  var present = true;

  await Session.findOne({ roomID }, (err, session) => {
    if (err || session === null) {
      console.log(err);
      present = false;
    } else {
      var signedup = session.signedUpUsers;

      if (signedup.indexOf(user) === -1) {
        present = false;
      }
    }
  });

  res.send(present);
};

const getSessions = async (req, res) => {
  const all = await Session.find({});
  const fall = all.map((item) => {
    return {
      roomID: item.roomID,
      deets: item.deets,
      active: item.active,
      type: item.type,
    };
  });
  res.send(fall);
};

const isAdmin = async (req, res) => {
  var username = req.body.username;
  const user = await User.findOne({ username: username });
  if (user.admin !== "disabled" && user.admin !== "") {
    Session.findOne({ roomID: user.admin }).then((doc) => {
      if (doc) {
        var output = {
          admin: { isAdmin: true, roomID: user.admin },
          adminPresent: true,
        };
        res.send(output);
      } else {
        res.send("DNE"); //Does not exist
      }
    });
  } else {
    res.send(false);
  }
};

exports.signup = signup;
exports.login = login;
exports.signUpRoom = signUpRoom;
exports.joinRoom = joinRoom;
exports.getSessions = getSessions;
exports.isAdmin = isAdmin;
