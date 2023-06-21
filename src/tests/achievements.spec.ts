import "mocha";
import { expect } from "chai";

import Store, { StoreState, MemCache } from "../store";
import { MockedClient } from "../robin-bot";
import { Achievements } from "../features/achievements";

import registerFeatures from "../features";

describe("Achievements", () => {
  describe("Fortune", () => {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

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

    it("should add 'Fortune Teller' once a user has received 100 fortunes.", async () => {
      const { memcache, mock, context } = await getState({
        achievements: {
          authorId: {
            fortune: {
              fortunesReceived: 99,
            },
          },
        },
      });

      const onAchievement = context.achievements.onPromise("new_achievement");
      const onReply = mock.onPromise("reply", { amount: 2 });

      await mock.sendMessage({
        content: "!fortune",
        author: {
          id: "authorId",
        },
      });

      await onReply;
      const [authorId, achievementName] = (await onAchievement)[0]!;

      expect(authorId).to.equal("authorId");
      expect(achievementName).to.equal("Fortune Teller");

      // Wait for store to write.
      await sleep(100);

      const state: StoreState = JSON.parse(memcache.read());

      expect(state.achievements[authorId]?.fortune?.__achieved).to.contain(
        "Fortune Teller"
      );
    });

    it("shouldn't add 'Fortune Teller' to a user who already has the achievement.", async () => {
      const { memcache, mock } = await getState({
        achievements: {
          authorId: {
            fortune: {
              __achieved: ["Fortune Teller"],
              fortunesReceived: 100,
            },
          },
        },
      });

      const onReply = mock.onPromise("reply", { amount: 1 });

      await mock.sendMessage({
        content: "!fortune",
        author: {
          id: "authorId",
        },
      });

      await onReply;

      // Wait for store to write.
      await sleep(100);

      const state: StoreState = JSON.parse(memcache.read());
      expect(state.achievements.authorId?.fortune?.__achieved).to.have.lengthOf(
        1
      );

      expect(state.achievements.authorId?.fortune?.fortunesReceived).to.equal(
        101
      );
    });
  });
});
