const Session = require("../models/Session");
var shuffle = require("lodash.shuffle");
var Broadcast = require("../app");
var createSession = async (req, res) => {
  var calling = [];
  var settings = req.body.settings;
  var category = settings.category;

  var winner = category.map((item) => {
    return { type: item, name: "No One", modified: false };
  });
  console.log(winner);
  for (var i = 1; i <= 90; i++) {
    calling.push(i);
  }
  calling = shuffle(calling);
  calling = shuffle(calling);
  calling = shuffle(calling);
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
    });
    // /console.log("before save");
    var sessionStatus = await session.save();

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

exports.createSession = createSession;
exports.disconnectUser = disconnectUser;
exports.resetGame = resetGame;
