const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const Composer = require("telegraf/composer");
const { typesQuery } = require("../../constants");

const Biketype = require("../../models/Biketype");

const stepBikeType = new Scene("step_bike_type");

stepBikeType.enter(async (ctx) => {
  const bikeTypesDB = await Biketype.find();

  const ik = bikeTypesDB.map((bikeType) => {
    return Markup.callbackButton(
      bikeType.full,
      JSON.stringify({ type: typesQuery.BIKE_TYPE, id: bikeType._id })
    );
  });

  return ctx.replyWithMarkdown(
    `🚲 *Тип велосипеда* \n\nВыбери тип велосипеда, на котором будешь участвовать в гонке.`,
    Markup.inlineKeyboard(ik, { columns: 2 }).extra()
  );
});

stepBikeType.start(async (ctx) => {
  await ctx.scene.enter("main_menu");
});

stepBikeType.on("callback_query", async (ctx) => {
  const { type, id } = JSON.parse(ctx.callbackQuery.data);

  switch (type) {
    case typesQuery.BIKE_TYPE:
      await ctx.editMessageReplyMarkup();

      ctx.session.registration.bikeType = id;

      await ctx.answerCbQuery();
      return ctx.scene.enter("step_bike_brand");

    default:
      return ctx.replyWithMarkdown(
        `❗️ Выбери тип велосипеда, на котором будешь участвовать в гонке!`
      );
  }
});

stepBikeType.use(async (ctx) =>
  ctx.replyWithMarkdown(
    `❗️ Выбери тип велосипеда, на котором будешь участвовать в гонке!`
  )
);

module.exports = stepBikeType;
