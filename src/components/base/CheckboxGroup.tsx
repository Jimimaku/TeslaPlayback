import { Checkbox, CheckboxGroup, FormControl } from "@primer/react";
import { ComponentProps, ReactNode } from "react";
import { Option } from "../../utils/option";

const resolveOption = <T extends string>(option: T | Option<T>): Option<T> =>
  typeof option === "string" ? { value: option, label: option } : option;

type CheckboxGroupProps<T extends string> = {
  options: (T | Option<T>)[];
  renderOption?: <T extends string>(option: Option<T>) => ReactNode;
} & {
  label: ReactNode;
  caption?: ReactNode;
  validation?: ReactNode;
} & IO<T[], T[] | null>;

type PrimerCheckboxGroupProps = Omit<ComponentProps<typeof CheckboxGroup>, "children">;
export type FormMultiSelectProps<T extends string> = NonConflictJoin<CheckboxGroupProps<T>, PrimerCheckboxGroupProps>;

export function FormCheckboxGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption = (option) => (typeof option === "string" ? option : option.label),
  caption,
  validation,
  ...rest
}: FormMultiSelectProps<T>) {
  return (
    <CheckboxGroup {...rest}>
      <CheckboxGroup.Label>{label}</CheckboxGroup.Label>
      {caption && <CheckboxGroup.Caption>{label}</CheckboxGroup.Caption>}

      {options.map(resolveOption).map((option) => (
        <FormControl disabled={option.disabled}>
          <Checkbox
            value={option.value}
            onChange={(e) => {
              onChange(e.target.checked ? [...(value ?? []), option.value] : (value ?? []).filter((v) => v !== option.value));
            }}
            checked={value?.includes(option.value)}
            disabled={option.disabled}
          />
          <FormControl.Label>{renderOption(option)}</FormControl.Label>
        </FormControl>
      ))}
      {validation && <CheckboxGroup.Validation variant="error">{validation}</CheckboxGroup.Validation>}
    </CheckboxGroup>
  );
}
