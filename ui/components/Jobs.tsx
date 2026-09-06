import { useState } from "react";
import { useQueueInspect } from "../provider";
import {
  JobResults,
  JobsFeedback,
  JobsPagination,
  JobSearch,
} from "./JobsList";
import { JobsToolbar } from "./JobsToolbar";
import { JobDetailsModal } from "./JobDetailsModal";

export function Jobs() {
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isQueueOptionsOpen, setIsQueueOptionsOpen] = useState(false);
  const [isQueueInfoOpen, setIsQueueInfoOpen] = useState(false);
  const {
    state: { selectedQueue },
  } = useQueueInspect();

  if (!selectedQueue) return null;

  const closeMenus = () => {
    setIsStatusFilterOpen(false);
    setIsQueueOptionsOpen(false);
    setIsQueueInfoOpen(false);
  };

  return (
    <box
      width="100%"
      height="100%"
      minHeight={0}
      flexGrow={1}
      flexShrink={1}
      overflow="hidden"
      position="relative"
      padding={2}
      flexDirection="column"
      gap={1}
    >
      <JobsToolbar
        isStatusFilterOpen={isStatusFilterOpen}
        isQueueOptionsOpen={isQueueOptionsOpen}
        isQueueInfoOpen={isQueueInfoOpen}
        setIsStatusFilterOpen={setIsStatusFilterOpen}
        setIsQueueOptionsOpen={setIsQueueOptionsOpen}
        setIsQueueInfoOpen={setIsQueueInfoOpen}
      />
      <JobSearch />
      <JobResults onSelectJob={closeMenus} />
      <JobsPagination />
      <JobsFeedback />
      <JobDetailsModal />
    </box>
  );
}
