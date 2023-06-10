import { Store } from "../../store";
import * as utils from "../../utils";
import {
  isWeekendOrVacationOrHoliday,
  nextWorkingDate,
} from "./next-working-date";

import { robinBot } from "../../robin-bot";

export interface State {
  isWorking: boolean;
  lastUpdateMs: number;
}

function warmup() {
  const defaultState: State = {
    isWorking: false,
    lastUpdateMs: 0,
  };

  Store.update((state) => ({
    ...defaultState,
    ...state,
  }));
}

function refreshState() {
  console.log("Is Robin Working > refreshing state");

  return Store.update((state) => {
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

robinBot.registerFeature({
  name: "Is Robin Working",
  warmUp: () => {
    try {
      warmup();
      refreshState();
      const interval = setInterval(refreshState, 1000 * 60 * 60);
      interval.unref();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  },
  reactions: [
    {
      check: /^is\s+(robin|<:pizzarobin:1024343299487698974>)\s+working\??$/i,
      handler: (message) => {
        const state = Store.get();

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
      handler: (message) => {
        const nextDate = nextWorkingDate(Store.get().isWorking);

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
      handler: (message) => {
        const [_, nextState] = message.content.split(" ");

        if (!nextState) return;

        const state = Store.get();

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

            Store.update(() => ({ isWorking: true }));
            message.reply("ok, everyone will be happy Robin is working today!");
            return;

          case "no":
            if (state.isWorking === false) {
              message.reply("yes I already know he's not working today...");
              return;
            }

            Store.update(() => ({ isWorking: false }));
            message.reply("ok, I hope Robin has a nice day off work!");
            return;
        }
      },
    },
  ],
});
