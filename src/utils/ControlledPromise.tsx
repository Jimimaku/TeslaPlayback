export interface ControlledPromise<T> {
  promise: Promise<T>;
  resolve(t: T): void;
  reject(reason: any): void;
}
export const createControlledPromise = <T,>(): ControlledPromise<T> => {
  let _resolve: undefined | ((t: T) => void);
  let _reject: undefined | ((reason: any) => void);
  const promise = new Promise<T>((__resolve, __reject) => {
    _resolve = __resolve;
    _reject = __reject;
  });
  return {
    promise,
    resolve(t: T) {
      if (!_resolve) throw new Error("Promise not set");
      _resolve(t);
    },
    reject(reason: any) {
      if (!_reject) throw new Error("Promise not set");
      _reject(reason);
    },
  };
};
