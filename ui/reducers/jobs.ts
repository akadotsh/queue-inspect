import type { AppAction, AppState } from "../state";
import { isSameQueue, jobMatchesSearch, jobsPageState } from "./helpers";

function isCurrentJobsRequest(
  state: AppState,
  action: Extract<AppAction, { type: "jobsLoaded" | "jobsRefreshed" }>,
) {
  return (
    isSameQueue(state.selectedQueue, action.queue) &&
    state.jobsPage === action.result.page &&
    state.jobsStatusFilter === action.result.status &&
    state.jobsSearchQuery === action.result.searchQuery
  );
}

function reduceJobListState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "jobsLoading": {
      const sameQueue = isSameQueue(state.selectedQueue, action.queue);
      return {
        ...state,
        selectedQueue: action.queue,
        jobs: sameQueue ? state.jobs : [],
        jobsPage: action.page,
        jobsTotal: sameQueue ? state.jobsTotal : 0,
        hasNextJobsPage: false,
        jobsStatusFilter: action.status,
        jobsSearchQuery: action.searchQuery,
        jobsMessage: "",
        pendingOperation: { type: "jobs" },
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
      };
    }
    case "jobsLoaded":
      if (!isCurrentJobsRequest(state, action)) return state;
      return {
        ...state,
        ...jobsPageState(action.result),
        pendingOperation: null,
      };
    case "jobsRefreshed":
      if (!isCurrentJobsRequest(state, action)) return state;
      return {
        ...state,
        ...jobsPageState(action.result),
      };
    case "jobsFailed":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.jobsPage !== action.page ||
        state.jobsStatusFilter !== action.status ||
        state.jobsSearchQuery !== action.searchQuery
      ) {
        return state;
      }
      return {
        ...state,
        jobs: [],
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsMessage: action.message,
        pendingOperation: null,
      };
    default:
      return state;
  }
}

function reduceJobMutationState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "jobDeleteStarted":
      return {
        ...state,
        pendingOperation: { type: "deleteJob", jobId: action.jobId },
        jobsMessage: "",
      };
    case "jobDeleted":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.jobId),
        jobsTotal: Math.max(0, state.jobsTotal - 1),
        pendingOperation: null,
        selectedJobId: null,
        selectedJobDetails: null,
        jobDetailsMessage: "",
        jobsMessage: `Deleted job "${action.jobId}".`,
      };
    case "jobDeleteFailed":
      if (
        state.pendingOperation?.type !== "deleteJob" ||
        state.pendingOperation.jobId !== action.jobId
      ) {
        return state;
      }
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    case "jobRetryStarted":
      return {
        ...state,
        pendingOperation: { type: "retryJob", jobId: action.jobId },
        jobsMessage: "",
      };
    case "jobRetried":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.pendingOperation?.type !== "retryJob" ||
        state.pendingOperation.jobId !== action.jobId
      ) {
        return state;
      }
      return {
        ...state,
        ...jobsPageState(action.result),
        pendingOperation: null,
        jobsMessage: `Retried job "${action.jobId}".`,
      };
    case "jobRetryFailed":
      if (
        state.pendingOperation?.type !== "retryJob" ||
        state.pendingOperation.jobId !== action.jobId
      ) {
        return state;
      }
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    default:
      return state;
  }
}

function reduceJobDetailsState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "jobDetailsLoading":
      return {
        ...state,
        selectedJobId: action.jobId,
        selectedJobDetails: null,
        pendingOperation: { type: "jobDetails", jobId: action.jobId },
        jobDetailsMessage: "",
      };
    case "jobDetailsLoaded":
      if (state.selectedJobId !== action.jobId) return state;
      return {
        ...state,
        selectedJobDetails: action.details,
        pendingOperation: null,
      };
    case "jobDetailsFailed":
      if (state.selectedJobId !== action.jobId) return state;
      return {
        ...state,
        pendingOperation: null,
        jobDetailsMessage: action.message,
      };
    case "jobDetailsClosed":
      return {
        ...state,
        selectedJobId: null,
        selectedJobDetails: null,
        pendingOperation: null,
        jobDetailsMessage: "",
      };
    default:
      return state;
  }
}

function reduceAddJobState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "addJobScreenOpened":
      return {
        ...state,
        isAddJobScreenOpen: true,
        newJobName: "",
        newJobData: "{}",
        jobsMessage: "",
      };
    case "addJobScreenClosed":
      if (state.pendingOperation?.type === "addJob") return state;
      return {
        ...state,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        jobsMessage: "",
      };
    case "newJobNameChanged":
      return { ...state, newJobName: action.value, jobsMessage: "" };
    case "newJobDataChanged":
      return { ...state, newJobData: action.value, jobsMessage: "" };
    case "jobAddStarted":
      return {
        ...state,
        pendingOperation: { type: "addJob" },
        jobsMessage: "",
      };
    case "jobAdded": {
      const matchesCurrentView =
        (state.jobsStatusFilter === null ||
          state.jobsStatusFilter === action.job.status) &&
        jobMatchesSearch(action.job, state.jobsSearchQuery);
      return {
        ...state,
        jobsTotal: matchesCurrentView ? state.jobsTotal + 1 : state.jobsTotal,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        pendingOperation: null,
        jobsMessage: `Added job "${action.job.name}".`,
      };
    }
    case "jobAddFailed":
      return { ...state, pendingOperation: null, jobsMessage: action.message };
    default:
      return state;
  }
}

export function reduceJobState(state: AppState, action: AppAction): AppState {
  return reduceAddJobState(
    reduceJobDetailsState(
      reduceJobMutationState(reduceJobListState(state, action), action),
      action,
    ),
    action,
  );
}
