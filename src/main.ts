import IsRobinWorking from "./features/is-robin-working";
import Fortune from "./features/fortune";
import Weather from "./features/weather";
import { prepareClient, prepareMockClient } from "./client";
import Store from "./state";

async function main() {
  if (!process.env.TOKEN) {
    throw new Error("Missing discord bot token");
  }

  const config = {
    discordToken: process.env.TOKEN,
    weatherToken: process.env.WEATHER_TOKEN,
  };

  await Store.warmup();

  const client =
    process.env.NODE_ENV === "mock" ? prepareMockClient() : prepareClient();

  IsRobinWorking.use(client);
  Fortune.use(client);

  if (config.weatherToken) {
    Weather.use(config.weatherToken, client);
  }

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
