const Composer = require("telegraf/composer");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const { getRaceCaption } = require("../helpers");

const User = require("../models/User");
const Race = require("../models/Race");

const mainMenu = require("../controllers/mainMenu");
const registration = require("../controllers/registration");
const getPoint = require("../controllers/getPoint");

const stage = new Stage([
  mainMenu,
  registration.stepName,
  registration.stepBikeType,
  registration.stepBikeBrand,
  getPoint,
]);

const privateRoute = new Composer();

privateRoute.use(session());
privateRoute.use(stage.middleware());

privateRoute.start(async (ctx) => {
  const userDB = await User.findOne({ telegramId: ctx.from.id });

  if (!userDB) {
    await User.create({
      joined: new Date(),
      telegramId: ctx.from.id,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      isBanned: false,
      blocked: false,
    });
  }

  const raceDB = await Race.findOne({ startDate: { $gte: new Date() } }, null, {
    sort: {
      startDate: 1,
    },
  });

  if (!raceDB)
    return ctx.replyWithMarkdown(
      `❗️ Пока что нет новых гонок! Чтобы обновить инфу, жми /start`
    );

  const caption = getRaceCaption(raceDB);

  await ctx.replyWithPhoto(raceDB.poster, {
    caption: caption,
    parse_mode: "Markdownv2",
  });

  return ctx.scene.enter("main_menu");
});

privateRoute.use(async (ctx) => {
  await ctx.replyWithMarkdown(
    `❗️ Бот получил некоторые обновления. \nИспользуйте команду /start, чтобы возобновить работу.`
  );
});

module.exports = privateRoute;
