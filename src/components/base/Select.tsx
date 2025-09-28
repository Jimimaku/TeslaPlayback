import { FormControl, Select as PrimerSelect, SelectProps as PrimerSelectProps } from "@primer/react";
import { ReactNode } from "react";

const resolveOption = <T extends string>(option: T | Option<T>): Option<T> =>
  typeof option === "string" ? { value: option, label: option } : option;

type CommonSelectProps<T extends string> = {
  options: (T | Option<T>)[];
  renderOption?: <T extends string>(option: Option<T>) => ReactNode;
} & {
  label: ReactNode;
};

export type FormSingleSelectProps<T extends string> = NonConflictJoin<CommonSelectProps<T> & IO<T, T | null>, PrimerSelectProps>;
export type FormMultiSelectProps<T extends string> = NonConflictJoin<CommonSelectProps<T> & IO<T[], T[] | null>, PrimerSelectProps>;

export function FormSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption = (option) => (typeof option === "string" ? option : option.label),
  sx,
  ...rest
}: FormSingleSelectProps<T>) {
  return (
    <FormControl sx={sx}>
      <FormControl.Label>{label}</FormControl.Label>
      <PrimerSelect value={value ?? undefined} onChange={(e) => onChange(e.target.value as T)} {...rest}>
        {options.map(resolveOption).map((option) => (
          <PrimerSelect.Option key={option.value} aria-current={value === option.value} value={option.value}>
            {renderOption(option)}
          </PrimerSelect.Option>
        ))}
      </PrimerSelect>
    </FormControl>
  );
}

export function FormMultipleSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption = (option) => (typeof option === "string" ? option : option.label),
  sx,
  ...rest
}: FormMultiSelectProps<T>) {
  return (
    <FormControl sx={sx}>
      <FormControl.Label>{label}</FormControl.Label>
      <PrimerSelect
        value={value ?? undefined}
        onChange={(e) => {
          const toggleItem = e.target.value as T;
          const newValue = value?.includes(toggleItem) ? value.filter((v) => v !== toggleItem) : [...(value ?? []), toggleItem];
          return onChange(newValue);
        }}
        {...rest}
        aria-multiline
      >
        {options.map(resolveOption).map((option) => (
          <PrimerSelect.Option key={option.value} aria-current={value?.includes(option.value)} value={option.value}>
            {renderOption(option)}
          </PrimerSelect.Option>
        ))}
      </PrimerSelect>
    </FormControl>
  );
}
