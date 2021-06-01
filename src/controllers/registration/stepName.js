const Scene = require("telegraf/scenes/base");
const Composer = require("telegraf/composer");
const { validateName, capitalizeFirstLetter } = require("../../utils");

const symbolNameLimit = 12;

const stepName = new Scene("step_name");

stepName.enter(async (ctx) => {
  ctx.session.registration = {
    name: "",
    bikeType: "",
    bikeBrand: "",
  };

  return ctx.replyWithMarkdown(
    `👤 *Имя* \n\nВведи свое имя или псевдоним в одно слово кириллицей. \n\nНапример: Вася.`
  );
});

stepName.start(async (ctx) => {
  await ctx.scene.enter("main_menu");
});

stepName.on("text", async (ctx) => {
  if (ctx.message.text.length > symbolNameLimit)
    return ctx.replyWithMarkdown(
      `❗️ Хотелось бы покороче, до ${symbolNameLimit} символов!`
    );

  if (!validateName(ctx.message.text))
    return ctx.replyWithMarkdown(
      "❗️ Пожалуйста только имя или псевдоним в одно слово кириллицей!"
    );

  ctx.session.registration.name = capitalizeFirstLetter(
    ctx.message.text.toLowerCase()
  );

  return ctx.scene.enter("step_bike_type");
});

stepName.use(async (ctx) =>
  ctx.replyWithMarkdown(
    `❗️ Введи свое имя или псевдоним в одно слово кириллицей!`
  )
);

module.exports = stepName;
