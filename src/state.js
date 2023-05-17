const fs = require("fs/promises");

const Store = new (class State {
  _state = {};

  warmup = async () => {
    this._state = { ...this._state, ...(await this._readCache()) };
  };

  get = () => {
    return { ...this._state };
  };

  update = async (callback) => {
    this._state = { ...this._state, ...(await callback({ ...this._state })) };
    await this._writeCache(this._state);
  };

  _writeCache = async (state) => {
    await fs.writeFile("./cache.json", JSON.stringify(state));
    console.log("wrote state to cache.");
  };

  _readCache = async () => {
    try {
      const data = await fs.readFile("./cache.json");
      const cachedState = JSON.parse(data);

      console.log("read cached state", cachedState);

      return cachedState;
    } catch (err) {
      return {
        isWorking: false,
        lastUpdateMs: Date.now(),
      };
    }
  };
})();

module.exports = Store;
