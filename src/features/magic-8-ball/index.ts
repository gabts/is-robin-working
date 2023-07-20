import { Feature } from "../../types";

export interface AchievementState {
  queries: number;
}

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

const feature: Feature = {
  name: "Magic 8 Ball",
  warmUp: (context) => {
    context.achievements.setAchievements("ball", {
      initialState: {
        queries: 0,
      },

      achievements: [
        {
          constraint: (state) => state.queries >= 30,
          progress: (state) => state.queries / 30,

          role: {
            name: "Theist",
            reason: "Putting faith in the ball.",
          },
        },
      ],
    });
  },
  reactions: [
    {
      check: /^!8ball (.+)$/i,
      handler: async (context, message, match) => {
        const query = match[1];
        if (!query) return;

        const index = Math.floor(Math.random() * (fortunes.length - 0.000001));

        context.achievements.append("ball", message, (state) => {
          state.queries += 1;
          return state;
        });

        message.reply(`\`${fortunes[index]}\``);
      },
    },
  ],
};

export default feature;

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
