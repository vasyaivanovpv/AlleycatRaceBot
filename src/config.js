const config = {
  TOKEN: process.env.TOKEN_TEST,
  CHANNEL: process.env.CHANNEL_TEST,
  ADMIN_CHAT: process.env.TEST_ADMIN_CHAT,
  DB_URL: "mongodb://localhost:27017/" + process.env.DB_NAME,
  DB_HOST: "localhost:27017",
  DB_NAME: process.env.DB_NAME,
  DB_USER: "",
  DB_PASSWORD: "",
  LOCAL_TIME_FROM_UTC: 0,
};

if (process.env.NODE_ENV === "production") {
  config.TOKEN = process.env.TOKEN;
  config.CHANNEL = process.env.CHANNEL;
  config.ADMIN_CHAT = process.env.ADMIN_CHAT;
  config.DB_URL = process.env.DB_URL;
  config.DB_HOST = process.env.DB_HOST;
  config.DB_USER = process.env.DB_USER;
  config.DB_PASSWORD = process.env.DB_PASSWORD;
  config.LOCAL_TIME_FROM_UTC = 3;
}

module.exports = config;
