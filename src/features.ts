import { Bot } from "./robin-bot";

import AchievementsFeature from "./features/achievements";
import Birthday from "./features/birthday";
import Fortune from "./features/fortune";
import IsRobinWorking from "./features/is-robin-working";
import Magic8Ball from "./features/magic-8-ball";
import Numberwang from "./features/numberwang";
import TicTacToe from "./features/tic-tac-toe";
import Weather from "./features/weather";
import Word from "./features/word";
import Quote from "./features/quote";

export default function registerFeatures(bot: Bot) {
  bot.registerFeature(AchievementsFeature);
  bot.registerFeature(Birthday);
  bot.registerFeature(Fortune);
  bot.registerFeature(IsRobinWorking);
  bot.registerFeature(Magic8Ball);
  bot.registerFeature(Numberwang);
  bot.registerFeature(TicTacToe);
  bot.registerFeature(Weather);
  bot.registerFeature(Word);
  bot.registerFeature(Quote);
}
