const { ADMIN_CHAT } = require("../../config");
const Scene = require("telegraf/scenes/base");
const Composer = require("telegraf/composer");
const mediaGroup = require("telegraf-media-group");
const agenda = require("../../agenda");

const { formatMilliseconds } = require("../../utils");
const { photoOptions } = require("../../constants");

const Member = require("../../models/Member");
const Point = require("../../models/Point");
const Timestamp = require("../../models/Timestamp");

const getPhotoPlaceText = (index, photoPlace) =>
  `📸 *Локация ${index}*\n_сделать фото_\n\n\`${photoPlace}\`\n\nСкинь сюда *одну эту фотографию* и получи следующее задание!`;

const getCode = (index, location) =>
  `🔑 *Локация ${index}*\n_найти кодовое слово_\n\n\`11111\`\n\nВведи этот код и получи следующую локацию!`;

// const getPhotoPlaceText = (index, photoPlace) =>
//   `📸 *Локация ${index}*\n_сделать фото_\n\n\`${photoPlace}\`\n\nЕзжай к вокзалу и сделай фотографию своего велика на фоне здания вокзала, так чтобы *велосипед полностью помещался в кадр, и наименование вокзала (а это два слова) тоже полностью вмещалось в кадр*.\n\nСкинь сюда *одну эту фотографию* и получи следующее задание!`;

// const getCode = (index, location) =>
//   `🔑 *Локация ${index}*\n_найти кодовое слово_\n\n\`${location.latitude}, ${location.longitude}\`\n\nЕзжай по координатам, и ищи в этой локации на стене или на заборе кодовое слово, написанное *красной краской*.\n\nВведи этот код и получи следующую локацию!`;

const getTimestampCaption = (memberDB, pointDB, timeStr) =>
  `#id${memberDB.telegramId}\n*Локация ${pointDB.index}*\n_${
    pointDB.photoPlace
  }_\n\n${timeStr}\n[${memberDB.name}](tg://user?id=${
    memberDB.telegramId
  }) ${memberDB.bikeType.short.toUpperCase()} ${memberDB.bikeBrand}`;

const getPoint = new Scene("get_point");

getPoint.start(async (ctx) => {
  await ctx.scene.enter("main_menu");
});

getPoint.enter(
  // Composer.fork(
  async (ctx) => {
    const memberDB = await Member.findOne({ telegramId: ctx.from.id }, null, {
      sort: { joined: -1 },
    });
    const pointDB = await Point.findOne({
      index: memberDB.currentPointIndex || 1,
      race: memberDB.race._id,
    });

    if (!memberDB.currentPointIndex) {
      memberDB.currentPointIndex = 1;
      await memberDB.save();

      const text = getPhotoPlaceText(pointDB.index, pointDB.photoPlace);
      return ctx.replyWithMarkdown(text);
    }

    const timestampDB = await Timestamp.findOne({
      member: memberDB,
      point: pointDB,
    });

    const text = timestampDB
      ? getCode(pointDB.index, pointDB.location)
      : getPhotoPlaceText(pointDB.index, pointDB.photoPlace);

    // timestampDB &&
    //   (await ctx.replyWithLocation(
    //     pointDB.location.latitude,
    //     pointDB.location.longitude
    //   ));

    return ctx.replyWithMarkdown(text);
  }
  // ),
  // () => Promise.resolve()
);

getPoint.use(mediaGroup());

getPoint.on("media_group", async (ctx) => {
  const memberDB = await Member.findOne({ telegramId: ctx.from.id }, null, {
    sort: { joined: -1 },
  })
    .populate("bikeType")
    .populate("race", "startDateWithTime");
  const pointDB = await Point.findOne({
    index: memberDB.currentPointIndex,
    race: memberDB.race._id,
  });
  const timestampDB = await Timestamp.findOne({
    member: memberDB,
    point: pointDB,
  });

  if (timestampDB) return;

  return ctx.replyWithMarkdown(
    `❗️ Мне нужно только одно фото! Попробуй еще раз!`
  );
});

getPoint.on(
  "photo",
  // Composer.fork(
  async (ctx) => {
    const now = new Date();
    const memberDB = await Member.findOne({ telegramId: ctx.from.id }, null, {
      sort: { joined: -1 },
    })
      .populate("bikeType")
      .populate("race", "startDateWithTime");
    const pointDB = await Point.findOne({
      index: memberDB.currentPointIndex,
      race: memberDB.race._id,
    });
    const timestampDB = await Timestamp.findOne({
      member: memberDB,
      point: pointDB,
    });

    if (timestampDB) return;

    await Timestamp.create({
      date: now,
      member: memberDB,
      point: pointDB,
      photo: ctx.message.photo[0].file_id,
    });

    const text = getCode(pointDB.index, pointDB.location);

    // await ctx.replyWithLocation(
    //   pointDB.location.latitude,
    //   pointDB.location.longitude
    // );
    await ctx.replyWithMarkdown(text);

    const timeStr = formatMilliseconds(
      now - memberDB.race.startDateWithTime,
      true,
      true
    );

    const caption = getTimestampCaption(memberDB, pointDB, timeStr);

    await ctx.telegram.sendPhoto(ADMIN_CHAT, ctx.message.photo[0].file_id, {
      caption: caption,
      parse_mode: "markdown",
    });

    if (!pointDB.firstMessageId) {
      await agenda.now("update_message", {
        pointID: pointDB._id,
        pointType: photoOptions.firstMessageId.name,
      });
    }
  }
  // ),
  // () => Promise.resolve()
);

getPoint.on(
  "text",
  // Composer.fork(
  async (ctx) => {
    const now = new Date();
    const memberDB = await Member.findOne({ telegramId: ctx.from.id }, null, {
      sort: { joined: -1 },
    })
      .populate("bikeType")
      .populate("race", "startDateWithTime");
    const pointDB = await Point.findOne({
      index: memberDB.currentPointIndex,
      race: memberDB.race._id,
    });

    const timestampDB = await Timestamp.findOne({
      member: memberDB,
      point: pointDB,
    });

    if (!timestampDB) return;

    if (ctx.message.text.toLowerCase() !== pointDB.code)
      return ctx.replyWithMarkdown(`❗️ Это неверный код! Попробуй еще!`);

    await Timestamp.create({
      date: now,
      member: memberDB,
      point: pointDB,
    });

    const countPoints = await Point.countDocuments({ race: memberDB.race._id });

    if (countPoints !== memberDB.currentPointIndex) {
      memberDB.currentPointIndex = memberDB.currentPointIndex + 1;
      await memberDB.save();

      const nextPointDB = await Point.findOne({
        index: memberDB.currentPointIndex,
        race: memberDB.race._id,
      });

      const text = getPhotoPlaceText(nextPointDB.index, nextPointDB.photoPlace);
      await ctx.replyWithMarkdown(text);
    }

    const timeStr = formatMilliseconds(
      now - memberDB.race.startDateWithTime,
      true,
      true
    );

    if (!pointDB.secondMessageId) {
      await agenda.now("update_message", {
        pointID: pointDB._id,
        pointType: photoOptions.secondMessageId.name,
      });
    }

    if (countPoints === pointDB.index) {
      memberDB.finishPlace = await Timestamp.countDocuments({
        point: pointDB,
        photo: null,
      });
      memberDB.finishTime = timeStr;
      await memberDB.save();

      return ctx.scene.enter("main_menu");
    }
  }
  // ),
  // () => Promise.resolve()
);

getPoint.use(async (ctx) => {
  return;
});

module.exports = getPoint;