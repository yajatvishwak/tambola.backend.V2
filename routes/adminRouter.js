/*Handles  all the admin functionality:
1. Generating a Session -> /admin/createSession =>  post =>
{
    settings: {
        maxUsers : 
        category : ["FR","SR"],
        
    } ,
    type: "Open" or "Private" only
    roomID: ""
    secretKey: ""   
}
2. Disconnect user -> /admin/disconnectUser => post => {roomID, username}
3. reset the game ->  /admin/resetGame => post => {roomID}
*/
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

router.post("/createSession", adminController.createSession);
router.post("/disconnectUser", adminController.disconnectUser);
router.post("/resetGame", adminController.resetGame);
router.post("/getParticipants", adminController.getParticipantsInRoom);
router.post("/deleteSession", adminController.deleteSession);

module.exports = router;
