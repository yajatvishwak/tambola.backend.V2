var express = require("express");
var mongoose = require("mongoose");
var logger = require("morgan");
var socketio = require("socket.io");
var redis = require("redis");
var http = require("http");
var cors = require("cors");
var port = 3000;

var gameRouter = require("./routes/gameRouter");
var userRouter = require("./routes/userRouter");
var adminRouter = require("./routes/adminRouter");

var app = express();
app.use(cors());

var server = http.createServer(app);
var io = socketio(server);
var client = redis.createClient();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/game", gameRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

//Routes ----------

// catch 404 and forward to error handler
app.get("*", function (req, res) {
  res.status(404).send("what???");
});

//Websockets -- need to find a better way to split this up -- Found it, its called Redis :)
//Session Variable -- will now be stored in a redis server
var userAndSession = [];

// Setting up redis server for handling session
client.on("connect", function () {
  console.log("Redis client connected");
});
client.on("error", function (err) {
  console.log("Something went wrong " + err);
});

io.on("connection", (socket) => {
  console.log("[WS] A User Connected");

  socket.on("room", (parameters) => {
    socket.join(parameters.room);
    userAndSession.push({
      username: parameters.username,
      room: parameters.room,
      socket: socket,
    });
    console.log("User Joined a Room");
    var room = io.sockets.adapter.rooms["Room1"];
    //console.log(room);
    // /broadcast("Room1", "winner", "winner!!!");

    console.log(userAndSession);
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

var removeFromRoom = (roomID, user) => {
  var socketobj = userAndSession.filter((item) => {
    if (item.username === user) {
      return item;
    }
  });
  //console.log(socketobj);

  var sockets = socketobj.map((item) => {
    return item.socket;
  });
  sockets.map((soc) => {
    soc.emit("kickUser", { disconnect: true });
    soc.leave(roomID);
  });

  // var socket = socketobj[socketobj.length - 1].socket;
  // socket.emit("kickUser", { disconnect: true });
  // socket.leave(roomID);
  var room = io.sockets.adapter.rooms[roomID];
  console.log(room);
};

mongoose
  .connect("mongodb://127.0.0.1:27017/tambola", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    server.listen(port, () => {
      console.log("Gameserver Online on port %d", port);
    });
  })
  .catch(() => console.log("Gameserver Offline. Check Connections"));

exports.broadcast = broadcast;
exports.userAndSession = userAndSession;
exports.removeFromRoom = removeFromRoom;
