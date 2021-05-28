module.exports = {
  logStart: () => console.log("BOT HAS BEEN STARTED......"),

  debug: (obj = {}) => JSON.stringify(obj, null, 4),

  escapeRegExp: (str = "") =>
    `${str}`.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&"), // $& means the whole matched string
  escapeWithoutBoldItalic: (string = "") =>
    string.replace(/[`>#+-=|{}.!]/g, "\\$&"),
  escapeChar: (string = "") => string.replace(/[_*~()[\]]/g, `\\$&`), // $& means the whole matched string
  checkInteger: (num) =>
    (num ^ 0) === num && num > 0 && num !== Infinity && num !== -Infinity,
  parseFloor: (string) => {
    if (string.split("/").length === 2) {
      return string.split("/").map((str) => Number(str));
    } else {
      return null;
    }
  },
  toHashTag: (str) =>
    str
      .replace(/[-]/g, " ")
      .split(" ")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join(""),
  toNumber: (str) => {
    if (str.split(",").length > 1) {
      return +Number(str.split(",").join(".")).toFixed(1);
    } else {
      return +Number(str).toFixed(1);
    }
  },
  toString: (number) => String(number).split(".").join(","),
  toPlural: (str) => `${str.slice(0, -1).toLowerCase()}ы`,
  getCountDaysFromNow: (date) =>
    +((new Date() - date) / 1000 / 60 / 60 / 24).toFixed(),
  isJSONString: (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  },
  declOfNum: (n, titles) =>
    titles[
      n % 10 == 1 && n % 100 != 11
        ? 0
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 1
        : 2
    ],
  increaseMonth: (now, num) =>
    new Date(
      now.getFullYear(),
      now.getMonth() + num,
      now.getDate(),
      now.getHours(),
      now.getMinutes()
    ),
  toStringDate: (date) =>
    [
      `${date.getDate()}`.padStart(2, "0"),
      `${date.getMonth() + 1}`.padStart(2, "0"),
      date.getFullYear(),
    ].join("."),
  sleep: (ms) => {
    return new Promise((r) => setTimeout(r, ms));
  },
  formatPrice: (price) => `${price}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 "),
  getLocalTime: (d) => {
    const options = {
      timeZone: "Europe/Moscow",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    };
    return d.toLocaleTimeString("ru-RU", options);
  },
  getLocalHour: (d) => {
    const options = {
      timeZone: "Europe/Moscow",
      hour: "numeric",
      hour12: false,
    };
    return +d.toLocaleTimeString("ru-RU", options);
  },
  validateName: (text) => {
    const re = /^[а-яА-Я]+$/;
    return re.test(text);
  },
  validateBrand: (text) => {
    const re = /^[а-яА-Яa-zA-Z ]+$/;
    return re.test(text);
  },
  validateDate: (dateString) => {
    const re = /^(0[1-9]|[12][0-9]|3[01]).(0[1-9]|1[012]).(20)\d\d$/;
    return re.test(dateString);
  },
  validateTime: (time) => {
    const re = /^([01]{1}[0-9]|2[0-3]):[0-5][0-9]$/;
    return re.test(time);
  },
  capitalizeFirstLetter: (string) => string[0].toUpperCase() + string.slice(1),
  getPhotoGroup: (photos, caption) =>
    photos.map((file, i) =>
      i
        ? {
            type: "photo",
            media: file,
          }
        : {
            type: "photo",
            media: file,
            caption: caption,
            parse_mode: "MarkdownV2",
          }
    ),
  formatMilliseconds: (milliseconds, padStart, hasHours) => {
    const pad = (num) => `${num}`.padStart(2, "0");
    let asSeconds = milliseconds / 1000;

    let hours = hasHours ? "00" : null;
    let minutes = Math.floor(asSeconds / 60);
    let seconds = Math.floor(asSeconds % 60);

    if (minutes > 59) {
      hours = Math.floor(minutes / 60);
      minutes %= 60;
    }

    return hours
      ? `${padStart ? pad(hours) : hours}:${pad(minutes)}:${pad(seconds)}`
      : `${padStart ? pad(minutes) : minutes}:${pad(seconds)}`;
  },
};
