const { TOKEN, DB_USER, DB_PASSWORD, DB_URL, CHANNEL } = require("./config");
const Telegram = require("telegraf/telegram");
const Agenda = require("agenda");

const { getTimeline } = require("./helpers");
const { formatMilliseconds } = require("./utils");
const { textBlockLimits, photoOptions } = require("./constants");

const Point = require("./models/Point");
const Timestamp = require("./models/Timestamp");

const closeUpdateAfterMinutes = 60;

const telegram = new Telegram(TOKEN);

const agenda = new Agenda({
  processEvery: "1 second",
  db: {
    address: DB_URL,
    collection: "jobsqueue",
    options: {
      user: DB_USER,
      password: DB_PASSWORD,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
});

agenda.define("update_message", async (job, done) => {
  let header, firstTime;
  const { pointID, pointType } = job.attrs.data;
  const pointDB = await Point.findById(pointID);

  const timestampsDB = await Timestamp.find(
    {
      point: pointDB,
      photo: photoOptions[pointType].value,
    },
    null,
    { limit: textBlockLimits.COUNT_LINE, sort: { date: 1 } }
  ).populate({
    path: "member",
    populate: ["bikeType", "race"],
  });

  const timelines = timestampsDB.reduce((acc, timestamp, i) => {
    if (!i) {
      const task = timestamp.photo ? "сделать фото" : "найти кодовое слово";

      firstTime = timestamp.date;
      header = `*${timestamp.member.race.name}*, live\n\n*Локация ${pointDB.index}*\n_${task}_`;
    }

    const timeStr = formatMilliseconds(
      timestamp.date - timestamp.member.race.startDateWithTime,
      true,
      true
    );
    const timeline = getTimeline(timestamp.member, timeStr, i + 1);

    acc = `${acc}${timeline}\n`;
    return acc;
  }, ``);

  const message = `${header}\n\n${timelines}`.slice(
    0,
    textBlockLimits.FULL_MESSAGE
  );

  if (new Date() - firstTime >= closeUpdateAfterMinutes * 60 * 1000) {
    await job.remove();
  } else {
    job.repeatEvery("35 seconds");
    await job.save();
  }

  if (pointDB[pointType]) {
    try {
      await telegram.editMessageText(
        CHANNEL,
        pointDB[pointType],
        null,
        message,
        {
          parse_mode: "markdown",
        }
      );
    } catch (e) {
      if (e.code === 400) {
        return done();
      }
    }
  } else {
    const newMessage = await telegram.sendMessage(CHANNEL, message, {
      parse_mode: "markdown",
    });
    pointDB[pointType] = newMessage.message_id;
    await pointDB.save();
  }

  return done();
});

module.exports = agenda;
