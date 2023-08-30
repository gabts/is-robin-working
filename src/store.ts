import * as fs from "fs/promises";

import type * as isRobinWorking from "./features/is-robin-working";
import type * as weather from "./features/weather";
import type * as fortune from "./features/fortune";
import type * as quote from "./features/quote";
import type * as achievements from "./features/achievements";

const CACHE_PATH = "../cache.json";

export type StoreState = isRobinWorking.State &
  weather.State &
  fortune.State &
  quote.State &
  achievements.State;

interface Cache {
  read: () => string | Promise<string | Buffer>;
  write: (state: StoreState) => void | Promise<void>;
}

export class MemCache implements Cache {
  private buffer: string = "";
  constructor(v: Partial<StoreState>) {
    this.write({
      isWorking: false,
      lastUpdateMs: Date.now(),
      fortunesN: {},
      quotes: {},
      weather: {},
      achievements: {},
      ...v,
    });
  }

  read = () => {
    return this.buffer;
  };

  write = (state: StoreState) => {
    this.buffer = JSON.stringify(state);
  };
}

export const fs_cache: Cache = {
  read: () => {
    return fs.readFile(CACHE_PATH);
  },

  write: (state: StoreState) => {
    return fs.writeFile(CACHE_PATH, JSON.stringify(state));
  },
};

export default class Store {
  #state: StoreState = {
    isWorking: false,
    lastUpdateMs: Date.now(),
    fortunesN: {},
    weather: {},
    achievements: {},
    quotes: {},
  };

  constructor(private cache: Cache = fs_cache) {}

  #updateChain: null | Promise<void> = null;

  warmup = async (): Promise<void> => {
    console.log("store > warm up");
    const cachedState = await this.#readCache();
    this.#state = { ...this.#state, ...cachedState };
  };

  get = (): StoreState => {
    return { ...this.#state };
  };

  update = (
    callback: (
      state: StoreState
    ) => Partial<StoreState> | Promise<Partial<StoreState>>
  ): Promise<void> => {
    const resolver = async () => {
      const newState = await callback({ ...this.#state });
      this.#state = { ...this.#state, ...newState };
      await this.#writeCache(this.#state);
    };

    const next = this.#updateChain
      ? this.#updateChain.then(resolver)
      : resolver();

    this.#updateChain = next;

    return this.#updateChain.then(() => {
      if (this.#updateChain === next) this.#updateChain = null;
    });
  };

  #timeout: null | NodeJS.Timeout = null;

  #writeCache = async (state: StoreState): Promise<void> => {
    if (this.#timeout) clearTimeout(this.#timeout);

    this.#timeout = setTimeout(async () => {
      await this.cache.write(state);
      console.log("store > wrote state to cache.", state);
    }, 100);
  };

  #readCache = async (): Promise<Partial<StoreState>> => {
    try {
      const data = await this.cache.read();
      const cachedState = JSON.parse(data.toString("utf8"));

      console.log("store > read cached state", cachedState);

      return cachedState;
    } catch (err) {
      return {
        isWorking: false,
        lastUpdateMs: Date.now(),
        fortunesN: {},
        quotes: {},
        weather: {},
      };
    }
  };
}
