import { Store } from "./store";
import { robinBot } from "./robin-bot";

import "./features/fortune";
import "./features/is-robin-working";
import "./features/magic-8-ball";
import "./features/numberwang";
import "./features/tic-tac-toe";
import "./features/weather";
import "./features/word";

Store.warmup().then(() => {
  robinBot.start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
});
