import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  queueJobStatuses,
  type CleanableJobStatus,
  type JobCounts,
  type QueueJobStatus,
} from "../../server/index";
import { useTokai } from "../provider";
import { CleanJobsDialog } from "./CleanJobsDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { ConcurrencyDialog } from "./ConcurrencyDialog";
import { RateLimitDialog } from "./RateLimitDialog";

const statusFilterOptions: Array<{
  label: string;
  value: QueueJobStatus | null;
}> = [
  { label: "all", value: null },
  ...queueJobStatuses.map((status) => ({
    label: status.replaceAll("-", " "),
    value: status,
  })),
];

type ToolbarProps = {
  isStatusFilterOpen: boolean;
  isQueueOptionsOpen: boolean;
  isQueueInfoOpen: boolean;
  setIsStatusFilterOpen: Dispatch<SetStateAction<boolean>>;
  setIsQueueOptionsOpen: Dispatch<SetStateAction<boolean>>;
  setIsQueueInfoOpen: Dispatch<SetStateAction<boolean>>;
};

function getQueueStatus(queueInfo: JobCounts | undefined) {
  if (!queueInfo) return "unknown";
  return queueInfo.meta.paused ? "paused" : "running";
}

function getQueueInfoHeight(isEditing: boolean, hasError: boolean) {
  if (!isEditing) return 15;
  return hasError ? 19 : 17;
}

function QueueInfoPopover({ isOpen }: { isOpen: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const {
    state: { queues, selectedQueue, pollingIntervalMs },
    actions: { setPollingInterval },
  } = useTokai();

  useEffect(() => {
    if (isOpen) return;
    setIsEditing(false);
    setError("");
  }, [isOpen]);

  if (!isOpen || !selectedQueue) return null;

  const queueInfo = queues.find(
    (queue) =>
      queue.name === selectedQueue.name &&
      queue.prefix === selectedQueue.prefix,
  );

  const edit = () => {
    setInput(String(pollingIntervalMs));
    setError("");
    setIsEditing(true);
  };

  const confirm = () => {
    const intervalMs = Number(input);

    if (!Number.isInteger(intervalMs) || intervalMs <= 0) {
      setError("Enter a positive whole number of milliseconds.");
      return;
    }

    setPollingInterval(intervalMs);
    setIsEditing(false);
    setError("");
  };

  const cancel = () => {
    setIsEditing(false);
    setError("");
  };

  const rateLimit =
    queueInfo?.meta.max !== undefined && queueInfo.meta.duration !== undefined
      ? `${queueInfo.meta.max} jobs / ${queueInfo.meta.duration} ms`
      : "not set";

  return (
    <box
      position="absolute"
      top={2}
      left={0}
      zIndex={2_000}
      width={52}
      height={getQueueInfoHeight(isEditing, Boolean(error))}
      border
      borderColor="#3B82F6"
      backgroundColor="#000000"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      gap={1}
    >
      <text fg="#C7D2E9">Prefix: {selectedQueue.prefix}</text>
      <text fg="#C7D2E9">Status: {getQueueStatus(queueInfo)}</text>
      <text fg="#C7D2E9">Version: {queueInfo?.meta.version ?? "unknown"}</text>
      <text fg="#C7D2E9">
        Concurrency: {queueInfo?.meta.concurrency ?? "not set"}
      </text>
      <text fg="#C7D2E9">Rate limit: {rateLimit}</text>
      <text fg="#C7D2E9">
        Event stream max: {queueInfo?.meta.maxLenEvents ?? "not set"}
      </text>
      {isEditing ? (
        <>
          <box
            width="100%"
            height={3}
            flexDirection="row"
            alignItems="center"
            gap={1}
          >
            <text fg="#C7D2E9">Polling:</text>
            <box height={3} minWidth={0} flexGrow={1} border>
              <input
                value={input}
                placeholder="5000"
                placeholderColor="#59677F"
                textColor="#F3F6FF"
                focused
                onInput={(value) => {
                  setInput(value);
                  setError("");
                }}
                onSubmit={confirm}
              />
            </box>
            <text fg="#8290AA">ms</text>
            <box
              width={3}
              height={1}
              alignItems="center"
              justifyContent="center"
              onMouseDown={confirm}
            >
              <text fg="#4ADE80">✓</text>
            </box>
            <box
              width={3}
              height={1}
              alignItems="center"
              justifyContent="center"
              onMouseDown={cancel}
            >
              <text fg="#FB7185">×</text>
            </box>
          </box>
          {error ? <text fg="#FB7185">{error}</text> : null}
        </>
      ) : (
        <box height={1} flexDirection="row" alignItems="center" gap={1}>
          <text fg="#C7D2E9">Polling: {pollingIntervalMs} ms</text>
          <box
            width={6}
            height={1}
            alignItems="center"
            justifyContent="center"
            onMouseDown={edit}
          >
            <text fg="#60A5FA">Edit</text>
          </box>
        </box>
      )}
    </box>
  );
}

function QueueIdentity({
  isQueueInfoOpen,
  setIsQueueInfoOpen,
  setIsStatusFilterOpen,
  setIsQueueOptionsOpen,
}: Pick<
  ToolbarProps,
  | "isQueueInfoOpen"
  | "setIsQueueInfoOpen"
  | "setIsStatusFilterOpen"
  | "setIsQueueOptionsOpen"
>) {
  const {
    state: { selectedQueue, jobsTotal, jobsSearchQuery },
    actions: { showQueues },
  } = useTokai();

  if (!selectedQueue) return null;

  const toggleInfo = () => {
    setIsStatusFilterOpen(false);
    setIsQueueOptionsOpen(false);
    setIsQueueInfoOpen((isOpen) => !isOpen);
  };

  return (
    <box flexDirection="row" alignItems="center" gap={2}>
      <box
        width={10}
        height={3}
        backgroundColor="#253552"
        alignItems="center"
        justifyContent="center"
        onMouseDown={showQueues}
      >
        <text fg="#FFFFFF">← Back</text>
      </box>
      <box position="relative" flexDirection="row" alignItems="center" gap={1}>
        <text fg="#F3F6FF">
          {selectedQueue.name} · {jobsTotal}{" "}
          {jobsSearchQuery ? "matches" : "jobs"}
        </text>
        <box
          width={3}
          height={1}
          alignItems="center"
          justifyContent="center"
          onMouseDown={toggleInfo}
        >
          <text fg="#60A5FA">ⓘ</text>
        </box>
        <QueueInfoPopover isOpen={isQueueInfoOpen} />
      </box>
    </box>
  );
}

function StatusFilter({
  isOpen,
  setIsOpen,
  setIsQueueInfoOpen,
  setIsQueueOptionsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsQueueInfoOpen: Dispatch<SetStateAction<boolean>>;
  setIsQueueOptionsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    state: { jobsStatusFilter },
    actions: { filterJobsByStatus },
  } = useTokai();

  const toggle = () => {
    setIsQueueInfoOpen(false);
    setIsQueueOptionsOpen(false);
    setIsOpen((current) => !current);
  };

  return (
    <box width={30} height={3} position="relative" zIndex={1_500}>
      <box
        width={30}
        height={3}
        backgroundColor="#253552"
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        onMouseDown={toggle}
      >
        <text fg="#C7D2E9">Status: {jobsStatusFilter ?? "all"}</text>
        <text fg="#8EA2C9">{isOpen ? "▴" : "▾"}</text>
      </box>
      {isOpen ? (
        <box
          position="absolute"
          top={3}
          left={0}
          zIndex={2_000}
          width={30}
          height={statusFilterOptions.length * 3 + 2}
          border
          borderColor="#3B82F6"
          backgroundColor="#000000"
          flexDirection="column"
        >
          {statusFilterOptions.map((option) => {
            const isSelected = jobsStatusFilter === option.value;
            return (
              <box
                key={option.label}
                width="100%"
                height={3}
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={isSelected ? "#1D4ED8" : "#000000"}
                alignItems="flex-start"
                justifyContent="center"
                onMouseDown={() => {
                  setIsOpen(false);
                  void filterJobsByStatus(option.value);
                }}
              >
                <text fg={isSelected ? "#FFFFFF" : "#8290AA"}>
                  {option.label}
                </text>
              </box>
            );
          })}
        </box>
      ) : null}
    </box>
  );
}

type Launchers = {
  openConcurrency: (initial: string) => void;
  openRateLimit: () => void;
  openClean: () => void;
  openDrain: () => void;
  openRetry: () => void;
  openObliterate: () => void;
};

const QueueDialogsContext = createContext<Launchers | null>(null);

function QueueDialogs({ children }: { children: ReactNode }) {
  const [isConcurrencyOpen, setIsConcurrencyOpen] = useState(false);
  const [concurrency, setConcurrency] = useState("");
  const [concurrencyError, setConcurrencyError] = useState("");
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [rateLimitDuration, setRateLimitDuration] = useState("");
  const [rateLimitError, setRateLimitError] = useState("");
  const [isCleanOpen, setIsCleanOpen] = useState(false);
  const [cleanStatus, setCleanStatus] =
    useState<CleanableJobStatus>("completed");
  const [cleanGraceMs, setCleanGraceMs] = useState("86400000");
  const [cleanLimit, setCleanLimit] = useState("1000");
  const [cleanError, setCleanError] = useState("");
  const [isDrainOpen, setIsDrainOpen] = useState(false);
  const [isRetryOpen, setIsRetryOpen] = useState(false);
  const [isObliterateOpen, setIsObliterateOpen] = useState(false);
  const {
    state: {
      selectedQueue,
      isSettingQueueConcurrency,
      isRateLimitingQueue,
      isCleaningJobs,
      isDrainingQueue,
      isRetryingJobs,
      isObliteratingQueue,
    },
    actions: {
      setQueueConcurrency,
      rateLimitQueue,
      cleanJobs,
      drainQueue,
      retryJobs,
      obliterateQueue,
    },
  } = useTokai();

  if (!selectedQueue) return null;

  const confirmConcurrency = async () => {
    if (isSettingQueueConcurrency) return;
    const value = Number(concurrency);
    if (!Number.isInteger(value) || value <= 0) {
      setConcurrencyError("Enter a positive whole number.");
      return;
    }
    setConcurrencyError("");
    await setQueueConcurrency(value);
    setIsConcurrencyOpen(false);
  };

  const confirmRateLimit = async () => {
    if (isRateLimitingQueue) return;
    const value = Number(rateLimitDuration);
    if (!Number.isInteger(value) || value <= 0) {
      setRateLimitError("Enter a positive whole number of milliseconds.");
      return;
    }
    setRateLimitError("");
    await rateLimitQueue(value);
    setIsRateLimitOpen(false);
  };

  const confirmClean = async () => {
    if (isCleaningJobs) return;
    const graceMs = Number(cleanGraceMs);
    const limit = Number(cleanLimit);
    if (!Number.isInteger(graceMs) || graceMs < 0) {
      setCleanError("Minimum age must be a non-negative whole number.");
      return;
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      setCleanError("Maximum jobs must be a positive whole number.");
      return;
    }
    setCleanError("");
    await cleanJobs(cleanStatus, graceMs, limit);
    setIsCleanOpen(false);
  };

  const launchers: Launchers = {
    openConcurrency: (initial) => {
      setConcurrency(initial);
      setConcurrencyError("");
      setIsConcurrencyOpen(true);
    },
    openRateLimit: () => {
      setRateLimitDuration("");
      setRateLimitError("");
      setIsRateLimitOpen(true);
    },
    openClean: () => {
      setCleanStatus("completed");
      setCleanGraceMs("86400000");
      setCleanLimit("1000");
      setCleanError("");
      setIsCleanOpen(true);
    },
    openDrain: () => setIsDrainOpen(true),
    openRetry: () => setIsRetryOpen(true),
    openObliterate: () => setIsObliterateOpen(true),
  };

  return (
    <QueueDialogsContext.Provider value={launchers}>
      {children}
      <RateLimitDialog
        isOpen={isRateLimitOpen}
        queueName={selectedQueue.name}
        duration={rateLimitDuration}
        error={rateLimitError}
        isPending={isRateLimitingQueue}
        onDurationChange={(value) => {
          setRateLimitDuration(value);
          setRateLimitError("");
        }}
        onCancel={() => setIsRateLimitOpen(false)}
        onConfirm={() => void confirmRateLimit()}
      />
      <ConcurrencyDialog
        isOpen={isConcurrencyOpen}
        queueName={selectedQueue.name}
        concurrency={concurrency}
        error={concurrencyError}
        isPending={isSettingQueueConcurrency}
        onConcurrencyChange={(value) => {
          setConcurrency(value);
          setConcurrencyError("");
        }}
        onCancel={() => setIsConcurrencyOpen(false)}
        onConfirm={() => void confirmConcurrency()}
      />
      <CleanJobsDialog
        isOpen={isCleanOpen}
        queueName={selectedQueue.name}
        status={cleanStatus}
        graceMs={cleanGraceMs}
        limit={cleanLimit}
        error={cleanError}
        isPending={isCleaningJobs}
        onStatusChange={setCleanStatus}
        onGraceMsChange={(value) => {
          setCleanGraceMs(value);
          setCleanError("");
        }}
        onLimitChange={(value) => {
          setCleanLimit(value);
          setCleanError("");
        }}
        onCancel={() => setIsCleanOpen(false)}
        onConfirm={() => void confirmClean()}
      />
      <ConfirmationDialog
        isOpen={isRetryOpen}
        title="Retry failed jobs?"
        message={`This moves all failed jobs in ${selectedQueue.name} back to waiting.`}
        confirmLabel="Yes, retry"
        pendingLabel="Retrying..."
        isPending={isRetryingJobs}
        onCancel={() => setIsRetryOpen(false)}
        onConfirm={() => {
          if (isRetryingJobs) return;
          void retryJobs("failed").then(() => setIsRetryOpen(false));
        }}
      />
      <ConfirmationDialog
        isOpen={isDrainOpen}
        title="Empty queue?"
        message={`This removes all waiting and delayed jobs from ${selectedQueue.name}.`}
        confirmLabel="Yes, empty"
        pendingLabel="Emptying..."
        isPending={isDrainingQueue}
        variant="danger"
        onCancel={() => setIsDrainOpen(false)}
        onConfirm={() => {
          if (isDrainingQueue) return;
          void drainQueue().then(() => setIsDrainOpen(false));
        }}
      />
      <ConfirmationDialog
        isOpen={isObliterateOpen}
        title="Obliterate queue?"
        message={`This permanently removes ${selectedQueue.name} and all its jobs.`}
        confirmLabel="Yes, obliterate"
        pendingLabel="Obliterating..."
        isPending={isObliteratingQueue}
        variant="danger"
        onCancel={() => setIsObliterateOpen(false)}
        onConfirm={() => {
          if (isObliteratingQueue) return;
          void obliterateQueue().then(() => setIsObliterateOpen(false));
        }}
      />
    </QueueDialogsContext.Provider>
  );
}

function QueueOptions({
  isOpen,
  setIsOpen,
  setIsQueueInfoOpen,
  setIsStatusFilterOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsQueueInfoOpen: Dispatch<SetStateAction<boolean>>;
  setIsStatusFilterOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    state: { queues, selectedQueue, changingQueueStatus },
    actions: { setQueuePaused },
  } = useTokai();
  const dialogLaunchers = useContext(QueueDialogsContext);

  if (!selectedQueue) return null;

  const queueInfo = queues.find(
    (queue) =>
      queue.name === selectedQueue.name &&
      queue.prefix === selectedQueue.prefix,
  );
  const isPaused = queueInfo?.meta.paused ?? false;
  const select = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const toggle = () => {
    setIsQueueInfoOpen(false);
    setIsStatusFilterOpen(false);
    setIsOpen((current) => !current);
  };

  return (
    <box width={5} height={3} position="relative" zIndex={1_500}>
      <box
        width={5}
        height={3}
        backgroundColor="#253552"
        alignItems="center"
        justifyContent="center"
        onMouseDown={toggle}
      >
        <text fg="#C7D2E9">⋮</text>
      </box>
      {isOpen ? (
        <box
          position="absolute"
          top={3}
          right={0}
          zIndex={2_000}
          width={20}
          height={15}
          border
          borderColor="#253552"
          backgroundColor="#000000"
          flexDirection="column"
          gap={1}
        >
          <box
            width="100%"
            height={1}
            paddingLeft={1}
            paddingRight={1}
            alignItems="flex-start"
            onMouseDown={() => {
              if (changingQueueStatus) return;
              setIsOpen(false);
              void setQueuePaused(selectedQueue, !isPaused);
            }}
          >
            <text fg="#C7D2E9">
              {changingQueueStatus
                ? isPaused
                  ? "Resuming..."
                  : "Pausing..."
                : isPaused
                  ? "Resume queue"
                  : "Pause queue"}
            </text>
          </box>
          <Option
            label="Set rate limit"
            onSelect={() => select(() => dialogLaunchers?.openRateLimit())}
          />
          <Option
            label="Set concurrency"
            onSelect={() =>
              select(() =>
                dialogLaunchers?.openConcurrency(
                  queueInfo?.meta.concurrency === undefined
                    ? ""
                    : String(queueInfo.meta.concurrency),
                ),
              )
            }
          />
          <Option
            label="Clean jobs"
            onSelect={() => select(() => dialogLaunchers?.openClean())}
          />
          <Option
            label="Empty queue"
            onSelect={() => select(() => dialogLaunchers?.openDrain())}
          />
          <Option
            label="Retry failed jobs"
            onSelect={() => select(() => dialogLaunchers?.openRetry())}
          />
          <Option
            label="Obliterate queue"
            color="#FB7185"
            onSelect={() => select(() => dialogLaunchers?.openObliterate())}
          />
        </box>
      ) : null}
    </box>
  );
}

function Option({
  label,
  color = "#C7D2E9",
  onSelect,
}: {
  label: string;
  color?: string;
  onSelect: () => void;
}) {
  return (
    <box
      width="100%"
      height={1}
      paddingLeft={1}
      paddingRight={1}
      alignItems="flex-start"
      onMouseDown={onSelect}
    >
      <text fg={color}>{label}</text>
    </box>
  );
}

export function JobsToolbar(props: ToolbarProps) {
  const {
    actions: { openAddJob },
  } = useTokai();

  return (
    <QueueDialogs>
      <box
        width="100%"
        height={3}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        zIndex={1_000}
      >
        <QueueIdentity {...props} />
        <box height={3} flexDirection="row" alignItems="center" gap={1}>
          <StatusFilter
            isOpen={props.isStatusFilterOpen}
            setIsOpen={props.setIsStatusFilterOpen}
            setIsQueueInfoOpen={props.setIsQueueInfoOpen}
            setIsQueueOptionsOpen={props.setIsQueueOptionsOpen}
          />
          <box
            width={14}
            height={3}
            backgroundColor="#2563EB"
            alignItems="center"
            justifyContent="center"
            onMouseDown={openAddJob}
          >
            <text fg="#FFFFFF">Add Job</text>
          </box>
          <QueueOptions
            isOpen={props.isQueueOptionsOpen}
            setIsOpen={props.setIsQueueOptionsOpen}
            setIsQueueInfoOpen={props.setIsQueueInfoOpen}
            setIsStatusFilterOpen={props.setIsStatusFilterOpen}
          />
        </box>
      </box>
    </QueueDialogs>
  );
}
