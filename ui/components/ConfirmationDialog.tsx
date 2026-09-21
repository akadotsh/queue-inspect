import { useKeyboard } from "@opentui/react";
import type { PropsWithChildren } from "react";

type DialogProps = PropsWithChildren<{
  isOpen: boolean;
  width: number;
  height: number;
  borderColor: string;
  isPending: boolean;
  onCancel: () => void;
}>;

export function Dialog({
  isOpen,
  width,
  height,
  borderColor,
  isPending,
  onCancel,
  children,
}: DialogProps) {
  useKeyboard((event) => {
    if (isOpen && !isPending && event.name === "escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  });

  if (!isOpen) return null;

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      zIndex={9_000}
      backgroundColor="#05070DB3"
      alignItems="center"
      justifyContent="center"
    >
      <box
        width={width}
        maxWidth="100%"
        height={height}
        border
        borderColor={borderColor}
        backgroundColor="#000000"
        padding={1}
        flexDirection="column"
        gap={1}
      >
        {children}
      </box>
    </box>
  );
}

type DialogActionsProps = {
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  accentColor: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DialogActions({
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  accentColor,
  isPending,
  onConfirm,
  onCancel,
}: DialogActionsProps) {
  return (
    <box
      width="100%"
      height={3}
      flexDirection="row"
      justifyContent="flex-end"
      gap={1}
    >
      <box
        width={12}
        height={3}
        backgroundColor="#253552"
        alignItems="center"
        justifyContent="center"
        onMouseDown={() => {
          if (!isPending) onCancel();
        }}
      >
        <text fg={isPending ? "#59677F" : "#FFFFFF"}>{cancelLabel}</text>
      </box>
      <box
        width={20}
        height={3}
        backgroundColor={accentColor}
        alignItems="center"
        justifyContent="center"
        onMouseDown={() => {
          if (!isPending) onConfirm();
        }}
      >
        <text fg="#FFFFFF">{isPending ? pendingLabel : confirmLabel}</text>
      </box>
    </box>
  );
}

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  pendingLabel = "Confirming...",
  cancelLabel = "Cancel",
  isPending = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const accentColor = variant === "danger" ? "#DC2626" : "#2563EB";
  const messageColor = variant === "danger" ? "#FB7185" : "#C7D2E9";

  return (
    <Dialog
      isOpen={isOpen}
      width={58}
      height={11}
      borderColor={accentColor}
      isPending={isPending}
      onCancel={onCancel}
    >
      <text fg="#F3F6FF">{title}</text>
      <text fg={messageColor}>{message}</text>
      <DialogActions
        confirmLabel={confirmLabel}
        pendingLabel={pendingLabel}
        cancelLabel={cancelLabel}
        accentColor={accentColor}
        isPending={isPending}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Dialog>
  );
}
