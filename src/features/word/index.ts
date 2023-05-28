import type { Client, Message } from "discord.js";
import * as constants from "../../constants";
import { getDisplayName } from "../../utils";
import { answers } from "./answers";
import { guesses } from "./guesses";
import type { DiscordSlashCommand } from "../../main";

interface Game {
  answer: string;
  guesses: string[];
}

const map = new Map<string, Game>();

const reactions: {
  check: RegExp;
  callback: (match: RegExpMatchArray, event: Message) => Promise<void>;
}[] = [
  {
    check: /^!word$/i,
    callback: async (match, event) => {
      const authorId = event.author.id;

      const game = map.get(authorId);
      if (game) {
        event.reply(`you already have a game`);
        return;
      }

      const index = Math.floor(Math.random() * answers.length);
      const answer = answers[index];

      if (!answer) return;

      map.set(authorId, {
        answer,
        guesses: [],
      });

      event.reply(`you have a new word game, guess a five letter word`);
    },
  },
  {
    check: /^!word \w{5}$/i,
    callback: async (match, event) => {
      const authorId = event.author.id;

      const game = map.get(authorId);
      if (!game) return;

      const guess = match[0].substring(6).toUpperCase();

      if (!guesses.includes(guess)) {
        event.reply("Not a valid word");
        return;
      }

      const { answer } = game;

      let result = "";

      for (let i = 0; i < 5; i++) {
        const a = answer[i]!;
        const b = guess[i]!;

        if (a === b) {
          result += `\u001b[0;32m${b}\u001b[0;0m`;
        } else if (answer.includes(b)) {
          result += `\u001b[0;33m${b}\u001b[0;0m`;
        } else {
          result += `\u001b[0;31m${b}\u001b[0;0m`;
        }
      }

      game.guesses.push(result);

      let response = "";

      if (guess === answer) {
        response += `${getDisplayName(event)} finished game in ${
          game.guesses.length
        } moves! 🎉🎉🎉`;
      } else if (game.guesses.length === 6) {
        response += `Game over. The word was "${answer}".`;
      }

      response += "```ansi\n";
      response += game.guesses.join("\n");
      response += "\n```";

      if (game.guesses.length === 6) {
        map.delete(authorId);
      }

      event.reply(response);
    },
  },
];

async function processMessage(event: Message) {
  if (!event.author) return;
  if (event.author.id === constants.APPLICATION_ID) return;

  const content = event.content.trim();

  try {
    for (const reaction of reactions) {
      const match = content.match(reaction.check);

      if (match) {
        await reaction.callback(match, event);
        return;
      }
    }
  } catch (err) {
    console.error("Failed to process fortune:", err);
  }
}

function use(client: Client, commands: DiscordSlashCommand[]) {
  client.on("messageCreate", processMessage);
}

export default {
  use,
};
