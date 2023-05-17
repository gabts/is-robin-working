const { prepareClient } = require("./src/client");

const IsRobinWorking = require("./src/features/is-robin-working");
const Fortune = require("./src/features/fortune");
const Store = require("./src/state");

async function main() {
  await Store.warmup();
  const client = prepareClient();

  IsRobinWorking.use(client);
  Fortune.use(client);

  await client.login(process.env.TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
