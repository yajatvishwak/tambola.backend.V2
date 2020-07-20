var express = require("express");
var mongoose = require("mongoose");
var logger = require("morgan");
var socketio = require("socket.io");
const Redis = require("ioredis");
const redis = new Redis();
var http = require("http");
var cors = require("cors");
const parseArgs = require("minimist");
const args = parseArgs(process.argv.slice(2));
var redis_sock = require("socket.io-redis");

const { name = "default", port = "3000" } = args;

var gameRouter = require("./routes/gameRouter");
var userRouter = require("./routes/userRouter");
var adminRouter = require("./routes/adminRouter");
const Session = require("./models/Session");

var app = express();
app.use(cors());

var server = http.createServer(app);
var io = socketio(server);
io.adapter(redis_sock({ host: "localhost", port: 6379 }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/game", gameRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

//Routes ----------
//check connection
app.get("/checkConnection", (req, res) => {
  res.send(true);
});

// catch 404 and forward to error handler
app.get("*", function (req, res) {
  res.status(404).send("what???");
});

//Websockets -- need to find a better way to split this up -- Found it, its called Redis :)
//Session Variable -- will now be stored in a redis server

io.on("connection", (socket) => {
  console.log("[WS] A User Connected");

  socket.on("room", (parameters) => {
    socket.join(parameters.room);
    //console.log(socket.id);
    var sesh = JSON.stringify({
      username: parameters.username,
      room: parameters.room,
      socket: socket.id,
    });
    try {
      redis.rpush("UAS", sesh).then((result) => {
        //console.log("Added to redis list: " + result);
      });
    } catch (error) {
      console.log(error);
    }

    // userAndSession.push({
    //   username: parameters.username,
    //   room: parameters.room,
    //   socket: socket,
    // });
    console.log("User Joined a Room");
    var room = io.sockets.adapter.rooms["Room1"];
    //console.log(room);
    // /broadcast("Room1", "winner", "winner!!!");

    //console.log(userAndSession);
  });

  socket.on("disconnect", () => {
    console.log("[WS] A User Disconnected");
  });
});

// Broadcast function
// 1. pass in the room,the message and the channel you want to broadcast to
// 2. the client should have an socket.on("broadcast") method
// 3. When the client connects, it has to specify which room it wants to connects by using the socket.emit("room", "roomname")
// refer test/client.js for more info

var broadcast = (room, channel, message) => {
  // Object.keys(sockets.sockets).forEach((item) => {
  //   //console.log("User:", sockets.sockets[item].id);
  //   //sockets.sockets[item].emit("broadcast", "mess from server");
  // });
  io.sockets.in(room).emit(channel, message);
};
//eg for the broadcast method
// setInterval(() => broadcast("room1", "broadcast", "Hey Room1"), 1000);
// setInterval(() => broadcast("room2", "broadcast", "Hey Room2"), 1000);

var removeFromRoom = async (roomID, user) => {
  redis
    .lrange("UAS", 0, -1)
    .then((userAndSessionredis) => {
      var userAndSessions = userAndSessionredis.map((element) => {
        return JSON.parse(element);
        //console.log(parse(element));
      });
      //console.log(userAndSessionredis);
      var userAndSession = userAndSessions.filter((ele) => {
        if (ele.username === user) return ele;
      });
      //console.log(userAndSession);
      userAndSession.map((element) => {
        try {
          let socket = io.sockets.connected[element.socket];
          socket.emit("kickUser", { disconnect: true });
          socket.leave(roomID);
        } catch (err) {
          console.log("Redundant data");
        }
      });
      var updatedObj = userAndSessions.filter((ele) => {
        return ele.username !== user;
      });
      //console.log(userAndSession);
      //console.log(updatedObj);

      try {
        redis.del("UAS").then((ritem) => {
          console.log("Item removed: " + ritem);
        });
        updatedObj.map((item) => {
          redis.rpush("UAS", JSON.stringify(item)).then((result) => {
            console.log("Updated redis list: " + result);
          });
        });
      } catch (error) {
        console.log("Error in Removing");
      }
    })
    .catch((err) => {
      console.log(err);
    });
  var session = await Session.findOne({ roomID });
  var index = session.signedUpUsers.indexOf(user);
  if (index > -1) {
    var signedUpUsersNew = session.signedUpUsers;
    signedUpUsersNew.splice(index, 1);
  }
};

mongoose
  .connect("mongodb://127.0.0.1:27017/tambola", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    server.listen(port, () => {
      console.log(`Gameserver- ${name} Online on port ${port}`);
    });
  })
  .catch(() => console.log("Gameserver Offline. Check Connections"));

exports.broadcast = broadcast;
exports.removeFromRoom = removeFromRoom;
