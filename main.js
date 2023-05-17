const { prepareClient, prepareMockClient } = require("./src/client");

const IsRobinWorking = require("./src/features/is-robin-working");
const Fortune = require("./src/features/fortune");
const Weather = require("./src/features/weather");
const Store = require("./src/state");

async function main() {
  const config = {
    discordToken: process.env.TOKEN,
    weatherToken: process.env.WEATHER_TOKEN,
  };

  await Store.warmup();
  const client = prepareClient();

  IsRobinWorking.use(client);
  Fortune.use(client);
  Weather.use(config, client);

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
