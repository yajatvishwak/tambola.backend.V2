const Session = require("../models/Session");
const User = require("../models/User");
var shuffle = require("lodash.shuffle");
var Broadcast = require("../app");
const Redis = require("ioredis");

const redis = new Redis();
var createSession = async (req, res) => {
  var calling = [];
  var settings = req.body.settings;
  var category = settings.category;

  var winner = category.map((item) => {
    return { type: item, name: "No One", modified: false };
  });
  //console.log(winner);
  for (var i = 1; i <= 90; i++) {
    calling.push(i);
  }
  calling = shuffle(calling);

  try {
    var session = new Session({
      type: req.body.type,
      date: req.body.date || null,
      deets: req.body.deets || null,
      roomID: req.body.roomID,
      secretKey: req.body.secretKey || null,
      settings: req.body.settings || null,
      calling: calling || null,
      winnerobj: winner,
      gameOver: false,
      pause: false,
      active: false,
      signedUpUsers: ["admin"],
      ownedBy: req.body.user,
    });
    // /console.log("before save");
    var sessionStatus = await session.save();
    var Useradmin = await User.findOne({ username: req.body.user });
    //console.log(Useradmin);
    Useradmin.admin = req.body.roomID;
    Useradmin.save();

    // /console.log(sessionStatus);
    //console.log("after save");
  } catch (err) {
    console.log(err);
  }

  if (sessionStatus) {
    //queue task here
    res.send(true);
  } else {
    res.send(false);
  }
};

var resetGame = (req, res) => {
  var roomID = req.body.roomID;
  var calling = [];
  var category = [];

  for (var i = 1; i <= 90; i++) {
    calling.push(i);
  }
  calling = shuffle(calling);
  calling = shuffle(calling);
  calling = shuffle(calling);
  calling = shuffle(calling);

  Session.findOne({ roomID }, (err, session) => {
    var settings = session.settings;
    category = settings.category;
  });
  var winner = category.map((item) => {
    return { type: item, name: "No One", modified: false };
  });

  Session.update(
    { roomID: roomID },
    { $set: { done: [], calling: calling, winnerobj: winner } },
    function (err, affected) {
      console.log("affected: ", affected);
      if (err) res.send(false);
      else res.send(true);
    }
  );
};

var disconnectUser = (req, res) => {
  try {
    Broadcast.removeFromRoom(req.body.roomID, req.body.username);
    res.send(true);
  } catch (err) {
    console.log(err);
    res.send(false);
  }
};

var getParticipantsInRoom = (req, res) => {
  var roomID = req.body.roomID;
  try {
    redis.lrange("UAS", 0, -1).then((userAndSessionredis) => {
      var userandSessions = userAndSessionredis.map((ele) => {
        return JSON.parse(ele);
      });
      var userAndSession = userandSessions.filter((ele) => {
        if (ele.room === roomID) return ele;
      });
      var justName = userAndSession.map((ele) => {
        return ele.username;
      });
      justName = Object.keys(justName.reduce((p, c) => ((p[c] = true), p), {}));
      //console.log(justName);
      res.send(justName);
    });
  } catch (err) {
    console.log(err);
    res.send(false);
  }
};

var deleteSession = (req, res) => {
  var roomID = req.body.roomID;
  var user = req.body.username;
  try {
    Session.remove({ roomID: roomID }).then(async () => {
      console.log("Removed Session");
      const users = await User.findOneAndUpdate(
        { username: user },
        { admin: "disabled" },
        (err) => {
          if (err) res.send(false);
          else res.send(true);
        }
      );
    });

    Broadcast.broadcast(roomID, "deleteRoom", { deleted: true });
  } catch (err) {
    console.log(err);
    res.send(false);
  }
};
var createSessionInstant = (req, res) => {
  var roomID = req.body.roomID;
  redis.exists(roomID).then((exists) => {
    if (exists === 1) res.send(false);
    else {
      var session = {
        roomID: roomID,
        calling: [],
        done: [],
        winnerobj: [],
        gameOver: false,
        active: false,
      };
      var winner = ["FH", "FR", "SR", "TR"].map((item) => {
        return { type: item, name: "No One", modified: false };
      });
      //console.log(winner);
      var calling = [];
      for (var i = 1; i <= 90; i++) {
        calling.push(i);
      }
      calling = shuffle(calling);
      session.calling = calling;
      session.winnerobj = winner;
      console.log(session);
      redis.setex(roomID, 3600, JSON.stringify(session)).then((result) => {
        if (result) {
          res.send(true);
        } else {
          res.send(false);
        }
      });
    }
  });
};

exports.createSession = createSession;
exports.createSessionInstant = createSessionInstant;
exports.disconnectUser = disconnectUser;
exports.resetGame = resetGame;
exports.getParticipantsInRoom = getParticipantsInRoom;
exports.deleteSession = deleteSession;
