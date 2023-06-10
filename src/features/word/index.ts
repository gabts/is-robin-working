import { getDisplayName } from "../../utils";
import { answers } from "./answers";
import { guesses } from "./guesses";
import { robinBot } from "../../robin-bot";

interface Game {
  answer: string;
  guesses: string[];
}

const map = new Map<string, Game>();

robinBot.registerFeature({
  name: "Word",
  reactions: [
    {
      check: /^!word$/i,
      handler: async (message) => {
        const authorId = message.author.id;

        const game = map.get(authorId);
        if (game) {
          message.reply(`you already have a game`);
          return;
        }

        const index = Math.floor(Math.random() * answers.length);
        const answer = answers[index];

        if (!answer) return;

        map.set(authorId, {
          answer,
          guesses: [],
        });

        message.reply(`you have a new word game, guess a five letter word`);
      },
    },
    {
      check: /^!word \w{5}$/i,
      handler: async (message, match) => {
        const authorId = message.author.id;

        const game = map.get(authorId);
        if (!game) return;

        const guess = match[0].substring(6).toUpperCase();

        if (!guesses.includes(guess)) {
          message.reply("Not a valid word");
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
          response += `${getDisplayName(message)} finished game in ${
            game.guesses.length
          } moves! 🎉🎉🎉`;
        } else if (game.guesses.length === 6) {
          response += `Game over. The word was "${answer}".`;
        }

        response += "```ansi\n";
        response += game.guesses.join("\n");
        response += "\n```";

        if (guess === answer || game.guesses.length === 6) {
          map.delete(authorId);
        }

        message.reply(response);
      },
    },
  ],
});
