import Store from "./store";
import RobinBot from "./robin-bot";

import { Context } from "./types";
import { Achievements } from "./features/achievements";

import registerFeatures from "./features";

async function main() {
  const store = new Store();
  const context: Context = {
    store,
    achievements: new Achievements(store),
  };

  await context.store.warmup();

  const robinBot = new RobinBot(context);

  registerFeatures(robinBot);

  await robinBot.start();
}

if (require.main)
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
