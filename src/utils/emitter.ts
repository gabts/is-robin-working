type Listener = (...args: unknown[]) => void | Promise<void>;

export class Emitter {
  #listeners = new Map<string, Listener[]>();

  on = (evt: string, cb: Listener): void => {
    const listeners = this.#listeners.get(evt);
    if (!listeners) return;

    listeners.push(cb);
  };

  emit = async (evt: string, ...args: unknown[]): Promise<void> => {
    const listeners = this.#listeners.get(evt);
    if (!listeners) return;

    await Promise.all(listeners.map((listener) => listener()));
  };
}
