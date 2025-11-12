import { createControlledPromise } from "../../../components/ControlledPromise";

export class AsyncLock {
  private last: Promise<void> = Promise.resolve();

  acquire = (): Promise<() => void> => {
    const p = createControlledPromise<void>();
    const last = this.last;
    this.last = p.promise;

    return last.then(() => p.resolve);
  };
}
