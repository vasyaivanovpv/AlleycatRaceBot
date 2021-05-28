require("dotenv").config();

const { TOKEN, DB_USER, DB_PASSWORD, DB_URL } = require("./config");
const Telegraf = require("telegraf");
const Composer = require("telegraf/composer");
const mongoose = require("mongoose");
const agenda = require("./agenda");

const privateRoute = require("./routes/private");
const groupChatRoute = require("./routes/groupChat");

try {
  mongoose.connect(`${DB_URL}`, {
    user: DB_USER,
    pass: DB_PASSWORD,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", async () => {
    console.info("Dababase - connected!");

    const bot = new Telegraf(TOKEN);

    await agenda.start();

    bot.use(
      Composer.fork(Composer.privateChat(privateRoute)),
      () => Promise.resolve(),
      Composer.groupChat(groupChatRoute)
    );

    bot.catch(console.log);

    bot.startPolling();
  });
} catch (e) {
  console.error(e);
}
