import { Dialog, DialogActions } from "./ConfirmationDialog";

type ConcurrencyDialogProps = {
  isOpen: boolean;
  queueName: string;
  concurrency: string;
  error: string;
  isPending: boolean;
  onConcurrencyChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConcurrencyDialog({
  isOpen,
  queueName,
  concurrency,
  error,
  isPending,
  onConcurrencyChange,
  onConfirm,
  onCancel,
}: ConcurrencyDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      width={68}
      height={18}
      borderColor="#3B82F6"
      isPending={isPending}
      onCancel={onCancel}
    >
      <text fg="#F3F6FF">Set queue concurrency</text>
      <text fg="#8290AA">
        Maximum active jobs across all workers for {queueName}.
      </text>
      <box
        width="100%"
        height={3}
        flexDirection="row"
        alignItems="center"
        gap={1}
      >
        <text fg="#C7D2E9">Concurrency</text>
        <box height={3} minWidth={0} flexGrow={1} border borderColor="#3B82F6">
          <input
            value={concurrency}
            placeholder="10"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            focused
            onInput={onConcurrencyChange}
            onSubmit={onConfirm}
          />
        </box>
      </box>
      <text fg={error ? "#FB7185" : "#8290AA"}>{error}</text>
      <DialogActions
        confirmLabel="Set concurrency"
        pendingLabel="Applying..."
        accentColor="#2563EB"
        isPending={isPending}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Dialog>
  );
}
