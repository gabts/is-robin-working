import { Client, IntentsBitField } from "discord.js";
import { Emitter } from "./emitter";

function prepareClient() {
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
  login = (_token: string): Promise<void> => {
    return this.emit("ready");
  };

  sendMessage = (content: string): Promise<void> => {
    const event = {
      author: { id: "author-id", username: "username" },
      member: { id: "member-id", nickname: "nickname" },
      content,
      reply: (...args: unknown[]) => {
        console.log(" -- Bot reply --");
        console.log(...args);
      },
    };

    return this.emit("messageCreate", event);
  };
}

function prepareMockClient(): Client {
  return new MockClient() as any;
}

export { prepareClient, prepareMockClient };
