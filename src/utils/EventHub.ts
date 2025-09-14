export class EventHub<T> {
  constructor(private emitLastOnListen: boolean = false) {}
  #lastEvent?: T;

  listeners: ((event: T) => void)[] = [];
  addListener = (listener: (event: T) => void) => {
    this.listeners.push(listener);
    if (this.#lastEvent !== undefined) {
      listener(this.#lastEvent);
    }
  };

  removeListener = (listener: (event: T) => void) => {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) this.listeners.splice(index, 1);
  };

  dispatch = (event: T) => {
    this.listeners.forEach((listener) => listener(event));
    if (this.emitLastOnListen) {
      this.#lastEvent = event;
    }
  };
}
