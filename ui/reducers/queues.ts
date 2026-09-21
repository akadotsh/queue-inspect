import type { AppAction, AppState } from "../state";
import { isSameQueue, jobsPageState } from "./helpers";

function resetQueueView(state: AppState): AppState {
  return {
    ...state,
    selectedQueue: null,
    jobs: [],
    jobsPage: 1,
    jobsTotal: 0,
    hasNextJobsPage: false,
    jobsStatusFilter: null,
    jobsSearchQuery: "",
    jobsMessage: "",
    pendingOperation: null,
    selectedJobId: null,
    selectedJobDetails: null,
    jobDetailsMessage: "",
    isAddJobScreenOpen: false,
    newJobName: "",
    newJobData: "{}",
  };
}

function reduceQueueSelectionState(
  state: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "queuesLoading":
      return { ...state, message: "Scanning for queues..." };
    case "queuesLoaded":
      return {
        ...state,
        queues: action.queues,
        message:
          action.queues.length === 0
            ? "No queues found."
            : `Found ${action.queues.length} Queue${action.queues.length === 1 ? "" : "s"}.`,
      };
    case "queuesRefreshed":
      return { ...state, queues: action.queues };
    case "queuesFailed":
      return { ...state, message: action.message };
    case "selectedQueueMissing":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...resetQueueView(state),
        message: `Queue "${action.queue.name}" is no longer available.`,
      };
    case "showQueues":
      return resetQueueView(state);
    default:
      return state;
  }
}

function reduceQueueJobOperations(
  state: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "queueDrainStarted":
      return {
        ...state,
        pendingOperation: { type: "drainQueue" },
        jobsMessage: "",
      };
    case "queueDrained":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        ...jobsPageState(action.result),
        pendingOperation: null,
        jobsMessage: `Emptied queue "${action.queue.name}".`,
      };
    case "queueDrainFailed":
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    case "queueCleanStarted":
      return {
        ...state,
        pendingOperation: { type: "cleanJobs" },
        jobsMessage: "",
      };
    case "queueCleaned":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        ...jobsPageState(action.result),
        pendingOperation: null,
        jobsMessage: `Cleaned ${action.removedCount} ${action.status} job${action.removedCount === 1 ? "" : "s"} from queue "${action.queue.name}".`,
      };
    case "queueCleanFailed":
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    case "jobsRetryStarted":
      return {
        ...state,
        pendingOperation: { type: "retryJobs" },
        jobsMessage: "",
      };
    case "jobsRetried":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        ...jobsPageState(action.result),
        pendingOperation: null,
        jobsMessage: `Retried ${action.state} jobs in queue "${action.queue.name}".`,
      };
    case "jobsRetryFailed":
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    default:
      return state;
  }
}

function reduceQueueSettingsState(
  state: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "queueStatusChangeStarted":
      return {
        ...state,
        pendingOperation: { type: "queueStatus", queue: action.queue },
        jobsMessage: "",
        message: "",
      };
    case "queueStatusChanged":
      if (
        state.pendingOperation?.type !== "queueStatus" ||
        !isSameQueue(state.pendingOperation.queue, action.queue)
      ) {
        return state;
      }
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        pendingOperation: null,
        jobsMessage: `${action.paused ? "Paused" : "Resumed"} queue "${action.queue.name}".`,
        message: `${action.paused ? "Paused" : "Resumed"} queue "${action.queue.name}".`,
      };
    case "queueStatusChangeFailed":
      if (
        state.pendingOperation?.type !== "queueStatus" ||
        !isSameQueue(state.pendingOperation.queue, action.queue)
      ) {
        return state;
      }
      return {
        ...state,
        pendingOperation: null,
        jobsMessage: action.message,
        message: action.message,
      };
    case "queueConcurrencySetStarted":
      return {
        ...state,
        pendingOperation: { type: "setConcurrency" },
        jobsMessage: "",
      };
    case "queueConcurrencySet":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        pendingOperation: null,
        jobsMessage: `Set concurrency for queue "${action.queue.name}" to ${action.concurrency}.`,
      };
    case "queueConcurrencySetFailed":
      return {
        ...state,
        pendingOperation: null,
        jobsMessage: action.message,
      };
    case "queueRateLimitStarted":
      return {
        ...state,
        pendingOperation: { type: "rateLimit" },
        jobsMessage: "",
      };
    case "queueRateLimited":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        pendingOperation: null,
        jobsMessage: `Rate limited queue "${action.queue.name}" for ${action.durationMs} ms.`,
      };
    case "queueRateLimitFailed":
      return {
        ...state,
        pendingOperation: null,
        jobsMessage: action.message,
      };
    default:
      return state;
  }
}

function reduceQueueObliterateState(
  state: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "queueObliterateStarted":
      return {
        ...state,
        pendingOperation: { type: "obliterateQueue" },
        jobsMessage: "",
      };
    case "queueObliterated":
      return {
        ...state,
        queues: state.queues.filter(
          (queue) => !isSameQueue(queue, action.queue),
        ),
        selectedQueue: null,
        jobs: [],
        jobsPage: 1,
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsStatusFilter: null,
        jobsSearchQuery: "",
        selectedJobId: null,
        selectedJobDetails: null,
        jobDetailsMessage: "",
        pendingOperation: null,
        message: `Obliterated queue "${action.queue.name}".`,
      };
    case "queueObliterateFailed":
      return {
        ...state,
        pendingOperation: null,
        jobsMessage: action.message,
      };
    default:
      return state;
  }
}

export function reduceQueueState(state: AppState, action: AppAction): AppState {
  return reduceQueueObliterateState(
    reduceQueueSettingsState(
      reduceQueueJobOperations(
        reduceQueueSelectionState(state, action),
        action,
      ),
      action,
    ),
    action,
  );
}
