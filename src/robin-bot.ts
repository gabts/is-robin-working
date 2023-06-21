import * as Discord from "discord.js";
import * as constants from "./constants";
import Emitter from "./utils/emitter";

import { Context, CommandHandler, ReactionHandler, Feature } from "./types";

export interface Bot {
  registerFeature(feature: Feature): void;
  start(): void | Promise<void>;
}

type Events = {
  reply: [string];
};

export class MockedClient extends Emitter<Events> implements Bot {
  #features: Feature[] = [];

  constructor(private context: Context) {
    super();
  }

  registerFeature = (feature: Feature) => {
    this.#features.push(feature);
  };

  sendMessage = async (message: {
    content: string;
    channelId?: string;
    author?: { id?: string; username?: string };
    member?: { nickname?: string };
  }) => {
    const content = message.content.trim();

    const wrappedMessage = {
      channelId: "channel_id",

      ...message,

      author: {
        id: "author_id",
        username: "username",
        ...(message.author || {}),
      },

      member: { nickname: "nickname", ...(message.member || {}) },

      guild: {
        roles: {
          fetch: () => [],
          create: (role: any) => console.log("Created role", role),
        },
      },

      reply: (str: string) => {
        console.log(" -- Reply --");
        console.log(str);
        console.log("");

        this.emit("reply", str);
      },
    };

    console.log(" -- Sending message --");
    console.log(content);
    console.log("");

    for (const feature of this.#features) {
      for (const { check, handler } of feature.reactions || []) {
        const match = content.match(check);

        if (match) {
          await handler(this.context, wrappedMessage as any, match);
          break;
        }
      }
    }
  };

  start = async () => {
    for (const feature of this.#features) {
      await feature.warmUp?.(this.context);
    }
  };
}

export default class RobinBot implements Bot {
  #client: Discord.Client;
  #commands: { name: string; description: string }[] = [];
  #commandHandlers: Record<string, CommandHandler> = {};
  #reactionHandlers: { check: RegExp; handler: ReactionHandler }[] = [];
  #featureWarmUp: (() => Promise<void>)[] = [];

  constructor(private context: Context) {
    const intents = {
      intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.MessageContent,
      ],
    };

    this.#client = new Discord.Client(intents);

    this.#client.on("interactionCreate", (interaction) => {
      if (interaction.isCommand()) {
        const { commandName } = interaction;
        const handler = this.#commandHandlers[commandName];
        if (handler) handler(this.context, interaction);
      }
    });

    this.#client.on("messageCreate", (message) => {
      if (message.author?.id === constants.APPLICATION_ID) return;
      const content = message.content.trim();
      for (const { check, handler } of this.#reactionHandlers) {
        const match = content.match(check);

        if (match) {
          handler(this.context, message, match);
          break;
        }
      }
    });
  }

  registerFeature = (args: Feature) => {
    const { commands, name, reactions, skip, warmUp } = args;

    if (skip) {
      console.log(`robin bot > skip feature "${name}"`);
      return;
    }

    console.log(`robin bot > register feature "${name}"`);

    if (warmUp) {
      this.#featureWarmUp.push(async () => {
        console.log(`robin bot > warm up feature "${name}"`);
        await warmUp(this.context);
      });
    }

    if (commands) {
      for (const { command, description, handler } of commands) {
        this.#commands.push({ name: command, description });
        this.#commandHandlers[command] = handler;
      }
    }

    if (reactions) {
      for (const { check, handler } of reactions) {
        this.#reactionHandlers.push({ check, handler });
      }
    }
  };

  start = async (): Promise<void> => {
    console.log("robin bot > starting...");

    const token = process.env.TOKEN;
    if (!token) throw new Error("no token found");

    await this.#warmUpFeatures();
    await this.#registerCommands(token);

    this.#client.on("ready", this.#onReady);

    console.log("robin bot > started");

    await this.#client.login(token);
  };

  #warmUpFeatures = async (): Promise<void> => {
    for (const warmUp of this.#featureWarmUp) {
      await warmUp();
    }
  };

  #registerCommands = async (token: string): Promise<void> => {
    const rest = new Discord.REST({ version: "10" }).setToken(token);

    const appId =
      process.env.NODE_ENV === "development"
        ? constants.GABE_DEV_APPLICATION_ID
        : constants.APPLICATION_ID;

    await rest.put(Discord.Routes.applicationCommands(appId), {
      body: this.#commands,
    });
  };

  #onReady = async (): Promise<void> => {
    console.log("robin bot > ready");

    if (process.env.NODE_ENV !== "production") return;

    let channel: Discord.Channel | null | undefined;

    channel = this.#client.channels.cache.get(
      constants.TEAM_HOME_BOT_DEV_CHANNEL_ID
    );

    if (!channel) {
      try {
        channel = await this.#client.channels.fetch(
          constants.TEAM_HOME_BOT_DEV_CHANNEL_ID
        );
      } catch (e) {
        console.warn("failed to find bot dev channel");
      }
    }

    if (channel?.isTextBased()) {
      channel.send("I was restarted");
    }
  };
}
