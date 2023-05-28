import type * as Discord from "discord.js";
import {
  RobinBotClient,
  MockRobinBotClient,
  prepareMockClient,
} from "./client";
import { TEAM_HOME_BOT_DEV_CHANNEL_ID } from "./constants";
import Fortune from "./features/fortune";
import IsRobinWorking from "./features/is-robin-working";
import Numberwang from "./features/numberwang";
import TicTacToe from "./features/tic-tac-toe";
import Weather from "./features/weather";
import Magic8Ball from "./features/magic-8-ball";
import Word from "./features/word";
import { Store } from "./state";

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

async function main() {
  const isMock = process.env.NODE_ENV === "mock";

  if (!isMock && !process.env.TOKEN) {
    throw new Error("Missing discord bot token");
  }

  const config = {
    discordToken: process.env.TOKEN,
    weatherToken: process.env.WEATHER_TOKEN,
  };

  await Store.warmup();

  const client: RobinBotClient | MockRobinBotClient = isMock
    ? prepareMockClient()
    : new RobinBotClient();

  client.on("ready", onReady);

  Fortune.use(client);
  IsRobinWorking.use(client);
  TicTacToe.use(client);
  Numberwang.use(client);
  Magic8Ball.use(client);
  Word.use(client);

  if (config.weatherToken) {
    Weather.use(config.weatherToken, client);
  }

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
