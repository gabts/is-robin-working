const fs = require("fs");
const { Client, IntentsBitField } = require("discord.js");
const { nextWorkingDate } = require("./next-working-date");

// Discord bot client
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const state = {
  isWorking: false,
  lastUpdateMs: new Date().getTime(),
};

function writeStateCache() {
  fs.writeFile("./cache.json", JSON.stringify(state), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

// read cached state to preserve state between restarts
fs.readFile("./cache.json", (err, data) => {
  if (err) {
    // first time setup, cache doesn't exist yet
    writeStateCache();
    return;
  }

  const cachedState = JSON.parse(data);
  console.log("found cached state", cachedState);
  state.isWorking = cachedState.isWorking;
  state.lastUpdateMs = cachedState.lastUpdateMs;
});

function setIsRobinWorkingToday(bool) {
  state.isWorking = bool;
  writeStateCache();
}

// checks if date has changed and toggles working state
function update() {
  console.log("running update!");

  const lastUpdateDate = new Date(state.lastUpdateMs).getDate();
  const today = new Date();
  const date = today.getDate();

  if (date === lastUpdateDate) return;

  state.lastUpdateMs = today.getTime();
  const day = today.getDay();
  const isWeekend = day == 6 || day == 0;

  if (isWeekend) return;

  setIsRobinWorkingToday(!isWorking);
}

// interval to automatically toggle if robin is working next work day
setInterval(update, 1000 * 60 * 60);

/**
 * Whether two date objects refer to same date (year, month, day).
 * @param {Date} dateA
 * @param {Date} dateB
 * @returns
 */
function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * @param {Date} date
 * @returns {boolean}
 */
function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDate(date, tomorrow);
}

// message content to listen to
const names = ["robin", "<:pizzarobin:1024343299487698974>"];
const matches = names.map((name) => `is ${name} working?`);

client.on("messageCreate", (event) => {
  const content = event.content.toLowerCase();

  if (matches.includes(content)) {
    if (state.isWorking) {
      event.reply("yes!");
      return;
    }

    const nextDate = nextWorkingDate(state.isWorking);
    const nextDateString = isTomorrow(nextDate)
      ? "tomorrow"
      : `${nextDate.getDate()}/${nextDate.getMonth() + 1}`;

    event.reply(`no, but he'll be back ${nextDateString}!`);
    return;
  }

  if (content === "is robin working tomorrow?") {
    const nextDate = nextWorkingDate(state.isWorking);

    if (isTomorrow(nextDate)) {
      event.reply("yes!");
      return;
    }

    const nextDateString = `${nextDate.getDate()}/${nextDate.getMonth() + 1}`;

    event.reply(`no, but he'll be back ${nextDateString}!`);
    return;
  }

  // TODO: set up proper slash command
  if (content === "/is-robin-working no") {
    setIsRobinWorkingToday(false);
    event.reply("ok, robin is not working today");
    return;
  }

  // TODO: set up proper slash command
  if (content === "/is-robin-working yes") {
    setIsRobinWorkingToday(true);
    event.reply("ok, robin is working today");
    return;
  }
});

client.on("ready", () => {
  update();
  console.log("bot online!");
});

client.login(process.env.TOKEN);
