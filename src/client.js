const { Client, IntentsBitField } = require("discord.js");
const { nextWorkingDate } = require("./next-working-date");
const utils = require("./utils");
const { state, updateStateIsWorking, refreshState } = require("./state");

// Discord bot client
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

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
    const nextDateString = utils.isTomorrow(nextDate)
      ? "tomorrow"
      : `${nextDate.getDate()}/${nextDate.getMonth() + 1}`;

    event.reply(`no, but he'll be back ${nextDateString}!`);
    return;
  }

  if (content === "is robin working tomorrow?") {
    const nextDate = nextWorkingDate(state.isWorking);

    if (utils.isTomorrow(nextDate)) {
      event.reply("yes!");
      return;
    }

    const nextDateString = `${nextDate.getDate()}/${nextDate.getMonth() + 1}`;

    event.reply(`no, but he'll be back ${nextDateString}!`);
    return;
  }

  // TODO: set up proper slash command
  if (content === "/is-robin-working no") {
    if (state.isWorking === false) {
      event.reply("yes I already know he's not working today...");
      return;
    }

    updateStateIsWorking(false);
    event.reply("ok, I hope Robin has a nice day off work!");
    return;
  }

  // TODO: set up proper slash command
  if (content === "/is-robin-working yes") {
    if (state.isWorking === true) {
      event.reply("yes I already know he's working today...");
      return;
    }

    updateStateIsWorking(true);
    event.reply("ok, everyone will be happy Robin is working today!");
    return;
  }
});

client.on("ready", () => {
  refreshState();
  console.log("bot online!");
});

module.exports = {
  client,
};
