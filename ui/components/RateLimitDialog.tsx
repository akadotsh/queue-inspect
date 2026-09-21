import { Dialog, DialogActions } from "./ConfirmationDialog";

type RateLimitDialogProps = {
  isOpen: boolean;
  duration: string;
  error: string;
  isPending: boolean;
  onDurationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function RateLimitDialog({
  isOpen,
  duration,
  error,
  isPending,
  onDurationChange,
  onConfirm,
  onCancel,
}: RateLimitDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      width={68}
      height={18}
      borderColor="#3B82F6"
      isPending={isPending}
      onCancel={onCancel}
    >
      <text fg="#F3F6FF">Set rate limit</text>
      <box
        width="100%"
        height={3}
        flexDirection="row"
        alignItems="center"
        gap={1}
      >
        <text fg="#C7D2E9">Duration</text>
        <box height={3} minWidth={0} flexGrow={1} border borderColor="#3B82F6">
          <input
            value={duration}
            placeholder="60000"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            focused
            onInput={onDurationChange}
            onSubmit={onConfirm}
          />
        </box>
        <text fg="#8290AA">ms</text>
      </box>
      <text fg={error ? "#FB7185" : "#8290AA"}>{error}</text>
      <DialogActions
        confirmLabel="Apply rate limit"
        pendingLabel="Applying..."
        accentColor="#2563EB"
        isPending={isPending}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Dialog>
  );
}
