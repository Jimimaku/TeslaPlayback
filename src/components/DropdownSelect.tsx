import { ActionList, ActionMenu } from "@primer/react";
import { ReactNode } from "react";
import { Option, resolveOption } from "../utils/option";

export function DropdownSelect<T extends string>({
  value,
  onChange,
  options,
  title,
}: {
  value: T;
  onChange: (value: T) => void;
  title?: ReactNode;
  options: (T | Option<T>)[];
}) {
  return (
    <ActionMenu>
      <ActionMenu.Button>{title}</ActionMenu.Button>
      <ActionMenu.Overlay>
        <ActionList selectionVariant="single">
          {options.map(resolveOption).map(({ label, value: optionValue }) => (
            <ActionList.Item key={optionValue} selected={optionValue === value} onSelect={() => onChange(optionValue)}>
              {label}
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
