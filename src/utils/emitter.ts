export default class Emitter<Args extends { [key: string]: any[] }> {
  #listeners: Record<any, any[]> = {};

  on = <Key extends keyof Args>(
    evt: Key,
    callback: (...args: Args[Key]) => void
  ) => {
    const l = this.#listeners[evt] || [];
    this.#listeners[evt] = l;

    l.push(callback);
  };

  off = <Key extends keyof Args>(
    evt: Key,
    callback?: (...args: Args[Key]) => void
  ) => {
    if (callback) {
      const l = this.#listeners[evt] || [];
      this.#listeners[evt] = l.filter((listener) => listener !== callback);
    } else {
      this.#listeners[evt] = [];
    }
  };

  emit = <Key extends keyof Args>(evt: Key, ...values: Args[Key]) => {
    const listeners = this.#listeners[evt] || [];
    for (const listener of listeners) listener(...values);
  };

  onPromise = <Key extends keyof Args>(
    evt: Key,
    opts: { amount: number } = { amount: 1 }
  ): Promise<Args[Key][]> => {
    let resolve: any;

    let at = 0;
    const payloads: any[] = [];
    this.on(evt, (...payload) => {
      at++;

      payloads.push(payload);
      if (at >= opts.amount) {
        resolve(payloads);
      }
    });

    return new Promise((_resolve) => {
      resolve = _resolve;
    });
  };
}
