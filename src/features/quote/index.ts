// ?? I had to include index file, otherwise all exports
// got stuck inside .default obj.
import * as utils from "../../utils/index";
import { Feature } from "../../types";
import * as Discord from "discord.js";

export interface State {
  quotes: Record<
    string,
    {
      seen: string;
      content: string;
    }
  >;
}

export interface AchievementState {
  quotesReceived: number;
}

function getDate(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

async function getFortune() {
  const out = await utils.spawn("fortune", []);
  return out.stdout;
}

export const feature: Feature = {
  name: "Quotes",
  // skip: true,
  warmUp: (context) => {
    const defaultState: State = {
      quotes: {},
    };

    context.achievements.setAchievements("quote", {
      initialState: {
        quotesReceived: 0,
      },

      achievements: [
        {
          constraint: (state) => state.quotesReceived >= 30,
          progress: (state) => state.quotesReceived / 30,

          role: {
            name: "Scholar",
            reason: "Interested in IRC history.",
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
      check: /^!quote$/i,
      handler: async (context, message) => {
        const { id, username } = message.author;
        const { nickname } = message.member || {};

        const displayName = nickname || username;

        const state = context.store.get();

        const userState = state.quotes[id] || {
          seen: getDate(new Date("1970-01-02")),
          content: "",
        };

        const hasSeenDaily = userState.seen === getDate(new Date());

        let fortune = hasSeenDaily ? userState.content : null;

        for (let i = 0; !fortune && i < 100; i++) {
          const newFortune = (await getFortune()).trim();
          if (newFortune.length <= 2000) {
            fortune = newFortune;
            break;
          }
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
          await context.achievements.append("quote", message, (achievement) => {
            achievement.quotesReceived += 1;
            return achievement;
          });

          await context.store.update((cstate) => ({
            quotes: {
              ...cstate.quotes,
              [id]: nextState,
            },
          }));
        }

        message.reply(`Daily quote:\n\`\`\`${fortune}\`\`\``);
      },
    },
  ],
};

export default feature;
