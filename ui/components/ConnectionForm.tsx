import { useQueueInspect } from "../provider";

export function ConnectionForm() {
  const {
    state: { connectionUrl, message },
    actions: { setConnectionUrl, connect },
  } = useQueueInspect();

  return (
    <box
      width="100%"
      height="100%"
      backgroundColor="#000000"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap={1}
    >
      <box
        width={64}
        maxWidth="100%"
        border
        borderColor="#253552"
        padding={2}
        flexDirection="column"
        gap={1}
      >
        <text fg="#8EA2C9">QUEUE INSPECT</text>
        <text fg="#F3F6FF">Connect to a queue backend</text>
        <box border borderColor="#3B82F6" paddingLeft={1} paddingRight={1}>
          <input
            value={connectionUrl}
            placeholder="Connection URL"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            focused
            onInput={setConnectionUrl}
            onSubmit={connect}
          />
        </box>

        <box
          width={18}
          height={3}
          backgroundColor="#2563EB"
          alignItems="center"
          justifyContent="center"
          onMouseDown={connect}
        >
          <text fg="#FFFFFF">Submit</text>
        </box>

        {message ? (
          <text fg={message === "Connecting..." ? "#FACC15" : "#FB7185"}>
            {message}
          </text>
        ) : (
          <text fg="#59677F">Press Enter or click Submit · Ctrl+C to quit</text>
        )}
      </box>
      <text fg="#59677F">Supported: BullMQ · RabbitMQ</text>
    </box>
  );
}
