import type { Client, Message } from "discord.js";
import * as constants from "../../constants";
import * as utils from "../../utils";

const fortunes = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes definitely.",
  "You may rely on it.",

  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",

  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const reactions: {
  check: RegExp;
  callback: (match: RegExpMatchArray, event: Message) => Promise<void>;
}[] = [
  {
    check: /^!8ball (.+)$/i,
    callback: async (match, event) => {
      const query = match[1];
      if (!query) return;

      const index = Math.floor(Math.random() * (fortunes.length - 0.000001));

      event.reply(`${query}: \`${fortunes[index]}\``);
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

function use(client: Client) {
  client.on("messageCreate", processMessage);
}

export default {
  use,
};
