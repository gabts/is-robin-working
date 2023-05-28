import * as Discord from "discord.js";
import { Emitter } from "./utils";

const intents = {
  intents: [
    Discord.IntentsBitField.Flags.Guilds,
    Discord.IntentsBitField.Flags.GuildMembers,
    Discord.IntentsBitField.Flags.GuildMessages,
    Discord.IntentsBitField.Flags.MessageContent,
  ],
};

export class RobinBotClient extends Discord.Client {
  constructor() {
    super(intents);
  }
}

export interface MockRobinBotClient extends RobinBotClient {
  sendMessage: (msg: string) => Promise<void>;
}

export function prepareMockClient(): MockRobinBotClient {
  return new (class MockRobinBotClient extends Emitter {
    login = (_token: string): Promise<void> => {
      const client = {
        channels: {
          cache: {
            get: () => undefined,
            fetch: () => null,
          },
        },
      };

      return this.emit("ready", client);
    };

    sendMessage = (content: string): Promise<void> => {
      const event = {
        author: { id: "author-id", username: "username" },
        member: { id: "member-id", nickname: "nickname" },
        channelId: "xxx",
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
