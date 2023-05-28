import * as Discord from "discord.js";
import {
  RobinBotClient,
  MockRobinBotClient,
  prepareMockClient,
} from "./client";
import {
  GABE_DEV_APPLICATION_ID,
  TEAM_HOME_BOT_DEV_CHANNEL_ID,
} from "./constants";
import Fortune from "./features/fortune";
import IsRobinWorking from "./features/is-robin-working";
import Numberwang from "./features/numberwang";
import TicTacToe from "./features/tic-tac-toe";
import Weather from "./features/weather";
import Magic8Ball from "./features/magic-8-ball";
import Word from "./features/word";
import { Store } from "./state";
import { APPLICATION_ID } from "./constants";

export interface DiscordSlashCommand {
  name: string;
  description: string;
}

async function onReady(client: Discord.Client) {
  console.log("client ready!");

  if (process.env.NODE_ENV !== "production") return;

  let channel: Discord.Channel | null | undefined;

  channel = client.channels.cache.get(TEAM_HOME_BOT_DEV_CHANNEL_ID);

  if (!channel) {
    try {
      channel = await client.channels.fetch(TEAM_HOME_BOT_DEV_CHANNEL_ID);
    } catch (e) {
      console.warn("failed to find bot dev channel");
    }
  }

  if (channel?.isTextBased()) {
    channel.send("I was restarted");
  }
}

function registerCommands(token: string, commands: DiscordSlashCommand[]) {
  const rest = new Discord.REST({ version: "10" }).setToken(token);

  const appId =
    process.env.NODE_ENV === "development"
      ? GABE_DEV_APPLICATION_ID
      : APPLICATION_ID;

  rest.put(Discord.Routes.applicationCommands(appId), {
    body: commands,
  });
}

async function main() {
  const isMock = process.env.NODE_ENV === "mock";

  const config = {
    discordToken: process.env.TOKEN,
    weatherToken: process.env.WEATHER_TOKEN,
  };

  if (!isMock && !config.discordToken) {
    throw new Error("Missing discord bot token");
  }

  await Store.warmup();

  const client: RobinBotClient | MockRobinBotClient = isMock
    ? prepareMockClient()
    : new RobinBotClient();

  client.on("ready", onReady);

  const commands: DiscordSlashCommand[] = [];

  Fortune.use(client, commands);
  IsRobinWorking.use(client, commands);
  TicTacToe.use(client, commands);
  Numberwang.use(client, commands);
  Magic8Ball.use(client, commands);
  Word.use(client, commands);

  if (config.weatherToken) {
    Weather.use(config.weatherToken, client, commands);
  }

  if (config.discordToken) {
    registerCommands(config.discordToken, commands);
  }

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
