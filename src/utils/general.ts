export const $ = <R>(fn: () => R) => fn();

export const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];
export const getKeys = <T extends string, V>(obj: { [key in T]: V }): T[] => Object.keys(obj) as T[];
export const getSortedKeys = <T extends string, V>(obj: { [key in T]: V }): T[] => getKeys(obj).sort();

export const entries = <K extends string | number | symbol, V>(obj: Record<K, V> | Partial<Record<K, V>>) => Object.entries(obj) as [K, V][];
export const fromEntries = <K extends string | number | symbol, V>(entries: [K, V][]) => Object.fromEntries(entries) as Record<K, V>;

export const values = <T extends object>(obj: T): T[keyof T][] => Object.values(obj) as T[keyof T][];

export const mapAndFind = <T, R>(arr: T[], fn: (item: T, index: number, array: T[]) => R | undefined): R | undefined => {
  for (let i = 0; i < arr.length; i++) {
    const res = fn(arr[i], i, arr);
    if (res != null) return res;
  }
};
