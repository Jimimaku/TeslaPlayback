export const any =
  <T>(fn: (a: T) => boolean) =>
  (list: readonly T[]): boolean =>
    list.some(fn);
