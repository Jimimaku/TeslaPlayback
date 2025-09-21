import { FormControl, Select as PrimerSelect, SelectProps as PrimerSelectProps } from "@primer/react";
import { ReactNode } from "react";

const resolveOption = <T extends string>(option: T | Option<T>): Option<T> =>
  typeof option === "string" ? { value: option, label: option } : option;

export type SelectProps<T extends string> = {
  options: T[] | Option<T>[];
  renderOption?: <T extends string>(option: Option<T>) => ReactNode;
} & IO<T, T | null>;

export type FormSelectProps<T extends string> = NonConflictJoin<
  {
    label: ReactNode;
  } & SelectProps<T>,
  PrimerSelectProps
>;

export function FormSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption = (option) => (typeof option === "string" ? option : option.label),
  ...rest
}: FormSelectProps<T>) {
  return (
    <FormControl>
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
