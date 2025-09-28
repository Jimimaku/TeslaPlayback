import { FormControl, NavList, NavListProps } from "@primer/react";
import { TeslaFS } from "../TeslaFS";
import { FormSingleSelectProps } from "./base/Select";

type TimestampSelectProps = Omit<NonConflictJoin<FormSingleSelectProps<TeslaFS.Timestamp>, NavListProps>, "children"> & {
  innerSx?: NavListProps["sx"];
};

export function TimestampSelect({
  label,
  options,
  value,
  onChange,
  renderOption = ({ value }) => TeslaFS.formatTimestamp(value),
  sx,
  ...rest
}: TimestampSelectProps) {
  return (
    <FormControl sx={sx}>
      <FormControl.Label>{label}</FormControl.Label>
      <NavList {...rest}>
        {options.map((option) => (
          <NavList.Item
            key={typeof option === "string" ? option : option.value}
            aria-current={value === option}
            onClick={() => onChange(typeof option === "string" ? option : option.value)}
            sx={{ whiteSpace: "nowrap", fontFamily: "mono" }}
          >
            {renderOption(typeof option === "string" ? { value: option, label: option } : option)}
          </NavList.Item>
        ))}
      </NavList>
    </FormControl>
  );
}
