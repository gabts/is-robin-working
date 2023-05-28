import type { Client, Message } from "discord.js";
import * as constants from "../../constants";
import { Store, StoreState } from "../../state";
import * as utils from "../../utils";
import type { DiscordSlashCommand } from "../../main";

async function getFortune() {
  const out = await utils.spawn("fortune", []);
  return out.stdout;
}

function getDate(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

const reactions: {
  check: RegExp;
  callback: (state: StoreState, event: Message) => void;
}[] = [
  {
    check: /^!fortune$/i,
    callback: async (state, event) => {
      const { id, username } = event.author;
      const { nickname } = event.member || {};

      const displayName = nickname || username;

      const userState = state.fortunes[id] || {
        seen: getDate(new Date(0)),
        content: "",
      };

      const hasSeenDaily = userState.seen === getDate(new Date());
      const fortune = hasSeenDaily
        ? userState.content
        : (await getFortune()).trim();

      if (!fortune) {
        event.reply(`sorry, I am unable to tell your fortune`);
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

      event.reply(`Daily fortune for ${displayName}:\n\`\`\`${fortune}\`\`\``);
    },
  },
];

async function processMessage(event: Message) {
  if (!event.author) return;
  if (event.author.id === constants.APPLICATION_ID) return;

  const state = Store.get();
  const content = event.content.trim();

  try {
    for (const reaction of reactions) {
      if (reaction.check.test(content)) {
        await reaction.callback(state, event);
        return;
      }
    }
  } catch (err) {
    console.error("Failed to process fortune:", err);
  }
}

export interface State {
  fortunes: Record<
    string,
    {
      seen: string;
      content: string;
    }
  >;
}

async function warmup() {
  const defaultState: State = {
    fortunes: {},
  };

  return Store.update((state) => {
    return {
      ...defaultState,
      ...state,
    };
  });
}

function use(client: Client, commands: DiscordSlashCommand[]) {
  client.on("messageCreate", processMessage);

  client.on("ready", async () => {
    try {
      await warmup();
    } catch (err) {
      console.error("Failed to start fortune:", err);
      process.exit(1);
    }
  });
}

export default {
  use,
};
