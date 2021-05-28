const { Schema, model } = require("mongoose");

const schema = new Schema({
  joined: Date,
  telegramId: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  race: {
    type: Schema.Types.ObjectId,
    ref: "Race",
    required: true,
  },
  name: String,
  bikeType: {
    type: Schema.Types.ObjectId,
    ref: "Biketype",
    required: true,
  },
  bikeBrand: String,
  currentPointIndex: {
    type: Number,
    default: 0,
  },
  finishPlace: Number,
  finishTime: String,
});

const Member = model("Member", schema);

module.exports = Member;
