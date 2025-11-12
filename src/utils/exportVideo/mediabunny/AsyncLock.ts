import { createControlledPromise } from "../../ControlledPromise";

export class AsyncLock {
  private last: Promise<void> = Promise.resolve();

  acquire = (): Promise<() => void> => {
    const p = createControlledPromise<void>();
    const last = this.last;
    this.last = p.promise;

    return last.then(() => p.resolve);
  };
}

export const useLock = <R>(lock: AsyncLock, fn: () => Promise<R>): Promise<R> =>
  lock.acquire().then(async (release) => {
    try {
      return await fn();
    } finally {
      release();
    }
  });
