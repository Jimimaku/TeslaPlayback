import { NavList, NavListProps } from "@primer/react";
import { TeslaFS } from "../TeslaFS";
import { SelectProps } from "./base/Select";

type TimestampSelectProps = Omit<NonConflictJoin<SelectProps<TeslaFS.Timestamp>, NavListProps>, "children">;

export function TimestampSelect({
  options,
  value,
  onChange,
  renderOption = ({ value }) => TeslaFS.formatTimestamp(value),
  ...rest
}: TimestampSelectProps) {
  return (
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
  );
}
