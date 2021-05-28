const {
  escapeChar,
  isJSONString,
  escapeWithoutBoldItalic,
} = require("./utils");
const { sideProjects, textBlockLimits } = require("./constants");

const checkJSONmw = async (ctx, next) => {
  if (!isJSONString(ctx.callbackQuery.data)) {
    await ctx.answerCbQuery();
    return ctx.replyWithMarkdown(`❗️ Это действие сейчас не актуально!`);
  } else {
    next();
  }
};

const getSideProjectList = () =>
  sideProjects.reduce((acc, project) => {
    acc = `${acc}\n[${escapeChar(project.name)}](t.me/${escapeChar(
      project.link
    )}) - ${escapeChar(project.description)}.`;
    return acc;
  }, "*Партнерские проекты:*");

const getTimeline = (memberDB, timeStr, index) =>
  `*${index}.* ${timeStr} *${
    memberDB.name
  }* ${memberDB.bikeType.short.toUpperCase()} ${memberDB.bikeBrand}`.slice(
    0,
    textBlockLimits.LINE
  );

const getMemberLine = (memberDB) =>
  `*${memberDB.name}* ${memberDB.bikeType.short.toUpperCase()} ${
    memberDB.bikeBrand
  }`.slice(0, textBlockLimits.LINE);

const getRaceCaption = (raceDB) => {
  const startDate = raceDB.startDate.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    month: "long",
    day: "numeric",
  });
  const startTime = raceDB.startDate.toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const priceStr = raceDB.price ? `${raceDB.price} ₽` : "Бесплатно";

  return escapeWithoutBoldItalic(
    `*${raceDB.name}* \n\n${
      raceDB.description
    } \n\n• ${startDate}\n• ${startTime}, ${
      raceDB.startPlace
    }\n• ${priceStr.toLowerCase()}`
  );
};

module.exports = {
  getTimeline,
  getMemberLine,
  checkJSONmw,
  getSideProjectList,
  getRaceCaption,
};
