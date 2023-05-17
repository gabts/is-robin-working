const { spawn } = require("../../utils");
const Store = require("../../state");

async function getFortune() {
  const out = await spawn("fortune", []);
  return out.stdout;
}

function getDate(d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

const reactions = [
  {
    check: /^!fortune$/i,
    callback: async (state, event) => {
      const { id, username } = event.author;
      const userState = state.fortunes[id] || {
        seen: getDate(new Date(0)),
        content: "",
      };

      const hasSeenDaily = userState.seen === getDate(new Date());
      const fortune = hasSeenDaily
        ? userState.content
        : (await getFortune()).trim();

      const nextState = {
        seen: getDate(new Date()),
        content: fortune,
      };

      if (!hasSeenDaily)
        await Store.update((cstate) => ({
          fortunes: { ...cstate.fortunes, [id]: nextState },
        }));

      event.reply(`Daily fortune for ${username}:\n\`\`\`${fortune}\`\`\``);
    },
  },
];

async function processMessage(event) {
  if (!event.author) return;
  if (event.author.id === "1107944006735904798") return;

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

function use(client) {
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

async function warmup() {
  const defaultState = {
    fortunes: {},
  };

  return Store.update((state) => {
    return {
      ...defaultState,
      ...state,
    };
  });
}

module.exports = {
  use,
  processMessage,
  warmup,
};
