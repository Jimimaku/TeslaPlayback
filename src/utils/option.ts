export type Option<T> = { value: T; label: React.ReactNode; disabled?: boolean };

export const resolveOption = <T extends string>(option: T | Option<T>): Option<T> =>
  typeof option === "string" ? { value: option, label: option } : option;
