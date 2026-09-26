import type {
  QueueJobsPage,
  QueueJobSummary,
  QueueRef,
  QueueInfo,
} from "../../server/index";

export function jobsPageState(result: QueueJobsPage) {
  return {
    jobs: result.jobs,
    jobsPage: result.page,
    jobsTotal: result.total,
    hasNextJobsPage: result.hasNextPage,
  };
}

export function isSameQueue(
  left: QueueInfo | QueueRef | null,
  right: QueueRef,
) {
  return (
    left?.backend === "bullmq" &&
    left.name === right.name &&
    left.prefix === right.prefix
  );
}

export function jobMatchesSearch(job: QueueJobSummary, searchQuery: string) {
  const query = searchQuery.toLowerCase();
  return (
    !query ||
    job.id.toLowerCase().includes(query) ||
    job.name.toLowerCase().includes(query)
  );
}
