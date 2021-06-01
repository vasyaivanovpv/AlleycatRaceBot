const { ADMIN_CHAT } = require("../../config");
const Scene = require("telegraf/scenes/base");
const { validateBrand, capitalizeFirstLetter } = require("../../utils");

const Member = require("../../models/Member");
const Biketype = require("../../models/Biketype");
const User = require("../../models/User");
const Race = require("../../models/Race");

const symbolBrandLimit = 14;

const stepBikeBrand = new Scene("step_bike_brand");

stepBikeBrand.enter(async (ctx) => {
  return ctx.replyWithMarkdown(
    `™️ *Бренд велосипеда* \n\nВведи наименование бренда своего велосипеда (фрейма). \n\nНапример: Чинелли.`
  );
});

stepBikeBrand.start(async (ctx) => {
  await ctx.scene.enter("main_menu");
});

stepBikeBrand.on(
  "text",
  async (ctx, next) => {
    if (ctx.message.text.length > symbolBrandLimit)
      return ctx.replyWithMarkdown(
        `❗️ Хотелось бы покороче, до ${symbolBrandLimit} символов!`
      );

    if (!validateBrand(ctx.message.text))
      return ctx.replyWithMarkdown("❗️ Пожалуйста без лишних символов!");

    ctx.session.registration.bikeBrand = capitalizeFirstLetter(
      ctx.message.text.toLowerCase()
    );

    next();
  },
  async (ctx) => {
    const userDB = await User.findOne({ telegramId: ctx.from.id });
    const raceDB = await Race.findOne(
      { startDate: { $gte: new Date() } },
      null,
      {
        sort: {
          startDate: 1,
        },
      }
    );
    const bikeTypeDB = await Biketype.findById(
      ctx.session.registration.bikeType
    );

    await Member.create({
      joined: new Date(),
      telegramId: ctx.from.id,
      user: userDB,
      race: raceDB,
      name: ctx.session.registration.name,
      bikeType: bikeTypeDB,
      bikeBrand: ctx.session.registration.bikeBrand,
    });

    await ctx.telegram.sendMessage(
      ADMIN_CHAT,
      `❗️ *Уведомление* \n\nНа гонке *${raceDB.name}* новый участник: \n\n[${
        ctx.session.registration.name
      }](tg://user?id=${ctx.from.id}) ${bikeTypeDB.short.toUpperCase()} ${
        ctx.session.registration.bikeBrand
      }`,
      {
        parse_mode: "Markdown",
      }
    );

    await ctx.replyWithMarkdown(
      `✅ *Регистрация*\n\nТы добавлен в список участников с данными: \n\n*${
        ctx.session.registration.name
      }* ${bikeTypeDB.short.toUpperCase()} ${
        ctx.session.registration.bikeBrand
      } \n\nТеперь можешь участвовать в гонке *${raceDB.name}*! \n\nУДАЧИ!`
    );

    delete ctx.session.registration;
    return ctx.scene.enter("main_menu");
  }
);

stepBikeBrand.use(async (ctx) =>
  ctx.replyWithMarkdown(
    `❗️ Введи свое имя или псевдоним в одно слово кириллицей!`
  )
);

module.exports = stepBikeBrand;
