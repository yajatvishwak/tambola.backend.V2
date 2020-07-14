/* Changelog
    17 June,2020
      - getWinners route added
      - added crash protection to gameController
      - correct sending number even after paused session
    18 June,2020
      - getWinners route - crash protection 

    TODO:
      - Crash protection for multiple routes
      - Dockerize
*/
var Session = require("../models/Session");
var User = require("../models/User");

var Broacast = require("../app");
var shuffle = require("lodash.shuffle");
const ticketGenerator = require("./ProjectT/ticketGen");
const ticketChecker = require("./ProjectT/ticketChk");
const typeGen = require("./ProjectT/typeGen");

var helloWorld = (req, res) => {
  res.send("Hello World!");
};

var generateTicket = (req, res) => {
  var ticket = ticketGenerator.getTickets(1);
  res.send(ticket[0]);
};
//sends true if the game is active
var checkGameStatus = async (req, res) => {
  var roomID = req.body.roomID;
  var present = false;
  if (roomID) {
    await Session.findOne({ roomID }, (err, session) => {
      if (err || session === null) {
        console.log(err);
        present = false;
      } else {
        var active = session.active;
        if (active) {
          present = true;
        }
      }
    });
    res.send(present);
  } else {
    res.send(false);
  }
};

var startGame = (req, res) => {
  var roomID = req.body.roomID;
  var interval = req.body.interval || 10;
  try {
    if (roomID) {
      Session.update(
        { roomID: roomID.trim() },
        { $set: { pause: false, active: true } },
        function (err, affected) {
          console.log("affected: ", affected);
          Broacast.broadcast(roomID, "broadcast", {
            ready: true,
          });
        }
      );

      try {
        var loop = setInterval(() => {
          Session.findOne({ roomID: roomID.trim() }, (err, session) => {
            console.log(session.pause);
            if (
              session.pause ||
              session.gameOver === true ||
              session.calling.length === 0
            ) {
              clearInterval(loop);
            } else {
              nextNumber(roomID);
            }
          });
        }, interval * 1000);
        console.log("[EXP] Game started for %s Now Broadcasting...", roomID);
        res.send(true);
      } catch (err) {
        console.log(err);
        res.send(false);
      }
    } else {
      res.send(false);
    }
  } catch (err) {
    res.send(false);
  }
};
var pauseGame = async (req, res) => {
  var roomID = req.body.roomID;
  if (roomID) {
    await Session.findOneAndUpdate({ roomID }, { pause: true }, (err) => {
      console.log("updated");
      if (err) res.send(false);
      else res.send(true);
    });
  } else {
    res.send(false);
  }
};

var nextNumber = (roomID) => {
  Session.findOne({ roomID }, (err, session) => {
    if (err) {
      console.log(err);
      res.send(false);
    } else {
      var calling = session.calling;
      var done = session.done;
      var randomNumber = shuffle(calling)[0];
      done.push(randomNumber);
      Broacast.broadcast(roomID, "broadcast", {
        number: randomNumber,
        connected: session.signedUpUsers.length,
        done: done,
        gameOver: false,
      });

      var index = calling.indexOf(randomNumber);
      if (index > -1) {
        calling.splice(index, 1);
      }
      session.updateOne({ done: done, calling: calling }, (err) => {
        if (err) console.log(err);
      });
    }
  });
};

var getCategory = (req, res) => {
  var roomID = req.body.roomID;
  if (roomID) {
    Session.findOne({ roomID }, (err, session) => {
      if (err) {
        console.log(err);
        res.send(false);
      } else {
        var settings = session.settings;
        var category = settings.category;
        res.send(category);
      }
    });
  } else {
    res.send(false);
  }
};

// update - 1-june-perfomance
var getCategoryandTicket = (req, res) => {
  var roomID = req.body.roomID;
  var user = req.body.username;
  if (user && roomID) {
    Session.findOne({ roomID }, (err, session) => {
      if (err) {
        res.send(false);
      } else {
        var settings = session.settings;
        var category = settings.category;
        User.findOne({ username: user }, async (err, user) => {
          if (err) {
            res.send(false);
          } else {
            var tickets = user.tickets;
            //console.log(tickets);
            var isPresent = false;
            tickets.map((item) => {
              if (item.roomID === roomID) {
                isPresent = true;
              }
            });
            console.log(isPresent);

            if (isPresent === false || tickets.length == 0) {
              console.log("in if");
              var ticket = ticketGenerator.getTickets(1);
              tickets.push({ ticket: ticket[0], roomID: roomID });
              console.log(tickets);
              await user.updateOne({ $set: { tickets: tickets } });
              console.log(ticket);
              res.send({
                category: category,
                ticket: ticket[0],
              });
            } else {
              var tickets = user.tickets;
              //console.log(tickets);
              var obj = tickets.filter((item) => {
                return item.roomID === roomID;
              });
              ticket = obj[0].ticket;
              console.log(ticket);
              res.send({
                category: category,
                ticket: ticket,
              });
            }
          }
        });
      }
    });
  } else {
    res.send(false);
  }
};

var checkWinner = (req, res) => {
  var ticket = req.body.ticket;
  var type = req.body.type;
  var user = req.body.username;
  var roomID = req.body.roomID;
  var tempGO = false;
  //console.log(ticket);
  if (ticket && type && user && roomID) {
    Session.findOne({ roomID }, async (err, session) => {
      if (err) {
        console.log(err);
        res.send(false);
      } else {
        var winnerObj = session.winnerobj;
        //console.log(session.done + "" + session.gameOver);
        var claim = ticketChecker.checkClaim(ticket, type, session.done);
        //console.log(winnerObj);
        var expectedClaim = winnerObj.filter((item) => {
          return item.type === type;
        });
        console.log(expectedClaim);
        if (expectedClaim[0].modified === true) {
          res.send({ code: "DWC", user: user }); //Duplicate winner claim code
        } else {
          if (claim && session.gameOver === false) {
            if (type == "FH") {
              winnerObj = winnerObj.map((item) => {
                if (item.modified == false) {
                  return { type: item.type, name: user, modified: true };
                } else {
                  return item;
                }
              });
              Session.update(
                { roomID: roomID.trim() },
                { $set: { pause: true, active: false, gameOver: true } }, //active: true
                function (err, affected) {
                  console.log("affected: ", affected);
                  tempGO = true;
                  console.log(tempGO);
                }
              );
              //Untested
              var Useradmin = await User.findOne({ username: user });
              console.log(Useradmin);
              Useradmin.admin = "disabled";
              Useradmin.save();
            } else {
              winnerObj = winnerObj.map((item) => {
                if (item.type == type) {
                  return { type: type, name: user, modified: true };
                } else {
                  return item;
                }
              });
            }
            Broacast.broadcast(roomID, "winner", {
              message: type + " won by " + user,
              winnerobj: winnerObj,
              gameOver: tempGO, //tempGo does not work -- gameover is actually handled by the type - if  type == FH gameover is set
              type: type,
            });
            await session.updateOne({ winnerobj: winnerObj });
            res.send(true);
          } else {
            res.send(false);
          }
        }
      }
    });
  } else {
    res.send(false);
  }
};

const getWinners = (req, res) => {
  var roomID = req.body.roomID;
  console.log(roomID);
  if (roomID) {
    Session.findOne({ roomID }, (err, session) => {
      if (err) {
        res.send(err);
      } else {
        try {
          var winnersobj = session.winnerobj;
          var winners = winnersobj.map((item) => {
            return item.name;
          });

          var typesobj = winnersobj.map((item) => {
            return item.type;
          });
          var types = typesobj.map((item) => {
            return typeGen.typeGen(item);
          });
          // console.log(winnersobj);
          // console.log(typesobj);
          // console.log(types);
          // console.log(winners);

          var fin = Object.assign.apply(
            {},
            types.map((v, i) => ({ [v]: winners[i] }))
          );
          console.log(fin);
          res.send(fin);
        } catch (err) {
          res.send(false);
        }
      }
    });
  }
};

exports.helloWorld = helloWorld;
exports.generateTicket = generateTicket;
exports.startGame = startGame;
exports.checkGameStatus = checkGameStatus;
exports.checkWinner = checkWinner;
exports.getCategory = getCategory;
exports.pauseGame = pauseGame;
exports.getCategoryandTicket = getCategoryandTicket;
exports.getWinners = getWinners;
