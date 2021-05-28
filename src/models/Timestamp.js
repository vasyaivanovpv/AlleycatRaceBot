const { Schema, model } = require("mongoose");

const schema = new Schema({
  date: Date,
  member: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  point: {
    type: Schema.Types.ObjectId,
    ref: "Point",
    required: true,
  },
  photo: String,
});

const Timestamp = model("Timestamp", schema);

module.exports = Timestamp;
