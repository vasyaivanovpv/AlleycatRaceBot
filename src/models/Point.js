const { Schema, model } = require("mongoose");

const schema = new Schema({
  index: Number,
  photoPlace: String,
  location: {
    latitude: Number,
    longitude: Number,
  },
  code: String,
  race: {
    type: Schema.Types.ObjectId,
    ref: "Race",
    required: true,
  },
  firstMessageId: String,
  secondMessageId: String,
});

const Point = model("Point", schema);

module.exports = Point;
