import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BlinkingCircle } from "./BlinkingCircle";
import { Logo } from "./Logo";
import type { RecordingStatus } from "./RecordButton";
import { RecordButton } from "./RecordButton";
import { Timer } from "./Timer";
import { fetchProjectFolders } from "./actions/fetch-project-folders";
import { NewFolderDialog } from "./components/NewFolderDialog";
import { ProcessStatus, ProcessingStatus } from "./components/ProcessingStatus";
import { SelectedFolder } from "./components/SelectedFolder";
import { UseThisTake } from "./components/UseThisTake";
import { Button } from "./components/ui/button";
import { loadFolderFromUrl, persistSelectedFolder } from "./helpers/get-folders";

// Each new session defaults to a fresh folder so every video
// becomes its own composition. The folder is only created on
// disk once the first take is saved into it.
const nextFreeVideoFolder = (folders: string[]) => {
  let i = 1;
  while (folders.includes(`video-${i}`)) {
    i++;
  }
  return `video-${i}`;
};

const topBarContainer: React.CSSProperties = {
  display: "flex",
  gap: 10,
  margin: 10,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
};

const recordWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
};

export const TopBar: React.FC<{
  recordingStatus: RecordingStatus;
  setRecordingStatus: React.Dispatch<React.SetStateAction<RecordingStatus>>;
  showAllViews: boolean;
}> = ({ recordingStatus, setRecordingStatus, showAllViews }) => {
  const [folders, setFolders] = useState<string[] | null>(null);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessStatus | null>(null);

  const folderFromUrl: string | null = useMemo(() => {
    return loadFolderFromUrl();
  }, []);

  const [preferredSelectedFolder, setSelectedFolder] = useState<string | null>(
    folderFromUrl,
  );

  const selectedFolder = useMemo(() => {
    if (preferredSelectedFolder) {
      return preferredSelectedFolder;
    }

    return folders ? nextFreeVideoFolder(folders) : null;
  }, [folders, preferredSelectedFolder]);

  const refreshFoldersList = useCallback(async () => {
    const json = await fetchProjectFolders();
    setFolders(json.folders);
  }, []);

  useEffect(() => {
    if (!window.remotionServerEnabled) {
      return;
    }

    // Also refreshes after a take was saved, so a freshly created
    // folder loses its "(new)" label in the dropdown.
    refreshFoldersList();
  }, [refreshFoldersList, processingStatus]);

  useEffect(() => {
    if (!window.remotionServerEnabled) {
      return;
    }

    persistSelectedFolder(selectedFolder ?? "");
  }, [selectedFolder]);

  return (
    <div style={topBarContainer}>
      <Logo></Logo>
      <div style={recordWrapper}>
        <RecordButton
          recordingStatus={recordingStatus}
          processingStatus={processingStatus}
          setRecordingStatus={setRecordingStatus}
          showAllViews={showAllViews}
        />
        {recordingStatus.type === "recording" ? (
          <>
            <BlinkingCircle />
            <Timer startDate={recordingStatus.ongoing.startDate} />
          </>
        ) : null}
        {recordingStatus.type === "recording-finished" ? (
          <UseThisTake
            selectedFolder={selectedFolder}
            recordingStatus={recordingStatus}
            setRecordingStatus={setRecordingStatus}
            setStatus={setProcessingStatus}
          />
        ) : null}
        {processingStatus && (
          <ProcessingStatus status={processingStatus}></ProcessingStatus>
        )}
      </div>

      <div style={{ flex: 1 }} />
      {folders ? (
        <>
          <SelectedFolder
            folders={folders}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
          />
          <NewFolderDialog
            refreshFoldersList={refreshFoldersList}
            setSelectedFolder={setSelectedFolder}
          />
        </>
      ) : null}
      {window.remotionServerEnabled ? (
        <Button asChild variant="outline">
          <a href={`http://localhost:3000/${selectedFolder}`} target="_blank">
            Go to Studio
          </a>
        </Button>
      ) : null}
    </div>
  );
};
