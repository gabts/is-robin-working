import * as Discord from "discord.js";
import * as constants from "./constants";

type CommandHandler = (
  command: Discord.CommandInteraction<Discord.CacheType>
) => void | Promise<void>;

type ReactionHandler = (
  message: Discord.Message,
  match: RegExpMatchArray
) => void | Promise<void>;

export const robinBot = new (class RobinBot {
  #client: Discord.Client;
  #commands: { name: string; description: string }[] = [];
  #commandHandlers: Record<string, CommandHandler> = {};
  #reactionHandlers: { check: RegExp; handler: ReactionHandler }[] = [];
  #featureWarmUp: (() => Promise<void>)[] = [];

  constructor() {
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
        if (handler) handler(interaction);
      }
    });

    this.#client.on("messageCreate", (message) => {
      if (message.author?.id === constants.APPLICATION_ID) return;
      const content = message.content.trim();
      for (const { check, handler } of this.#reactionHandlers) {
        const match = content.match(check);
        if (match) handler(message, match);
      }
    });
  }

  registerFeature = (args: {
    name: string;
    skip?: boolean;
    warmUp?: () => void | Promise<void>;
    commands?: {
      command: string;
      description: string;
      handler: CommandHandler;
    }[];
    reactions?: {
      check: RegExp;
      handler: ReactionHandler;
    }[];
  }) => {
    const { commands, name, reactions, skip, warmUp } = args;

    if (skip) {
      console.log(`robin bot > skip feature "${name}"`);
      return;
    }

    console.log(`robin bot > register feature "${name}"`);

    if (warmUp) {
      this.#featureWarmUp.push(async () => {
        console.log(`robin bot > warm up feature "${name}"`);
        await warmUp();
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
    const token = process.env.TOKEN;
    if (!token) throw new Error("no token found");

    await this.#warmUpFeatures();
    await this.#registerCommands(token);

    this.#client.on("ready", this.#onReady);

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
    console.log("client ready!");

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
})();
