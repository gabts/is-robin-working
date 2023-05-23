import { Client as DiscordClient, IntentsBitField } from "discord.js";
import { Emitter } from "./emitter";

export type Client = DiscordClient & {
  sendMessage?: (content: string) => Promise<void>;
};

export function prepareClient(): Client {
  const client = new DiscordClient({
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

export function prepareMockClient(): Client {
  return new (class MockClient extends Emitter {
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
  })() as any;
}
