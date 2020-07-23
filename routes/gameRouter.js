/*Handles  all the game functionality:
1. Generating a ticket -> /game/generateTicket
2. Starting a game in the room -> /game/startGame => post => {roomID, secretKey}
3. Checking if the game is active or not -> /game/checkGameStatus => post => {roomID}
4. Checking winner -> game/checkWinner => post => {roomID, ticket usrname, type}
5. get the list of category in a room  -> /game/getCategory => post => {roomID}
6. Pause game -> /game/pause => post => {roomID} 
*/
const express = require("express");
const router = express.Router();

const gameController = require("../controllers/gameController");

// Note: this route is actually /game due to our index.js setup
//router.get("/helloworld", gameController.helloWorld);
router.get("/generateTicket", gameController.generateTicket);
router.post("/startGame", gameController.startGame);
router.post("/startInstant", gameController.startInstant);
router.post("/checkGameStatus", gameController.checkGameStatus);
router.post("/checkWinner", gameController.checkWinner);
router.post("/checkWinnerInstant", gameController.checkWinnerInstant);
router.post("/getCategory", gameController.getCategory);
router.post("/pauseGame", gameController.pauseGame);
router.post("/getCategoryandTicket", gameController.getCategoryandTicket);
router.post(
  "/getCategoryandTicketInstant",
  gameController.getCategoryandTicketInstant
);
router.post("/getWinners", gameController.getWinners);
router.post("/getWinnersInstant", gameController.getWinnersInstant);

module.exports = router;
