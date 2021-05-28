const { Schema, model } = require("mongoose");

const schema = new Schema({
  full: String,
  short: String,
});

const Biketype = model("Biketype", schema);

module.exports = Biketype;
