/*Handles  all the user functionality:
1. Generating a ticket -> /game/generateTicket
*/
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// Note: this route is actually /user due to our index.js setup
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/signUpRoom", userController.signUpRoom);
router.post("/joinRoom", userController.joinRoom);
router.get("/getSessions", userController.getSessions);

module.exports = router;
