import { prepareClient, prepareMockClient } from "./client";
import Fortune from "./features/fortune";
import IsRobinWorking from "./features/is-robin-working";
import Numberwang from "./features/numberwang";
import TicTacToe from "./features/tic-tac-toe";
import Weather from "./features/weather";
import Magic8Ball from "./features/magic-8-ball";
import Word from "./features/word";

import { Store } from "./state";

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

  const client = isMock ? prepareMockClient() : prepareClient();

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
