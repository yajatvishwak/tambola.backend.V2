// sample run
// var t = [
//   [0, 15, 0, 0, 41, 0, 61, 74, 81],
//   [0, 17, 22, 0, 0, 54, 68, 0, 85],
//   [6, 0, 0, 33, 0, 57, 69, 0, 88],
// ];
// //console.log(t);
// var done = [72, 22, 41, 81, 61, 74, 5];
// //console.log(done);
// var checkMap = [
//   [1, 0, 1, 1, 1, 1, 1, 1, 1],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0],
// ];
// var claim = true;

// for (var i = 0; i < 3; i++) {
//   for (var j = 0; j < 9; j++) {
//     if (checkMap[i][j] == 1) {
//       //check ticket for this number
//       if (t[i][j] == 0) {
//         continue;
//       } else {
//         if (done.indexOf(t[i][j]) == -1) {
//           claim = false;
//         }
//       }
//     }
//   }
// }

var categories = [
  {
    type: "FR",
    checkMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    type: "SR",
    checkMap: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    type: "TR",
    checkMap: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    type: "FH",
    checkMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];

/* ----------------------------
    Function to check if the claim of the user is right given their current ticket, a checkMap and the previously called array 
    checkMap : put 1 in every record that needs checking eg firstrow
    [[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]]
    returns true if the claim is true ie. 
   
*/

const checkClaim = (ticket, check, done) => {
  var claim = true;
  var checkMapobj = categories.filter((item) => {
    return item.type == check;
  });
  var checkMap = checkMapobj[0].checkMap;
  //console.log(checkMap);

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 9; j++) {
      if (checkMap[i][j] == 1) {
        //check ticket for this number
        if (ticket[i][j] == 0) {
          continue;
        } else {
          if (done.indexOf(ticket[i][j]) == -1) {
            claim = false;
          }
        }
      }
    }
  }
  return claim;
};

exports.checkClaim = checkClaim;
