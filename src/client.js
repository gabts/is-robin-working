const { Client, IntentsBitField } = require("discord.js");

function prepareClient() {
  // Discord bot client
  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ],
  });

  client.on("ready", () => {
    console.log("bot online!");
  });

  return client;
}

module.exports = {
  prepareClient,
};
