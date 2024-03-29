// ?? I had to include index file, otherwise all exports
// got stuck inside .default obj.
import * as utils from "../../utils/index";
import { Feature } from "../../types";
import * as Discord from "discord.js";
import * as fs from "fs";
import * as path from "path";

const fortunes = fs
  .readFileSync(
    path.resolve(__dirname, "..", "..", "..", "resources", "fortunes.txt")
  )
  .toString("utf-8")
  .split("\n");

export interface State {
  fortunesN: Record<
    string,
    {
      seen: string;
      content: string;
    }
  >;
}

export interface AchievementState {
  fortunesReceived: number;
}

function getDate(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

async function getFortune() {
  const out = await utils.spawn("fortune", []);
  return out.stdout;
}

export const feature: Feature = {
  name: "Fortune",
  // skip: true,
  warmUp: (context) => {
    const defaultState: State = {
      fortunesN: {},
    };

    context.achievements.setAchievements("fortune", {
      initialState: {
        fortunesReceived: 0,
      },

      achievements: [
        {
          constraint: (state) => state.fortunesReceived >= 30,
          progress: (state) => state.fortunesReceived / 30,

          role: {
            name: "Fortune Teller",
            reason: "This user can see the future by now.",
          },
        },
      ],
    });

    return context.store.update((state) => ({
      ...defaultState,
      ...state,
    }));
  },

  reactions: [
    {
      check: /^!fortune$/i,
      handler: async (context, message) => {
        const { id, username } = message.author;
        const { nickname } = message.member || {};

        const displayName = nickname || username;

        const state = context.store.get();

        const userState = state.fortunesN[id] || {
          seen: getDate(new Date("1970-01-02")),
          content: "",
        };

        const hasSeenDaily = userState.seen === getDate(new Date());

        let fortune = hasSeenDaily ? userState.content : null;

        if (!fortune) {
          fortune =
            fortunes[Math.floor(Math.random() * (fortunes.length - 0.0001))] ||
            null;
        }

        if (!fortune) {
          message.reply("Sorry, I am unable to tell your fortune");
          return;
        }

        const nextState = {
          seen: getDate(new Date()),
          content: fortune,
        };

        if (!hasSeenDaily) {
          await context.achievements.append(
            "fortune",
            message,
            (achievement) => {
              achievement.fortunesReceived += 1;
              return achievement;
            }
          );

          await context.store.update((cstate) => ({
            fortunesN: {
              ...cstate.fortunesN,
              [id]: nextState,
            },
          }));
        }

        message.reply(`Daily :fortune_cookie::\n\`\`\`${fortune}\`\`\``);
      },
    },
  ],
};

export default feature;
