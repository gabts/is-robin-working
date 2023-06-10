import * as fs from "fs/promises";
import type * as isRobinWorking from "./features/is-robin-working";
import type * as weather from "./features/weather";
import type * as fortune from "./features/fortune";

const CACHE_PATH = "../cache.json";

export type StoreState = isRobinWorking.State & weather.State & fortune.State;

export const Store = new (class StoreClass {
  #state: StoreState = {
    isWorking: false,
    lastUpdateMs: Date.now(),
    fortunes: {},
    weather: {},
  };

  #updateChain: null | Promise<void> = null;

  warmup = async (): Promise<void> => {
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
      await fs.writeFile(CACHE_PATH, JSON.stringify(state));
      console.log("store > wrote state to cache.", state);
    }, 100);
  };

  #readCache = async (): Promise<Partial<StoreState>> => {
    try {
      const data = await fs.readFile(CACHE_PATH);
      const cachedState = JSON.parse(data.toString("utf8"));

      console.log("store > read cached state", cachedState);

      return cachedState;
    } catch (err) {
      return {
        isWorking: false,
        lastUpdateMs: Date.now(),
        fortunes: {},
        weather: {},
      };
    }
  };
})();
