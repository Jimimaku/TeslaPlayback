import { DialogHeaderProps, DialogProps } from "@primer/react";
import { Dialog as PrimerDialog } from "@primer/react/experimental";
import { PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState } from "react";

export function Dialog<E extends HTMLElement>({
  trigger,
  children,
  title,
  dialogProps,
  onChangeIsOpen,
}: PropsWithChildren<{
  trigger: (isOpen: ValSet<boolean>, ref: RefObject<E>) => ReactNode;
  title?: ReactNode;
  headerProps?: Partial<DialogHeaderProps>;
  dialogProps?: Partial<DialogProps>;
  onChangeIsOpen?: (isOpen: boolean) => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef<E | null>(null);
  useEffect(() => {
    onChangeIsOpen?.(isOpen);
  }, [isOpen, onChangeIsOpen]);
  return (
    <>
      {trigger({ val: isOpen, set: setIsOpen }, returnFocusRef)}
      {isOpen && (
        <PrimerDialog title={title} onClose={() => setIsOpen(false)} height="large" {...dialogProps}>
          {children}
        </PrimerDialog>
      )}
    </>
  );
}
