const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const { typesQuery, textBlockLimits } = require("../../constants");
const { getSideProjectList, getMemberLine } = require("../../helpers");

const Member = require("../../models/Member");
const Biketype = require("../../models/Biketype");
const Race = require("../../models/Race");

const timeStartLimit = 15 * 60 * 1000;

const raceQueryOptions = {
  sort: {
    startDate: 1,
  },
};

const registrationBtn = Markup.callbackButton(
  "Регистрация на гонку",
  JSON.stringify({ type: typesQuery.REGISTRATION })
);
const startRaceBtn = Markup.callbackButton(
  "Получить задание",
  JSON.stringify({ type: typesQuery.START_RACE })
);
const memberListBtn = Markup.callbackButton(
  "Список участников",
  JSON.stringify({ type: typesQuery.MEMBER_LIST })
);
const backBtn = Markup.callbackButton(
  "Назад",
  JSON.stringify({ type: typesQuery.BACK })
);

const getMember = async (telegramId, now) => {
  const raceDB = await Race.findOne(
    { startDate: { $gte: now } },
    null,
    raceQueryOptions
  );

  if (!raceDB) return { raceDB: null, memberDB: null };

  const memberDB = await Member.findOne({
    telegramId: telegramId,
    race: raceDB,
  }).populate("bikeType");

  return { raceDB, memberDB };
};

const getText = (memberDB, raceDB, isEnding) => {
  const header = `🏠 *Главное меню* \n\n`;
  const sideProjectList = getSideProjectList();
  const spbfg = `[SPB FIXED GEAR](t.me/spbfg)`;
  const memberLine = memberDB && getMemberLine(memberDB);
  const startDate = raceDB.startDateWithTime.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    month: "long",
    day: "numeric",
  });
  const startTime = raceDB.startDateWithTime.toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const startHeader = `гонка: *${raceDB.name}*\nдата: *${startDate}*\nстарт: *${startTime}, ${raceDB.startPlace}*`;

  const body = memberDB
    ? memberDB.finishPlace
      ? `гонка: *${raceDB.name}*\nместо: *${memberDB.finishPlace}*\nвремя: *${memberDB.finishTime}*\nнаграждение: *${raceDB.finishPlace}*\n\n${memberLine}\n${spbfg}\n\nЕееее. Ты финишировал, поздравляю тебя!\n\n`
      : `${startHeader}\n\n${memberLine}\n${spbfg}\n\nС помощью указанного ориентира самостоятельно выбери место старта. Приехав на старт к назначенному времени, жми "Получить задание" и врывайся в гонку!\n\n`
    : isEnding
    ? `${startHeader}\n\n${spbfg}\n\nРегистрация уже закончилась, ждем тебя на следующей гонке!\n\n`
    : `${startHeader}\n\n${spbfg}\n\nПройди регистрацию, чтобы получить доступ к старту!\n\n`;

  return header + body + sideProjectList;
};

const getIK = async (memberDB, countMembersDB, isEnding) => {
  const ik = [];

  if (countMembersDB) ik.push(memberListBtn);
  if (!memberDB && !isEnding) ik.push(registrationBtn);
  if (
    memberDB &&
    (memberDB.currentPointIndex || !isEnding) &&
    !memberDB.finishPlace
  )
    ik.push(startRaceBtn);

  return ik;
};

const checkTimeStart = (raceDB, now) => {
  if (now < raceDB.startDateWithTime)
    return { isStarting: false, isAwaiting: true, isEnding: false };

  if (
    now >= raceDB.startDateWithTime &&
    now - raceDB.startDateWithTime <= timeStartLimit
  )
    return { isStarting: true, isAwaiting: false, isEnding: false };

  if (now > raceDB.startDateWithTime)
    return { isStarting: false, isAwaiting: false, isEnding: true };
};

const mainMenu = new Scene("main_menu");

mainMenu.start(async (ctx) => {
  await ctx.scene.enter("main_menu");
});

mainMenu.enter(async (ctx) => {
  delete ctx.session.registration;

  const now = new Date();
  const { memberDB, raceDB } = await getMember(ctx.from.id, now);

  if (!raceDB)
    return ctx.replyWithMarkdown(
      `❗️ Пока что нет новых гонок! Чтобы обновить инфу, жми /start`
    );

  const countMembersDB = await Member.countDocuments({ race: raceDB });

  const { isEnding } = checkTimeStart(raceDB, now);

  const text = getText(memberDB, raceDB, isEnding);
  const ik = await getIK(memberDB, countMembersDB, isEnding);

  const message = await ctx.replyWithMarkdown(
    text,
    Markup.inlineKeyboard(ik, { columns: 1 }).extra({
      disable_web_page_preview: true,
    })
  );

  ctx.session.mainMenuMessageId = message.message_id;
});

mainMenu.leave(async (ctx) => {
  if (!ctx.session.mainMenuMessageId) return;

  await ctx.telegram.editMessageReplyMarkup(
    ctx.chat.id,
    ctx.session.mainMenuMessageId
  );

  delete ctx.session.mainMenuMessageId;
});

mainMenu.on("callback_query", async (ctx) => {
  const { type } = JSON.parse(ctx.callbackQuery.data);

  let now, raceMember;

  switch (type) {
    case typesQuery.REGISTRATION:
      await ctx.answerCbQuery();
      return ctx.scene.enter("step_name");

    case typesQuery.START_RACE:
      now = new Date();
      raceMember = await getMember(ctx.from.id, now);

      if (!raceMember.raceDB) {
        delete ctx.session.mainMenuMessageId;
        await ctx.replyWithMarkdown(
          `❗️ Пока что нет новых гонок! Чтобы обновить инфу, жми /start`
        );
        return ctx.answerCbQuery();
      }

      const { isStarting, isAwaiting, isEnding } = checkTimeStart(
        raceMember.raceDB,
        now
      );

      if (isAwaiting) return ctx.answerCbQuery("Еще рановато!", true);

      if (isStarting) {
        await ctx.answerCbQuery();
        return ctx.scene.enter(`get_point`);
      }

      if (isEnding && raceMember.memberDB.finishPlace)
        return ctx.answerCbQuery();

      if (isEnding && raceMember.memberDB.currentPointIndex) {
        await ctx.answerCbQuery();
        return ctx.scene.enter(`get_point`);
      }

      await ctx.editMessageReplyMarkup(
        Markup.inlineKeyboard([memberListBtn], { columns: 1 })
      );
      await ctx.replyWithMarkdown(
        `⚠️ Ты опоздал на старт! Но сейчас ты можешь наблюдать за прохождением поинтов в онлайн режиме в канале @spbfg.`
      );
      return ctx.answerCbQuery();

    case typesQuery.MEMBER_LIST:
      await ctx.editMessageReplyMarkup();

      const raceDB = await Race.findOne(
        { startDate: { $gte: new Date() } },
        null,
        raceQueryOptions
      );

      if (!raceDB) {
        delete ctx.session.mainMenuMessageId;
        await ctx.replyWithMarkdown(
          `❗️ Пока что нет новых гонок! Чтобы обновить инфу, жми /start`
        );
        return ctx.answerCbQuery();
      }

      const membersDB = await Member.find({
        race: raceDB,
      }).populate("bikeType");

      const bikeTypeMembers = [];
      const bikeTypesDB = await Biketype.find();

      for (const bikeType of bikeTypesDB) {
        const countMember = await Member.countDocuments({
          bikeType: bikeType._id,
          race: raceDB,
        });

        bikeTypeMembers.push({
          bikeType: bikeType.full,
          memberCount: countMember,
        });
      }

      const bikeTypeMembersList = bikeTypeMembers.reduce(
        (acc, bikeTypeMemberCount) => {
          acc = `${acc}${bikeTypeMemberCount.bikeType}: ${bikeTypeMemberCount.memberCount}\n`;
          return acc;
        },
        ``
      );

      const memberList = membersDB.reduce((acc, member, i) => {
        const memberLine = getMemberLine(member);

        acc = `${acc}${i + 1}. ${memberLine}\n`;
        return acc;
      }, ``);

      const memberListText =
        `*🚴‍♂️ Список участников*\n\nВот с этими ребятами тебе предстоит соревноваться в скорости на улицах Санкт-Петербурга!\n\n${bikeTypeMembersList}\n${memberList}`.slice(
          0,
          textBlockLimits.FULL_MESSAGE
        );

      await ctx.editMessageText(
        memberListText,
        Markup.inlineKeyboard([backBtn], { columns: 1 }).extra({
          parse_mode: "markdown",
        })
      );

      return ctx.answerCbQuery();

    case typesQuery.BACK:
      await ctx.editMessageReplyMarkup();

      now = new Date();
      raceMember = await getMember(ctx.from.id, now);

      if (!raceMember.raceDB) {
        delete ctx.session.mainMenuMessageId;
        await ctx.replyWithMarkdown(
          `❗️ Пока что нет новых гонок! Чтобы обновить инфу, жми /start`
        );
        return ctx.answerCbQuery();
      }

      const countMembersDB = await Member.countDocuments({
        race: raceMember.raceDB,
      });

      const timeStartStatus = checkTimeStart(raceMember.raceDB, now);

      const text = getText(
        raceMember.memberDB,
        raceMember.raceDB,
        timeStartStatus.isEnding
      );
      const ik = await getIK(
        raceMember.memberDB,
        countMembersDB,
        timeStartStatus.isEnding
      );

      await ctx.editMessageText(
        text,
        Markup.inlineKeyboard(ik, { columns: 1 }).extra({
          parse_mode: "markdown",
          disable_web_page_preview: true,
        })
      );

      return ctx.answerCbQuery();

    default:
      return ctx.answerCbQuery();
  }
});

mainMenu.use(async (ctx) => {
  return ctx.replyWithMarkdown("bla bla");
});

module.exports = mainMenu;
