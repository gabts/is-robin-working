const { Client, IntentsBitField } = require("discord.js");
const Emitter = require("./emitter");

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

class MockClient extends Emitter {
  login = (_token) => {
    return this.emit("ready");
  };

  sendMessage = (content) => {
    const event = {
      author: { id: "author-id", username: "username" },
      member: { id: "member-id", nickname: "nickname" },

      content,

      reply: (...args) => {
        console.log(" -- Bot reply --");
        console.log(...args);
      },
    };

    return this.emit("messageCreate", event);
  };
}

function prepareMockClient() {
  return new MockClient();
}

module.exports = {
  prepareClient,
  prepareMockClient,
};
