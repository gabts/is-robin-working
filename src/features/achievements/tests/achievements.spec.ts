import "mocha";
import { expect } from "chai";

import Store, { StoreState, MemCache } from "../../../store";
import { MockedClient } from "../../../robin-bot";
import { Achievements } from "../../../features/achievements";

import registerFeatures from "../../../features";

describe("Features", () => {
  describe.only("Fortune", () => {
    async function getState(v: Partial<StoreState>) {
      const memcache = new MemCache(v);

      const store = new Store(memcache);

      const context = {
        store,
        achievements: new Achievements(store),
      };

      await store.warmup();

      const mock = new MockedClient(context);
      registerFeatures(mock);

      await mock.start();

      return { memcache, context, mock };
    }

    it("should format progress on !achievements", async () => {
      const { mock } = await getState({
        achievements: {
          authorId: {
            fortune: {
              fortunesReceived: 10,
            },

            ball: {
              queries: 10,
            },

            robin: {
              queries: 10,
            },

            numberwang: {
              guesses: 0,
              gamesWon: 8,
            },

            word: {
              gamesSucceededTotal: 7,
              gamesFailed: 7,
              gamesSucceeded1: 7,
              gamesSucceeded2: 7,
              gamesSucceeded3: 7,
              gamesSucceeded4: 7,
              gamesSucceeded5: 7,
              gamesSucceeded6: 7,
            },

            weather: {
              queries: 18,
            },
          },
        },
      });

      const onReply = mock.onPromise("reply");

      await mock.sendMessage({
        content: "!achievements",
        author: {
          id: "authorId",
        },
      });

      const [reply] = await onReply;
      console.log("Reply", reply);
    });
  });
});
