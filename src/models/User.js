const { Schema, model } = require("mongoose");

const schema = new Schema({
  joined: Date,
  telegramId: String,
  firstName: String,
  lastName: String,
  isBanned: Boolean,
  blocked: Boolean,
});

const User = model("User", schema);

module.exports = User;
