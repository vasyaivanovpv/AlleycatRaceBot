const typesQuery = {
  MAIN_MENU: "MN_MN",
  REGISTRATION: "RGSTRTN",
  START_RACE: "STRT_RC",
  BIKE_TYPE: "BK_TP",
  MEMBER_LIST: "MMBR_LST",
  BACK: "BCK",
  GET_RACE: "GT_RC",
};

const mailingDelay = 100;

const textBlockLimits = {
  LINE: 32,
  COUNT_LINE: 100,
  FULL_MESSAGE: 4096,
};

const photoOptions = {
  firstMessageId: {
    name: "firstMessageId",
    value: { $ne: null },
  },
  secondMessageId: {
    name: "secondMessageId",
    value: null,
  },
};

const mainProject = {
  name: "SPBFG",
  link: "spbfg",
};

const sideProjects = [
  {
    name: "Cycling Market",
    description: "велобарахолка России и СНГ",
    link: "cyclingmarket",
  },
  {
    name: "Ливингрум",
    description: "аренда жилья в Санкт-Петурбурге",
    link: "lvngrm",
  },
];

module.exports = {
  typesQuery,
  textBlockLimits,
  mailingDelay,
  mainProject,
  sideProjects,
  photoOptions,
};
