import { watchPublicFolder } from "@remotion/studio";
import { useEffect, useState } from "react";
import {
  Composition,
  getRemotionEnvironment,
  getStaticFiles,
} from "remotion";
import { WEBCAM_PREFIX } from "../config/cameras";
import { defaultVideoScene, videoConf } from "../config/scenes";
import { GoToRecorder } from "./GoToRecorder";
import { Main } from "./Main";
import { calcMetadata } from "./calculate-metadata/calc-metadata";

// Compositions that are explicitly defined below and should not
// also be generated from the public folder.
const EXPLICIT_COMPOSITION_IDS = ["welcome", "record", "empty"];

// Every folder in public/ that contains at least one recording
// automatically becomes a composition - one folder per video.
const deriveProjectFolders = (): string[] => {
  const folders = new Set<string>();
  for (const file of getStaticFiles()) {
    const [folder, rest] = file.name.split("/");
    if (folder && rest && rest.startsWith(WEBCAM_PREFIX)) {
      folders.add(folder);
    }
  }
  return [...folders]
    .filter((folder) => !EXPLICIT_COMPOSITION_IDS.includes(folder))
    .sort();
};

export const RemotionRoot = () => {
  const [projectFolders, setProjectFolders] = useState(deriveProjectFolders);

  useEffect(() => {
    if (!getRemotionEnvironment().isStudio) {
      return;
    }

    const { cancel } = watchPublicFolder(() => {
      setProjectFolders(deriveProjectFolders());
    });

    return () => {
      cancel();
    };
  }, []);

  return (
    <>
      {projectFolders.map((folder) => (
        <Composition
          key={folder}
          component={Main}
          id={folder}
          schema={videoConf}
          defaultProps={{
            theme: "light" as const,
            canvasLayout: "landscape" as const,
            platform: "youtube" as const,
            scenes: [defaultVideoScene],
            scenesAndMetadata: [],
          }}
          calculateMetadata={calcMetadata}
        />
      ))}
      <Composition
        component={Main}
        id="welcome"
        schema={videoConf}
        defaultProps={{
          theme: "light" as const,
          canvasLayout: "square" as const,
          scenes: [
            {
              type: "recorder" as const,
              durationInFrames: 80,
              music: "epic" as const,
              transitionToNextScene: true,
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              music: "previous" as const,
              transitionToNextScene: true,
              type: "endcard" as const,
              durationInFrames: 200,
              channel: "remotion" as const,
              links: [
                { link: "remotion.dev/recorder" },
                { link: "remotion.dev/discord" },
              ],
            },
          ],
          scenesAndMetadata: [],
          platform: "x" as const,
        }}
        calculateMetadata={calcMetadata}
      />
      <Composition
        component={GoToRecorder}
        id="record"
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={100}
      />
      <Composition
        component={Main}
        id="empty"
        schema={videoConf}
        defaultProps={{
          theme: "light" as const,
          canvasLayout: "square" as const,
          platform: "youtube",
          scenes: [],
          scenesAndMetadata: [],
        }}
        calculateMetadata={calcMetadata}
      />
    </>
  );
};
