const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10;
var SessionSchema = new Schema(
  {
    type: String, //Open or private
    date: Date,
    done: [Number],
    calling: [Number],
    active: Boolean,
    signedUpUsers: [String],
    connectedUsers: { type: Array, default: [] },
    pause: { type: Boolean, default: false },
    gameOver: Boolean,
    winnerobj: { type: Array, default: [] },
    deets: {
      Roomname: String,
      description: String,
      coupons: Number,
      prize: [Number],
    },
    roomID: { type: String, required: true, index: { unique: true } },
    secretKey: { type: String, required: false },
    settings: {
      maxUsers: { type: Number, default: 10 },
      category: [String],
    },
  },
  {
    collection: "Sessions",
  }
);

SessionSchema.pre("save", function (next) {
  var session = this;

  // only hash the secretKey if it has been modified (or is new)
  if (!session.isModified("secretKey") || session.type == "Open") return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the secretKey using our new salt
    bcrypt.hash(session.secretKey, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext secretKey with the hashed one
      session.secretKey = hash;
      next();
    });
  });
});

SessionSchema.methods.compareSecretKey = function (candidateSecretKey, cb) {
  bcrypt.compare(candidateSecretKey, this.secretKey, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model("Session", SessionSchema);
