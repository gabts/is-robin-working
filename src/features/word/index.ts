import { getDisplayName } from "../../utils";
import { answers } from "./answers";
import { guesses } from "./guesses";
import { Feature } from "../../types";

interface Game {
  answer: string;
  guesses: string[];
}

export interface AchievementState {
  gamesSucceededTotal: number;

  gamesSucceeded1: number;
  gamesSucceeded2: number;
  gamesSucceeded3: number;
  gamesSucceeded4: number;
  gamesSucceeded5: number;
  gamesSucceeded6: number;

  gamesFailed: number;
}

const map = new Map<string, Game>();

const feature: Feature = {
  name: "Word",

  warmUp: (context) => {
    context.achievements.set("word", {
      initialState: {
        gamesSucceededTotal: 0,

        gamesSucceeded1: 0,
        gamesSucceeded2: 0,
        gamesSucceeded3: 0,
        gamesSucceeded4: 0,
        gamesSucceeded5: 0,
        gamesSucceeded6: 0,

        gamesFailed: 0,
      },

      achievements: [],
    });
  },

  reactions: [
    {
      check: /^!word$/i,
      handler: async (_context, message) => {
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
      handler: async (context, message, match) => {
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
          context.achievements.append("word", message, (state) => {
            state.gamesSucceededTotal += 1;

            // hahahahah I KNOW I KNOW, TYPING OK
            switch (game.guesses.length) {
              case 1:
                state.gamesSucceeded1 += 1;
                break;

              case 2:
                state.gamesSucceeded2 += 1;
                break;

              case 3:
                state.gamesSucceeded3 += 1;
                break;

              case 4:
                state.gamesSucceeded4 += 1;
                break;

              case 5:
                state.gamesSucceeded5 += 1;
                break;

              case 6:
                state.gamesSucceeded6 += 1;
                break;
            }

            return state;
          });

          response += `${getDisplayName(message)} finished game in ${
            game.guesses.length
          } moves! 🎉🎉🎉`;
        } else if (game.guesses.length === 6) {
          context.achievements.append("word", message, (state) => {
            state.gamesFailed += 1;
            return state;
          });

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
};

export default feature;
