import { Button, ButtonProps } from "@primer/react";
import { InputHTMLAttributes, PropsWithChildren, useRef } from "react";

type Props = PropsWithChildren<{
  onLoad: (files: FileList | null) => void;
  selectDir?: boolean;
  inputProps?: Partial<InputHTMLAttributes<HTMLInputElement>>;
}> &
  Pick<ButtonProps, "variant">;

export const LoadFilesButton = ({ onLoad, selectDir, inputProps, variant, children }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <Button variant={variant} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
      <input
        hidden
        ref={inputRef}
        type="file"
        {...(selectDir ? { webkitdirectory: "true" } : {})} // solve type error
        {...inputProps}
        style={{ visibility: "hidden", width: 0, height: 0 }}
        onChange={(event) => {
          onLoad(event.target.files);
          inputProps?.onChange?.(event);
        }}
      />
    </>
  );
};
