import * as utils from "../../utils";
import {
  isWeekendOrVacationOrHoliday,
  nextWorkingDate,
} from "./next-working-date";

import { Context, Feature } from "../../types";

export interface AchievementState {
  queries: number;
}

export interface State {
  isWorking: boolean;
  lastUpdateMs: number;
}

function warmup(context: Context) {
  const defaultState: State = {
    isWorking: false,
    lastUpdateMs: 0,
  };

  context.store.update((state) => ({
    ...defaultState,
    ...state,
  }));
}

function refreshState(context: Context) {
  console.log("Is Robin Working > refreshing state");

  return context.store.update((state) => {
    const lastUpdateDate = new Date(state.lastUpdateMs).getDate();
    const today = new Date();
    const date = today.getDate();

    if (date === lastUpdateDate) return state;

    const lastUpdateMs = today.getTime();

    return isWeekendOrVacationOrHoliday(today)
      ? { lastUpdateMs }
      : { lastUpdateMs, isWorking: !state.isWorking };
  });
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

    try {
      warmup(context);
      refreshState(context);
      const interval: any = setInterval(
        () => refreshState(context),
        1000 * 60 * 60
      );
      interval.unref();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  },
  reactions: [
    {
      check: /^is\s+(robin|<:pizzarobin:1024343299487698974>)\s+working\??$/i,
      handler: (context, message) => {
        const state = context.store.get();

        context.achievements.append("robin", message, (state) => {
          state.queries += 1;
          return state;
        });

        if (state.isWorking) {
          message.reply("yes!");
          return;
        }

        const nextDate = nextWorkingDate(state.isWorking);
        const nextDateString = utils.isTomorrow(nextDate)
          ? "tomorrow"
          : `${nextDate.getDate()}/${nextDate.getMonth() + 1}`;

        message.reply(`no, but he'll be back ${nextDateString}!`);
      },
    },

    {
      check: /^is\s+robin\s+working\s+tomorrow\??$/i,
      handler: (context, message) => {
        const nextDate = nextWorkingDate(context.store.get().isWorking);

        context.achievements.append("robin", message, (state) => {
          state.queries += 1;
          return state;
        });

        if (utils.isTomorrow(nextDate)) {
          message.reply("yes!");
          return;
        }

        const nextDateString = `${nextDate.getDate()}/${
          nextDate.getMonth() + 1
        }`;

        message.reply(`no, but he'll be back ${nextDateString}!`);
      },
    },

    {
      check: /^\/is-robin-working (no|yes)$/i,
      handler: (context, message) => {
        const [_, nextState] = message.content.split(" ");

        if (!nextState) return;

        const state = context.store.get();

        switch (nextState.toLowerCase()) {
          case "yes":
            const isNonWorkingDay = isWeekendOrVacationOrHoliday(new Date());

            if (isNonWorkingDay) {
              const nextDate = nextWorkingDate(state.isWorking);
              const nextDateString = `${nextDate.getDate()}/${
                nextDate.getMonth() + 1
              }`;

              message.reply(
                `today is not a work day, next valid work day is ${nextDateString}`
              );
              return;
            }

            if (state.isWorking === true) {
              message.reply("yes I already know he's working today...");
              return;
            }

            context.store.update(() => ({ isWorking: true }));
            message.reply("ok, everyone will be happy Robin is working today!");
            return;

          case "no":
            if (state.isWorking === false) {
              message.reply("yes I already know he's not working today...");
              return;
            }

            context.store.update(() => ({ isWorking: false }));
            message.reply("ok, I hope Robin has a nice day off work!");
            return;
        }
      },
    },
  ],
};

export default feature;
