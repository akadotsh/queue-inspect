import { useState } from "react";
import type { JobCounts, QueueRef, RabbitQueueInfo } from "../../server/index";
import { useQueueInspect } from "../provider";

function getMessageColor(message: string) {
  if (
    message.startsWith("Found ") ||
    message.startsWith("Metadata for") ||
    message.startsWith("Obliterated ") ||
    message.startsWith("Paused ") ||
    message.startsWith("Resumed ")
  ) {
    return "#4ADE80";
  }

  if (message.startsWith("Scanning ") || message.startsWith("Querying ")) {
    return "#FACC15";
  }

  return "#FB7185";
}

export function Queues() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    state: { queues, pendingOperation, message },
    actions: { fetchQueues, fetchJobs, setQueuePaused },
  } = useQueueInspect();
  const changingQueueStatus =
    pendingOperation?.type === "queueStatus" ? pendingOperation.queue : null;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredQueues = normalizedSearchQuery
    ? queues.filter((queue) =>
        queue.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : queues;

  return (
    <box flexGrow={1} padding={2} flexDirection="column" gap={1}>
      <box flexDirection="row" alignItems="center" gap={2}>
        <text fg="#C7D2E9">Queues ({queues.length})</text>
        <box
          width={12}
          height={3}
          backgroundColor="#253552"
          alignItems="center"
          justifyContent="center"
          onMouseDown={fetchQueues}
        >
          <text fg="#FFFFFF">↻ Refresh</text>
        </box>
      </box>

      <box
        width="100%"
        height={3}
        border
        borderColor="#3B82F6"
        paddingLeft={1}
        paddingRight={1}
      >
        <input
          value={searchQuery}
          placeholder="Filter queues..."
          placeholderColor="#59677F"
          textColor="#F3F6FF"
          focused
          onInput={setSearchQuery}
        />
      </box>

      <box width="100%" flexDirection="row" flexWrap="wrap" gap={1}>
        {filteredQueues.map((queue) =>
          queue.backend === "rabbitmq" ? (
            <RabbitQueueCard
              key={`rabbitmq:${queue.vhost}:${queue.name}`}
              queue={queue}
            />
          ) : (
            <BullQueueCard
              key={`bullmq:${queue.prefix}:${queue.name}`}
              queue={queue}
              changingQueueStatus={changingQueueStatus}
              fetchJobs={fetchJobs}
              setQueuePaused={setQueuePaused}
            />
          ),
        )}
        {queues.length > 0 && filteredQueues.length === 0 ? (
          <text fg="#8290AA">No queues match "{searchQuery.trim()}".</text>
        ) : null}
      </box>

      {message ? <text fg={getMessageColor(message)}>{message}</text> : null}
    </box>
  );
}

function RabbitQueueCard({ queue }: { queue: RabbitQueueInfo }) {
  return (
    <box
      width="49%"
      height={8}
      border
      borderColor="#253552"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
    >
      <box width="100%" flexDirection="row" justifyContent="space-between">
        <text fg="#F3F6FF">{queue.name}</text>
        <text fg="#8EA2C9">RabbitMQ</text>
      </box>
      <text fg="#8290AA">
        vhost {queue.vhost} · {queue.state}
      </text>
      <box flexDirection="row" gap={2}>
        <text fg="#C7D2E9">total {queue.counts.total}</text>
        <text fg="#FACC15">ready {queue.counts.ready}</text>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg="#60A5FA">unacknowledged {queue.counts.unacknowledged}</text>
        <text fg="#4ADE80">consumers {queue.consumers}</text>
      </box>
      <text fg="#8290AA">{queue.durable ? "durable" : "transient"}</text>
    </box>
  );
}

type BullQueueCardProps = {
  queue: JobCounts;
  changingQueueStatus: QueueRef | null;
  fetchJobs: ReturnType<typeof useQueueInspect>["actions"]["fetchJobs"];
  setQueuePaused: ReturnType<
    typeof useQueueInspect
  >["actions"]["setQueuePaused"];
};

function BullQueueCard({
  queue: { name, prefix, meta, counts, backend },
  changingQueueStatus,
  fetchJobs,
  setQueuePaused,
}: BullQueueCardProps) {
  return (
    <box
      width="49%"
      height={8}
      border
      borderColor="#253552"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      onMouseDown={() => fetchJobs({ backend, name, prefix })}
    >
      <box width="100%" flexDirection="row" justifyContent="space-between">
        <box flexDirection="column">
          <text fg="#F3F6FF">{name}</text>
          {meta.paused ? <text fg="#FACC15">● Paused</text> : null}
        </box>
        <box flexDirection="row" alignItems="center" gap={2}>
          <box
            width={3}
            height={1}
            alignItems="center"
            justifyContent="center"
            onMouseDown={(event) => {
              event.stopPropagation();
              if (changingQueueStatus) return;
              void setQueuePaused({ backend, name, prefix }, !meta.paused);
            }}
          >
            <text fg={meta.paused ? "#4ADE80" : "#FACC15"}>
              {changingQueueStatus?.name === name &&
              changingQueueStatus.prefix === prefix
                ? "◌"
                : meta.paused
                  ? "▶"
                  : "⏸"}
            </text>
          </box>
          <text fg="#8EA2C9">→</text>
        </box>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg="#4ADE80">completed {counts.completed}</text>
        <text fg="#FB7185">failed {counts.failed}</text>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg="#FACC15">delayed {counts.delayed}</text>
        <text fg="#60A5FA">active {counts.active}</text>
        <text fg="#C7D2E9">wait {counts.wait}</text>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg="#A78BFA">waiting-children {counts["waiting-children"]}</text>
        <text fg="#F472B6">prioritized {counts.prioritized}</text>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg="#2DD4BF">repeat {counts.repeat}</text>
      </box>
    </box>
  );
}
