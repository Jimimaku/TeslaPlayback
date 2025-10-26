import "ramda";

declare module "ramda" {
  // handling nil
  export function when<T, V>(pred: (a: Nullable<T>) => a is T, whenTrueFn: (a: T) => V): (a: T | null | undefined) => V | null | undefined;
}
