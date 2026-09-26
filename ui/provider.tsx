import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
import {
  queueConnection,
  redisConnection,
  type CleanableJobStatus,
  type QueueJobStatus,
  type QueueRef,
  type RetryableJobState,
} from "../server/index";
import {
  createInitialState,
  reducer,
  type AppAction,
  type AppState,
} from "./reducer";

type QueueInspectActions = {
  setConnectionUrl: (value: string) => void;
  setPollingInterval: (value: number) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchQueues: () => Promise<void>;
  fetchJobs: (
    queue: QueueRef,
    page?: number,
    status?: QueueJobStatus | null,
    searchQuery?: string,
  ) => Promise<void>;
  filterJobsByStatus: (status: QueueJobStatus | null) => Promise<void>;
  searchJobs: (query: string) => Promise<void>;
  showPreviousJobsPage: () => Promise<void>;
  showNextJobsPage: () => Promise<void>;
  showQueues: () => void;
  openJobDetails: (jobId: string) => Promise<void>;
  closeJobDetails: () => void;
  deleteJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  openAddJob: () => void;
  closeAddJob: () => void;
  setNewJobName: (value: string) => void;
  setNewJobData: (value: string) => void;
  addJob: () => Promise<void>;
  drainQueue: () => Promise<void>;
  cleanJobs: (
    status: CleanableJobStatus,
    graceMs: number,
    limit: number,
  ) => Promise<void>;
  retryJobs: (state: RetryableJobState) => Promise<void>;
  setQueuePaused: (queue: QueueRef, paused: boolean) => Promise<void>;
  setQueueConcurrency: (concurrency: number) => Promise<void>;
  rateLimitQueue: (durationMs: number) => Promise<void>;
  obliterateQueue: () => Promise<void>;
};

type QueueInspectContextValue = {
  state: AppState;
  actions: QueueInspectActions;
};

const QueueInspectContext = createContext<QueueInspectContextValue | null>(
  null,
);
const JOBS_PAGE_SIZE = 10;

type PollSelection = {
  selectedQueue: QueueRef | null;
  jobsPage: number;
  jobsStatusFilter: QueueJobStatus | null;
  jobsSearchQuery: string;
};

async function refreshQueuesAndJobs(
  selection: PollSelection,
  isActive: () => boolean,
  dispatch: Dispatch<AppAction>,
) {
  const queues = await queueConnection.getQueues();

  if (!isActive()) return;
  dispatch({ type: "queuesRefreshed", queues });

  const { selectedQueue } = selection;
  if (!selectedQueue) return;

  const queueStillExists = queues.some(
    (queue) =>
      queue.backend === "bullmq" &&
      queue.name === selectedQueue.name &&
      queue.prefix === selectedQueue.prefix,
  );

  if (!queueStillExists) {
    dispatch({ type: "selectedQueueMissing", queue: selectedQueue });
    return;
  }

  const result = await redisConnection.getQueueJobs(
    selectedQueue,
    selection.jobsPage,
    JOBS_PAGE_SIZE,
    selection.jobsStatusFilter,
    selection.jobsSearchQuery,
  );

  if (!isActive()) return;
  dispatch({ type: "jobsRefreshed", queue: selectedQueue, result });
}

export function QueueInspectProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    reducer,
    queueConnection.isConnected,
    createInitialState,
  );
  const {
    connectionUrl,
    pollingIntervalMs,
    selectedQueue,
    jobsPage,
    hasNextJobsPage,
    jobsStatusFilter,
    jobsSearchQuery,
    newJobName,
    newJobData,
    pendingOperation,
    isConnected,
  } = state;
  const getCurrentJobs = (queue: QueueRef) =>
    redisConnection.getQueueJobs(
      queue,
      1,
      JOBS_PAGE_SIZE,
      jobsStatusFilter,
      jobsSearchQuery,
    );

  useEffect(() => {
    if (!isConnected || pendingOperation) {
      return;
    }

    let isActive = true;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        await refreshQueuesAndJobs(
          { selectedQueue, jobsPage, jobsStatusFilter, jobsSearchQuery },
          () => isActive,
          dispatch,
        );
      } catch {
        // Keep the current screen stable when a background refresh fails.
      } finally {
        isPolling = false;
      }
    };

    const interval = setInterval(() => void poll(), pollingIntervalMs);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [
    isConnected,
    jobsPage,
    jobsSearchQuery,
    jobsStatusFilter,
    pollingIntervalMs,
    pendingOperation,
    selectedQueue,
  ]);

  const fetchQueues = async () => {
    try {
      dispatch({ type: "queuesLoading" });
      const queues = await queueConnection.getQueues();
      dispatch({ type: "queuesLoaded", queues });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queuesFailed",
        message: `Could not scan for queues: ${reason}`,
      });
    }
  };

  const connect = async () => {
    const url = connectionUrl.trim();

    if (!url) {
      dispatch({
        type: "messageSet",
        message: "Please enter a connection URL.",
      });
      return;
    }

    try {
      dispatch({ type: "messageSet", message: "Connecting..." });
      await queueConnection.connect(url);
      dispatch({ type: "connected", connectionUrl: url });
      await fetchQueues();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "messageSet",
        message: `Could not connect: ${reason}`,
      });
    }
  };

  const disconnect = async () => {
    try {
      await queueConnection.disconnect();
      dispatch({ type: "disconnected" });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "messageSet",
        message: `Could not disconnect from Redis: ${reason}`,
      });
    }
  };

  const fetchJobs = async (
    queue: QueueRef,
    page = 1,
    status: QueueJobStatus | null = null,
    searchQuery = "",
  ) => {
    const query = searchQuery.trim();
    dispatch({ type: "jobsLoading", queue, page, status, searchQuery: query });

    try {
      const result = await redisConnection.getQueueJobs(
        queue,
        page,
        JOBS_PAGE_SIZE,
        status,
        query,
      );
      dispatch({ type: "jobsLoaded", queue, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobsFailed",
        queue,
        page,
        status,
        searchQuery: query,
        message: `Could not fetch jobs: ${reason}`,
      });
    }
  };

  const filterJobsByStatus = async (status: QueueJobStatus | null) => {
    if (!selectedQueue || status === jobsStatusFilter || pendingOperation) {
      return;
    }

    await fetchJobs(selectedQueue, 1, status, jobsSearchQuery);
  };

  const searchJobs = async (searchQuery: string) => {
    const query = searchQuery.trim();

    if (!selectedQueue || query === jobsSearchQuery || pendingOperation) {
      return;
    }

    await fetchJobs(selectedQueue, 1, jobsStatusFilter, query);
  };

  const showPreviousJobsPage = async () => {
    if (!selectedQueue || jobsPage <= 1 || pendingOperation) {
      return;
    }
    await fetchJobs(
      selectedQueue,
      jobsPage - 1,
      jobsStatusFilter,
      jobsSearchQuery,
    );
  };

  const showNextJobsPage = async () => {
    if (!selectedQueue || !hasNextJobsPage || pendingOperation) {
      return;
    }
    await fetchJobs(
      selectedQueue,
      jobsPage + 1,
      jobsStatusFilter,
      jobsSearchQuery,
    );
  };

  const showQueues = () => {
    dispatch({ type: "showQueues" });
    void fetchQueues();
  };

  const openJobDetails = async (jobId: string) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobDetailsLoading", jobId });

    try {
      const details = await redisConnection.getQueueJobDetails(queue, jobId);
      dispatch({ type: "jobDetailsLoaded", jobId, details });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobDetailsFailed",
        jobId,
        message: `Could not fetch job details: ${reason}`,
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    dispatch({ type: "jobDeleteStarted", jobId });

    try {
      await redisConnection.removeQueueJob(selectedQueue, jobId);
      dispatch({ type: "jobDeleted", jobId });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobDeleteFailed",
        jobId,
        message: `Could not delete job: ${reason}`,
      });
    }
  };

  const retryJob = async (jobId: string) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobRetryStarted", jobId });

    try {
      await redisConnection.retryQueueJob(queue, jobId);
      const result = await getCurrentJobs(queue);
      dispatch({ type: "jobRetried", queue, jobId, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobRetryFailed",
        jobId,
        message: `Could not retry job: ${reason}`,
      });
    }
  };

  const addJob = async () => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const name = newJobName.trim();

    if (!name) {
      dispatch({ type: "jobAddFailed", message: "Enter a job name." });
      return;
    }

    let data: unknown;

    try {
      data = JSON.parse(newJobData);
    } catch {
      dispatch({
        type: "jobAddFailed",
        message: "Job data must be valid JSON.",
      });
      return;
    }

    dispatch({ type: "jobAddStarted" });

    try {
      const job = await redisConnection.addQueueJob(selectedQueue, name, data);
      dispatch({ type: "jobAdded", job });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobAddFailed",
        message: `Could not add job: ${reason}`,
      });
    }
  };

  const obliterateQueue = async () => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueObliterateStarted" });

    try {
      await redisConnection.obliterateQueue(queue);
      dispatch({ type: "queueObliterated", queue });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueObliterateFailed",
        message: `Could not obliterate queue: ${reason}`,
      });
    }
  };

  const drainQueue = async () => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueDrainStarted" });

    try {
      await redisConnection.drainQueue(queue);
      const result = await getCurrentJobs(queue);
      dispatch({ type: "queueDrained", queue, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueDrainFailed",
        message: `Could not empty queue: ${reason}`,
      });
    }
  };

  const retryJobs = async (state: RetryableJobState) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobsRetryStarted" });

    try {
      await redisConnection.retryJobs(queue, state);
      const result = await getCurrentJobs(queue);
      dispatch({ type: "jobsRetried", queue, state, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobsRetryFailed",
        message: `Could not retry ${state} jobs: ${reason}`,
      });
    }
  };

  const cleanJobs = async (
    status: CleanableJobStatus,
    graceMs: number,
    limit: number,
  ) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueCleanStarted" });

    try {
      const removedJobIds = await redisConnection.cleanQueueJobs(
        queue,
        graceMs,
        limit,
        status,
      );
      const [result, queueInfo] = await Promise.all([
        getCurrentJobs(queue),
        redisConnection.getQueueInfo(queue),
      ]);
      dispatch({
        type: "queueCleaned",
        queue,
        status,
        removedCount: removedJobIds.length,
        result,
        queueInfo,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueCleanFailed",
        message: `Could not clean queue jobs: ${reason}`,
      });
    }
  };

  const setQueuePaused = async (queue: QueueRef, paused: boolean) => {
    if (pendingOperation) {
      return;
    }

    dispatch({ type: "queueStatusChangeStarted", queue });

    try {
      await redisConnection.setQueuePaused(queue, paused);
      const queueInfo = await redisConnection.getQueueInfo(queue);
      dispatch({
        type: "queueStatusChanged",
        queue,
        paused,
        queueInfo,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueStatusChangeFailed",
        queue,
        message: `Could not ${paused ? "pause" : "resume"} queue: ${reason}`,
      });
    }
  };

  const rateLimitQueue = async (durationMs: number) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueRateLimitStarted" });

    try {
      await redisConnection.rateLimitQueue(queue, durationMs);
      dispatch({ type: "queueRateLimited", queue, durationMs });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueRateLimitFailed",
        message: `Could not rate limit queue: ${reason}`,
      });
    }
  };

  const setQueueConcurrency = async (concurrency: number) => {
    if (!selectedQueue || pendingOperation) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueConcurrencySetStarted" });

    try {
      await redisConnection.setQueueConcurrency(queue, concurrency);
      const queueInfo = await redisConnection.getQueueInfo(queue);
      dispatch({
        type: "queueConcurrencySet",
        queue,
        concurrency,
        queueInfo,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueConcurrencySetFailed",
        message: `Could not set queue concurrency: ${reason}`,
      });
    }
  };

  const actions: QueueInspectActions = {
    setConnectionUrl: (value) =>
      dispatch({ type: "connectionUrlChanged", value }),
    setPollingInterval: (value) =>
      dispatch({ type: "pollingIntervalChanged", value }),
    connect,
    disconnect,
    fetchQueues,
    fetchJobs,
    filterJobsByStatus,
    searchJobs,
    showPreviousJobsPage,
    showNextJobsPage,
    showQueues,
    openJobDetails,
    closeJobDetails: () => dispatch({ type: "jobDetailsClosed" }),
    deleteJob,
    retryJob,
    openAddJob: () => dispatch({ type: "addJobScreenOpened" }),
    closeAddJob: () => dispatch({ type: "addJobScreenClosed" }),
    setNewJobName: (value) => dispatch({ type: "newJobNameChanged", value }),
    setNewJobData: (value) => dispatch({ type: "newJobDataChanged", value }),
    addJob,
    drainQueue,
    cleanJobs,
    retryJobs,
    setQueuePaused,
    setQueueConcurrency,
    rateLimitQueue,
    obliterateQueue,
  };

  return (
    <QueueInspectContext.Provider value={{ state, actions }}>
      {children}
    </QueueInspectContext.Provider>
  );
}

export function useQueueInspect() {
  const context = useContext(QueueInspectContext);

  if (!context) {
    throw new Error(
      "useQueueInspect must be used within QueueInspectProvider.",
    );
  }

  return context;
}
