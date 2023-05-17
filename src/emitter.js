class Emitter {
  _listeners = new Map();

  on = (evt, cb) => {
    const listeners = this._listeners.get(evt) || [];
    listeners.push(cb);

    this._listeners.set(evt, listeners);
    return cb;
  };

  off = (evt, cb) => {
    const listeners = this._listeners.get(evt) || [];
    this._listeners.set(
      evt,
      listeners.filter((storedCb) => storedCb !== cb)
    );

    return cb;
  };

  emit = async (evt, ...args) => {
    const listeners = this._listeners.get(evt) || [];

    for (const listener of listeners) {
      await listener(...args);
    }
  };
}

module.exports = Emitter;
