import { robinBot } from "../../robin-bot";
import { Store } from "../../store";
import * as utils from "../../utils";

export interface State {
  fortunes: Record<
    string,
    {
      seen: string;
      content: string;
    }
  >;
}

function getDate(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

async function getFortune() {
  const out = await utils.spawn("fortune", []);
  return out.stdout;
}

robinBot.registerFeature({
  name: "Fortune",
  // skip: true,
  warmUp: () => {
    const defaultState: State = {
      fortunes: {},
    };

    return Store.update((state) => ({
      ...defaultState,
      ...state,
    }));
  },
  reactions: [
    {
      check: /^!fortune$/i,
      handler: async (message) => {
        const { id, username } = message.author;
        const { nickname } = message.member || {};

        const displayName = nickname || username;

        const state = Store.get();

        const userState = state.fortunes[id] || {
          seen: getDate(new Date()),
          content: "",
        };

        const hasSeenDaily = userState.seen === getDate(new Date());

        let fortune = hasSeenDaily ? userState.content : null;

        for (let i = 0; i < 100; i++) {
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
          await Store.update((cstate) => ({
            fortunes: {
              ...cstate.fortunes,
              [id]: nextState,
            },
          }));
        }

        message.reply(
          `Daily fortune for ${displayName}:\n\`\`\`${fortune}\`\`\``
        );
      },
    },
  ],
});
