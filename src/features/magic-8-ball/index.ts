import { robinBot } from "../../robin-bot";

const fortunes = [
  // very positive
  "YES!!!",
  "Yes, definitely.",
  "Yes.",
  "You can bet your butt on it, yes!",
  "Obviously, what do you think, duh...",

  // positive
  "I am certain of it.",
  "Without a doubt.",
  "It is known.",
  "Heck yeah!",
  "Most likely.",

  // slighty yes
  "Yup",
  "Yeah probably.",
  "Yass!",
  "Does the Pope have a funny hat?",
  "Mhmm",

  // wild card
  "Let's flip a coin... *flip* YES!",
  "Cringe...",
  "Let's flip a coin... *flip* NO!",

  // slighty no
  "Nah",
  "Probably not",
  "*Borat voice* Not!",
  "Does the Pope poop in the woods?",
  "Nope",

  // negative
  "No?",
  "I don't think so...",
  "Uhmm... no.",
  "What, no, of course not...weirdo.",
  "Don't count on it.",

  // very negative
  "No... baby gonna cry about it?",
  "Very doubtful.",
  "No.",
  "Absolutely not.",
  "NOPE!",
];

robinBot.registerFeature({
  name: "Magic 8 Ball",
  reactions: [
    {
      check: /^!8ball (.+)$/i,
      handler: async (message, match) => {
        const query = match[1];
        if (!query) return;

        const index = Math.floor(Math.random() * (fortunes.length - 0.000001));

        message.reply(`${query}: \`${fortunes[index]}\``);
      },
    },
  ],
});

// const reactions: {
//   check: RegExp;
//   callback: (match: RegExpMatchArray, event: Message) => Promise<void>;
// }[] = [
//   {
//     check: /^!8ball (.+)$/i,
//     callback: async (match, event) => {
//       const query = match[1];
//       if (!query) return;

//       const index = Math.floor(Math.random() * (fortunes.length - 0.000001));

//       event.reply(`${query}: \`${fortunes[index]}\``);
//     },
//   },
// ];

// async function processMessage(event: Message) {
//   if (!event.author) return;
//   if (event.author.id === constants.APPLICATION_ID) return;

//   const content = event.content.trim();

//   try {
//     for (const reaction of reactions) {
//       const match = content.match(reaction.check);

//       if (match) {
//         await reaction.callback(match, event);
//         return;
//       }
//     }
//   } catch (err) {
//     console.error("Failed to process fortune:", err);
//   }
// }

// export function use(client: Client, commands: DiscordSlashCommand[]) {
//   client.on("messageCreate", processMessage);
// }
