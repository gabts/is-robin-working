import * as constants from "../../constants";
import { getDisplayName } from "../../utils";
import { robinBot } from "../../robin-bot";

interface Game {
  answer: number;
}

const games = new Map<string, Game>();

robinBot.registerFeature({
  name: "Numberwang",
  reactions: [
    {
      check: /^!numberwang \d+ \d+$/i,
      handler: async (message, match) => {
        if (
          message.channelId !== constants.TEAM_HOME_NUMBERWANG_CHANNEL_ID &&
          message.channelId !== constants.GABRIEL_DEV_CHANNEL_ID &&
          message.channelId !== constants.TEAM_HOME_BOT_DEV_CHANNEL_ID
        ) {
          message.reply(
            "for everyones sanity numberwang is only allowed in the numberwang channel!"
          );
          return;
        }

        const currentGame = games.get(message.channelId);
        if (currentGame) return;

        const [, min, max] = match[0].split(" ").map(Number);
        if (!min || !max || isNaN(min) || isNaN(max)) return;

        if (min === max) {
          message.reply("don't be a smarty pants...");
          return;
        }

        if (max > Number.MAX_SAFE_INTEGER || min > Number.MAX_SAFE_INTEGER) {
          message.reply("only integers allowed");
          return;
        }

        const mmin = Math.min(min, max);
        const mmax = Math.max(min, max);

        games.set(message.channelId, {
          answer: Math.floor(Math.random() * (mmax - mmin + 1) + mmin),
        });

        message.reply(`which number ${mmin}-${mmax} am I thinking of?`);
      },
    },

    {
      check: /^!numberwang stop$/,
      handler: (message) => {
        const currentGame = games.get(message.channelId);
        if (!currentGame) return;
        games.delete(message.channelId);
        message.reply(`ok, numberwang game stopped`);
      },
    },

    {
      check: /^\d+$/i,
      handler: (message, match) => {
        const currentGame = games.get(message.channelId);
        if (!currentGame) return;

        const guess = Number(match);
        if (isNaN(guess)) return;
        const { answer } = currentGame;

        if (guess > answer) {
          message.reply("too high");
        } else if (guess < answer) {
          message.reply("too low");
        } else {
          message.reply(
            `that's numberwang! ${getDisplayName(message)} wins! 🎉🎉🎉`
          );
          games.delete(message.channelId);
        }
      },
    },
  ],
});
