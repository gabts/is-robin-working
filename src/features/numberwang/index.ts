import type { Client, Message } from "discord.js";
import * as constants from "../../constants";
import { getDisplayName } from "../../utils";

interface Game {
  answer: number;
}

const games = new Map<string, Game>();

const reactions: {
  check: RegExp;
  callback: (event: Message, content: string) => void;
}[] = [
  {
    check: /^!numberwang \d+ \d+$/i,
    callback: (event, content) => {
      const currentGame = games.get(event.channelId);
      if (currentGame) return;

      const [, min, max] = content.split(" ").map(Number);
      if (!min || !max || isNaN(min) || isNaN(max)) return;

      if (min === max) {
        event.reply("don't be a smarty pants...");
        return;
      }

      if (max > Number.MAX_SAFE_INTEGER || min > Number.MAX_SAFE_INTEGER) {
        event.reply("only integers allowed");
        return;
      }

      const mmin = Math.min(min, max);
      const mmax = Math.max(min, max);

      games.set(event.channelId, {
        answer: Math.floor(Math.random() * (mmax - mmin + 1) + mmin),
      });

      event.reply(`which number ${mmin}-${mmax} am I thinking of?`);
    },
  },
  {
    check: /^!numberwang stop$/,
    callback: (event, content) => {
      const currentGame = games.get(event.channelId);
      if (!currentGame) return;
      games.delete(event.channelId);
      event.reply(`ok, numberwang game stopped`);
    },
  },
  {
    check: /^\d+$/i,
    callback: (event, content) => {
      const currentGame = games.get(event.channelId);
      if (!currentGame) return;

      const guess = Number(content);
      if (isNaN(guess)) return;
      const { answer } = currentGame;

      if (guess > answer) {
        event.reply("too high");
      } else if (guess < answer) {
        event.reply("too low");
      } else {
        event.reply(`correct! ${getDisplayName(event)} wins! 🎉🎉🎉`);
        games.delete(event.channelId);
      }
    },
  },
];

function use(client: Client) {
  client.on("messageCreate", (event) => {
    if (event.author.id === constants.APPLICATION_ID) return;

    const content = event.content.trim();

    for (const reaction of reactions) {
      if (reaction.check.test(content)) {
        reaction.callback(event, content);
        return;
      }
    }
  });
}

export default {
  use,
};
