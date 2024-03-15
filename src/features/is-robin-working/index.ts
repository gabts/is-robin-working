import { Feature } from "../../types";

export interface AchievementState {
  queries: number;
}

export interface State {
  isWorking: boolean;
  lastUpdateMs: number;
}

const feature: Feature = {
  name: "Is Robin Working",
  warmUp: (context) => {
    context.achievements.setAchievements("robin", {
      initialState: {
        queries: 0,
      },

      achievements: [
        {
          constraint: (state) => state.queries >= 30,
          progress: (state) => state.queries / 30,
          role: {
            name: "Nosy",
            reason: "Would like an AirTag in Robin's bag.",
          },
        },
      ],
    });
  },
  reactions: [
    {
      check: /^is\s+(robin|<:pizzarobin:1024343299487698974>)\s+working\??$/i,
      handler: (context, message) => {
        context.achievements.append("robin", message, (state) => {
          state.queries += 1;
          return state;
        });

        message.reply("no he quit 🦀");
      },
    },

    {
      check: /^is\s+robin\s+working\s+tomorrow\??$/i,
      handler: (context, message) => {
        context.achievements.append("robin", message, (state) => {
          state.queries += 1;
          return state;
        });

        message.reply("no he quit 🦀");
      },
    },
  ],
};

export default feature;
