import { ConnectionForm } from "./components/ConnectionForm";
import { Layout } from "./components/Layout";
import { useQueueInspect } from "./provider";

export function App() {
  const { state } = useQueueInspect();

  return state.isConnected ? <Layout /> : <ConnectionForm />;
}
