const { Schema, model } = require("mongoose");

const schema = new Schema({
  index: Number,
  created: Date,
  name: String,
  startDate: Date,
  startDateWithTime: Date,
  poster: String,
  startPlace: String,
  finishPlace: String,
  price: Number,
  description: String,
});

const Race = model("Race", schema);

module.exports = Race;
