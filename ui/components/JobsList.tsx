import { SyntaxStyle } from "@opentui/core";
import { useEffect, useState } from "react";
import type { QueueJobStatus, QueueJobSummary } from "../../server/index";
import { useTokai } from "../provider";

const statusColors: Record<QueueJobStatus, string> = {
  completed: "#4ADE80",
  failed: "#FB7185",
  delayed: "#FACC15",
  active: "#60A5FA",
  wait: "#C7D2E9",
  "waiting-children": "#A78BFA",
  prioritized: "#F472B6",
  repeat: "#2DD4BF",
};

const jsonSyntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: "#C7D2E9" },
  property: { fg: "#60A5FA" },
  string: { fg: "#4ADE80" },
  number: { fg: "#FACC15" },
  boolean: { fg: "#A78BFA" },
  null: { fg: "#94A3B8" },
  punctuation: { fg: "#8290AA" },
});

function formatJobData(data: unknown) {
  return JSON.stringify(data, null, 2) ?? "null";
}

export function JobSearch() {
  const [jobSearchInput, setJobSearchInput] = useState("");
  const {
    state: { jobsSearchQuery, isLoadingJobs },
    actions: { searchJobs },
  } = useTokai();

  useEffect(() => {
    const query = jobSearchInput.trim();

    if (query === jobsSearchQuery || isLoadingJobs) return;

    const timeout = setTimeout(() => void searchJobs(query), 300);
    return () => clearTimeout(timeout);
  }, [isLoadingJobs, jobSearchInput, jobsSearchQuery]);

  const clearSearch = () => {
    if (isLoadingJobs) return;
    setJobSearchInput("");
    void searchJobs("");
  };

  return (
    <box width="80%" height={3} alignSelf="center" flexDirection="row" gap={1}>
      <box
        height={3}
        minWidth={0}
        flexGrow={1}
        border
        borderColor="#3B82F6"
        paddingLeft={1}
        paddingRight={1}
      >
        <input
          value={jobSearchInput}
          placeholder="Search jobs by ID or name..."
          placeholderColor="#59677F"
          textColor="#F3F6FF"
          onInput={setJobSearchInput}
          onSubmit={() => void searchJobs(jobSearchInput)}
        />
      </box>
      {isLoadingJobs ? <text fg="#FACC15">Searching...</text> : null}
      {jobSearchInput || jobsSearchQuery ? (
        <box
          width={8}
          height={3}
          backgroundColor="#253552"
          alignItems="center"
          justifyContent="center"
          onMouseDown={clearSearch}
        >
          <text fg={isLoadingJobs ? "#59677F" : "#C7D2E9"}>Clear</text>
        </box>
      ) : null}
    </box>
  );
}

type JobCardProps = {
  job: QueueJobSummary;
  index: number;
  onSelect: () => void;
};

function JobCard({ job, index, onSelect }: JobCardProps) {
  const {
    state: { deletingJobId, retryingJobId },
    actions: { deleteJob, retryJob, openJobDetails },
  } = useTokai();
  const json = formatJobData(job.data);
  const jsonHeight = json.split("\n").length;
  const isDeleting = deletingJobId === job.id;
  const isRetrying = retryingJobId === job.id;
  const canRetry = job.status === "failed" || job.status === "completed";

  const selectJob = () => {
    onSelect();
    void openJobDetails(job.id);
  };

  return (
    <box
      key={`${job.status}:${job.id}:${index}`}
      width="100%"
      height={jsonHeight + 6}
      flexShrink={0}
      border
      borderColor="#253552"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      onMouseDown={selectJob}
    >
      <box
        width="100%"
        height={3}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <box flexDirection="row" gap={2}>
          <text fg="#8290AA">ID: {job.id}</text>
          <text fg="#F3F6FF">Name: {job.name}</text>
        </box>
        <box flexDirection="row" alignItems="center" gap={2}>
          <text fg={statusColors[job.status]}>Status: {job.status}</text>
          <box
            width={5}
            height={3}
            border
            borderColor={canRetry ? "#2563EB" : "#253552"}
            alignItems="center"
            justifyContent="center"
            onMouseDown={(event) => {
              event.stopPropagation();
              if (canRetry) void retryJob(job.id);
            }}
          >
            <text fg={canRetry ? "#60A5FA" : "#59677F"}>
              {isRetrying ? "◌" : "↻"}
            </text>
          </box>
          <box
            width={14}
            height={3}
            border
            borderColor="#DC2626"
            alignItems="center"
            justifyContent="center"
            onMouseDown={(event) => {
              event.stopPropagation();
              void deleteJob(job.id);
            }}
          >
            <text fg="#FB7185">{isDeleting ? "Deleting..." : "Delete"}</text>
          </box>
        </box>
      </box>
      <code
        width="100%"
        height={jsonHeight}
        content={json}
        filetype="json"
        syntaxStyle={jsonSyntaxStyle}
        baseHighlight="default"
        drawUnstyledText
      />
    </box>
  );
}

function EmptyJobs() {
  const {
    state: { jobsSearchQuery },
  } = useTokai();

  return (
    <text fg="#8290AA">
      {jobsSearchQuery
        ? `No jobs match "${jobsSearchQuery}".`
        : "No jobs found on this page."}
    </text>
  );
}

export function JobResults({ onSelectJob }: { onSelectJob: () => void }) {
  const {
    state: { jobs, isLoadingJobs },
  } = useTokai();

  if (isLoadingJobs && jobs.length === 0) {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center">
        <text fg="#FACC15">◌ Loading jobs...</text>
      </box>
    );
  }

  if (jobs.length === 0) return <EmptyJobs />;

  return (
    <scrollbox
      width="80%"
      height="100%"
      minHeight={0}
      flexGrow={1}
      flexShrink={1}
      alignSelf="center"
      focused
      scrollY
      contentOptions={{ flexDirection: "column", gap: 1 }}
    >
      {jobs.map((job, index) => (
        <JobCard
          key={`${job.status}:${job.id}:${index}`}
          job={job}
          index={index}
          onSelect={onSelectJob}
        />
      ))}
    </scrollbox>
  );
}

export function JobsPagination() {
  const {
    state: { jobsPage, hasNextJobsPage, isLoadingJobs },
    actions: { showPreviousJobsPage, showNextJobsPage },
  } = useTokai();
  const canShowPreviousPage = jobsPage > 1 && !isLoadingJobs;
  const canShowNextPage = hasNextJobsPage && !isLoadingJobs;

  return (
    <box
      width="80%"
      alignSelf="center"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <box
        width={14}
        height={3}
        border
        borderColor={canShowPreviousPage ? "#3B82F6" : "#253552"}
        alignItems="center"
        justifyContent="center"
        onMouseDown={showPreviousJobsPage}
      >
        <text fg={canShowPreviousPage ? "#FFFFFF" : "#59677F"}>← Previous</text>
      </box>
      <box width={10} height={3} alignItems="center" justifyContent="center">
        <text fg="#8EA2C9">Page {jobsPage}</text>
      </box>
      <box
        width={14}
        height={3}
        border
        borderColor={canShowNextPage ? "#3B82F6" : "#253552"}
        alignItems="center"
        justifyContent="center"
        onMouseDown={showNextJobsPage}
      >
        <text fg={canShowNextPage ? "#FFFFFF" : "#59677F"}>Next →</text>
      </box>
    </box>
  );
}

function isSuccessMessage(message: string) {
  return [
    "Deleted ",
    "Added ",
    "Cleaned ",
    "Emptied ",
    "Retried ",
    "Paused ",
    "Resumed ",
    "Set concurrency ",
    "Rate limited ",
  ].some((prefix) => message.startsWith(prefix));
}

export function JobsFeedback() {
  const {
    state: { isLoadingJobs, jobsMessage },
  } = useTokai();

  if (isLoadingJobs || !jobsMessage) return null;

  return (
    <text fg={isSuccessMessage(jobsMessage) ? "#4ADE80" : "#FB7185"}>
      {jobsMessage}
    </text>
  );
}
