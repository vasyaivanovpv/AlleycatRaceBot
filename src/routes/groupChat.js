const { ADMIN_CHAT } = require("../config");
const Composer = require("telegraf/composer");

const adminRoute = require("./admin");

const groupChatRoute = new Composer();
groupChatRoute.use(
  Composer.lazy((ctx) => {
    switch (ctx.chat.id) {
      case +ADMIN_CHAT:
        return adminRoute;
    }
  })
);

module.exports = groupChatRoute;
