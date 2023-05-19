type Listener = (...args: any[]) => void | Promise<void>;

export class Emitter {
  _listeners = new Map<string, Listener[]>();

  on = (evt: string, cb: Listener) => {
    const listeners = this._listeners.get(evt) || [];
    listeners.push(cb);

    this._listeners.set(evt, listeners);
    return cb;
  };

  off = (evt: string, cb: Listener) => {
    const listeners = this._listeners.get(evt) || [];
    this._listeners.set(
      evt,
      listeners.filter((storedCb) => storedCb !== cb)
    );

    return cb;
  };

  emit = async (evt: string, ...args: unknown[]) => {
    const listeners = this._listeners.get(evt) || [];

    for (const listener of listeners) {
      await listener(...args);
    }
  };
}
