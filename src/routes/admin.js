const Composer = require("telegraf/composer");
const Markup = require("telegraf/markup");

const { typesQuery } = require("../constants");
const { validateDate, validateTime } = require("../utils");
const { getRaceCaption } = require("../helpers");

const Point = require("../models/Point");
const Race = require("../models/Race");

const adminRoute = new Composer();

adminRoute.hears(/^editDate (.+)/, async (ctx) => {
  const str = ctx.match[1].split("*");
  const index = str[0].trim();
  const startDateStr = str[1].trim().split(".");
  if (validateDate(startDateStr))
    return ctx.replyWithMarkdown(`❗️ Неверный формат даты!`);

  const raceDB = await Race.findOne({ index: index });
  if (!raceDB)
    return ctx.replyWithMarkdown(`❗️ Нет гонки с индексом ${index}!`, {
      reply_to_message_id: ctx.message.message_id,
    });

  const startDate = new Date(
    startDateStr[2],
    startDateStr[1] - 1,
    startDateStr[0],
    raceDB.startDate.getHours(),
    raceDB.startDate.getMinutes()
  );

  raceDB.startDate = startDate;
  await raceDB.save();

  return ctx.replyWithMarkdown(`❗️ Дата для гонки ${raceDB.name} изменена!`, {
    reply_to_message_id: ctx.message.message_id,
  });
});

adminRoute.hears(/^editTime (.+)/, async (ctx) => {
  const str = ctx.match[1].split("*");
  const index = str[0].trim();
  const startTimeStr = str[1].trim().split(":");
  if (validateTime(startTimeStr))
    return ctx.replyWithMarkdown(`❗️ Неверный формат времени!`);

  const raceDB = await Race.findOne({ index: index });
  if (!raceDB)
    return ctx.replyWithMarkdown(`❗️ Нет гонки с индексом ${index}!`, {
      reply_to_message_id: ctx.message.message_id,
    });

  const startDate = new Date(
    raceDB.startDate.getFullYear(),
    raceDB.startDate.getMonth(),
    raceDB.startDate.getDate(),
    startTimeStr[0],
    startTimeStr[1]
  );

  raceDB.startDate = startDate;
  await raceDB.save();

  return ctx.replyWithMarkdown(
    `❗️ Время старта гонки ${raceDB.name} изменено!`,
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

adminRoute.hears(/^editDescription (.+)/s, async (ctx) => {
  const str = ctx.match[1].split("*");
  const index = str[0].trim();
  const description = str[1].trim();

  const raceDB = await Race.findOne({ index: index });

  if (!raceDB)
    return ctx.replyWithMarkdown(`❗️ Нет гонки с индексом ${index}!`, {
      reply_to_message_id: ctx.message.message_id,
    });

  raceDB.description = description;
  await raceDB.save();

  return ctx.replyWithMarkdown(`❗️ Описание гонки ${raceDB.name} изменено!`, {
    reply_to_message_id: ctx.message.message_id,
  });
});

adminRoute.hears(/^addRace (.+)$/s, async (ctx) => {
  const { reply_to_message } = ctx.message;

  if (!reply_to_message) return;
  if (!reply_to_message.photo) return;

  const raceDB = await Race.findOne({}, null, { sort: { created: -1 } });
  const index = raceDB ? raceDB.index + 1 : 1;

  const str = ctx.match[1].split("/\n");
  const name = str[0].trim();

  let startDate = str[1].trim();
  if (!validateDate(startDate))
    return ctx.replyWithMarkdown(`❗️ Неверный формат даты!`);
  startDate = startDate.split(".");

  let startTime = str[2].trim();
  if (!validateTime(startTime))
    return ctx.replyWithMarkdown(`❗️ Неверный формат времени!`);
  startTime = startTime.split(":");

  const startPlace = str[3].trim();
  const finishPlace = str[4].trim();
  const price = str[5].trim();
  if (!+price && +price != 0)
    return ctx.replyWithMarkdown(`❗️ Неверный формат стоимости участия!`);
  const description = str[6].trim();

  const startFullDate = new Date(
    startDate[2],
    startDate[1] - 1,
    startDate[0],
    23,
    59
  );
  const startFullDateWithTime = new Date(
    startDate[2],
    startDate[1] - 1,
    startDate[0],
    startTime[0],
    startTime[1]
  );

  await Race.create({
    index: index,
    created: new Date(),
    name: name,
    startDate: startFullDate,
    startDateWithTime: startFullDateWithTime,
    poster: reply_to_message.photo[0].file_id,
    startPlace: startPlace,
    finishPlace: finishPlace,
    price: price,
    description: description,
  });

  return ctx.replyWithMarkdown(
    `❗️ Создана гонка *${name}* с индексом ${index}!`,
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

adminRoute.hears(/^addPoint (.+)$/s, async (ctx) => {
  const str = ctx.match[1].split("/\n");
  const raceIndex = str[0].trim();
  const photoPlace = str[1].trim();
  const latitude = str[2].trim();
  if (!+latitude) return ctx.replyWithMarkdown(`❗️ Неверный формат latitude`);
  const longitude = str[3].trim();
  if (!+longitude)
    return ctx.replyWithMarkdown(`❗️ Неверный формат longitude`);
  const code = str[4].trim();

  const raceDB = await Race.findOne({ index: raceIndex }, "name", {
    sort: { created: -1 },
  });
  const pointDB = await Point.findOne({ race: raceDB }, null, {
    sort: { index: -1 },
  });
  const index = pointDB ? pointDB.index + 1 : 1;

  await Point.create({
    index: index,
    photoPlace: photoPlace,
    location: {
      latitude: latitude,
      longitude: longitude,
    },
    code: code,
    race: raceDB,
  });

  return ctx.replyWithMarkdown(
    `❗️ Создана локация *${photoPlace}* с индексом ${index} для гонки ${raceDB.name}!`,
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

adminRoute.hears(/^getRaces$/, async (ctx) => {
  const racesDB = await Race.find({}, "index name startDate", {
    sort: { index: 1 },
  });

  if (!racesDB.length) return ctx.replyWithMarkdown("❗️ Гонок нет!");

  const raceList = racesDB.reduce((acc, race) => {
    const startDate = race.startDate.toLocaleDateString("ru-RU", {
      timeZone: "Europe/Moscow",
      month: "long",
      day: "numeric",
    });
    acc = `${acc}*${race.index}.* ${race.name}\n${startDate}\n\n`;
    return acc;
  }, ``);

  const ik = racesDB.map((race) => {
    return Markup.callbackButton(
      race.index,
      JSON.stringify({ type: typesQuery.GET_RACE, i: race.index })
    );
  });

  return ctx.replyWithMarkdown(
    `*Список гонок*\n\n${raceList}`,
    Markup.inlineKeyboard(ik, { columns: 5 }).extra()
  );
});

adminRoute.on("callback_query", async (ctx) => {
  const { type, i } = JSON.parse(ctx.callbackQuery.data);

  switch (type) {
    case typesQuery.GET_RACE:
      const raceDB = await Race.findOne({ index: i });

      if (!raceDB)
        return ctx.replyWithMarkdown(`❗️ Нет гонки с индексом ${i}`);

      const caption = getRaceCaption(raceDB);

      await ctx.replyWithPhoto(raceDB.poster, {
        caption: caption,
        parse_mode: "Markdownv2",
      });

      return ctx.answerCbQuery();

    default:
      return ctx.answerCbQuery();
  }
});

adminRoute.hears(/^getPoints ([0-9]+)/, async (ctx) => {
  const index = ctx.match[1];
  const raceDB = await Race.findOne({ index: index });

  if (!raceDB)
    return ctx.replyWithMarkdown(`❗️ Гонка с индексом ${index} не создана!`);

  const pointsDB = await Point.find({ race: raceDB }, null, {
    sort: { index: 1 },
  });

  if (!pointsDB.length) return ctx.replyWithMarkdown("❗️ Локаций нет!");

  const pointList = pointsDB.reduce((acc, point) => {
    acc = `${acc}*${point.index}.* ${point.photoPlace}\n${point.location.latitude}, ${point.location.longitude}\n${point.code}\n\n`;
    return acc;
  }, `_${raceDB.name}_\n\n`);

  return ctx.replyWithMarkdown(`*Список локаций*\n${pointList}`);
});

adminRoute.hears(/^getRaceTemplate$/, async (ctx) => {
  return ctx.replyWithMarkdown(
    "_reply to photo_ \n\n*addRace* name/\nstartDate/\nstartTime/\nstartPlace/\nfinishPlace/\nprice/\ndescription"
  );
});

adminRoute.hears(/^getPointTemplate$/, async (ctx) => {
  return ctx.replyWithMarkdown(
    "*addPoint* raceIndex/\nphotoPlace/\nlatitude/\nlongitude/\ncode"
  );
});

adminRoute.hears(/^getCommands$/, async (ctx) => {
  return ctx.replyWithMarkdown(
    "*Commands* \n\naddRace\ngetRaceTemplate\ngetRaces\naddRace <teplate>\neditDescription <indexRace>\\*<description>\neditTime <indeRace>\\*<time>\neditDate <indeRace>\\*<date>\ngetPointTemplate\ngetPoints <indexRace>"
  );
});

module.exports = adminRoute;
