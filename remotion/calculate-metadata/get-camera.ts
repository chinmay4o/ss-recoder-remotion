import { StaticFile, getStaticFiles } from "remotion";
import {
  ALTERNATIVE1_PREFIX,
  ALTERNATIVE2_PREFIX,
  CAPTIONS_PREFIX,
  DISPLAY_PREFIX,
  WEBCAM_PREFIX,
} from "../../config/cameras";
import {
  Cameras,
  defaultVideoScene,
  SelectableScene,
} from "../../config/scenes";

type CamerasAndScene = {
  scene: SelectableScene;
  cameras: Cameras | null;
};

const findMatchingFile = ({
  files,
  compositionId,
  prefix,
  timestamp,
}: {
  files: StaticFile[];
  compositionId: string;
  prefix: string;
  timestamp: string;
}): StaticFile | null => {
  const sub = files.find((_f) =>
    _f.name.startsWith(`${compositionId}/${prefix}${timestamp}.`),
  );

  return sub ?? null;
};

const mapFile = ({
  file,
  files,
  compositionId,
}: {
  file: StaticFile;
  files: StaticFile[];
  compositionId: string;
}): Cameras | null => {
  if (!file.name.startsWith(`${compositionId}/${WEBCAM_PREFIX}`)) {
    return null;
  }

  const timestamp = file.name
    // compositionId is case sensitive:
    // Need to replace it first before calling .toLowerCase()
    .replace(`${compositionId}/${WEBCAM_PREFIX}`, "")
    .toLowerCase()
    .replace(".webm", "")
    .replace(".mov", "")
    .replace(".mkv", "")
    .replace(".mp4", "");

  const display = findMatchingFile({
    files,
    compositionId,
    prefix: DISPLAY_PREFIX,
    timestamp,
  });
  const sub = findMatchingFile({
    files,
    compositionId,
    prefix: CAPTIONS_PREFIX,
    timestamp,
  });
  const alternative1 = findMatchingFile({
    files,
    compositionId,
    prefix: ALTERNATIVE1_PREFIX,
    timestamp,
  });
  const alternative2 = findMatchingFile({
    compositionId,
    files,
    prefix: ALTERNATIVE2_PREFIX,
    timestamp,
  });

  return {
    webcam: file,
    display: display ?? null,
    captions: sub ?? null,
    alternative1: alternative1 ?? null,
    alternative2: alternative2 ?? null,
    timestamp: parseInt(timestamp, 10),
  };
};

const getCameras = (compositionId: string) => {
  const files = getStaticFiles().filter((f) =>
    f.name.startsWith(compositionId),
  );

  const mappedCameras = files
    .map((f) => mapFile({ file: f, files, compositionId }))
    .filter(Boolean) as Cameras[];

  return mappedCameras.sort((a, b) => a.timestamp - b.timestamp);
};

// Make the amount of video scenes match the amount of recordings:
// extra recordings get a generated scene, video scenes without a
// recording are dropped (unless there are no recordings at all, in
// which case one placeholder is kept as feedback).
const autoFitScenesToRecordings = (
  scenes: SelectableScene[],
  recordingCount: number,
): SelectableScene[] => {
  if (recordingCount === 0) {
    return scenes;
  }

  const videoSceneIndices = scenes
    .map((scene, i) => (scene.type === "videoscene" ? i : -1))
    .filter((i) => i !== -1);

  if (videoSceneIndices.length === recordingCount) {
    return scenes;
  }

  if (videoSceneIndices.length > recordingCount) {
    const toDrop = new Set(
      videoSceneIndices.slice(recordingCount - videoSceneIndices.length),
    );
    return scenes.filter((_, i) => !toDrop.has(i));
  }

  const template =
    videoSceneIndices.length > 0
      ? (scenes[
          videoSceneIndices[videoSceneIndices.length - 1] as number
        ] as SelectableScene)
      : defaultVideoScene;
  const extra = Array.from(
    { length: recordingCount - videoSceneIndices.length },
    () => ({ ...template }),
  );

  const insertAt =
    videoSceneIndices.length > 0
      ? (videoSceneIndices[videoSceneIndices.length - 1] as number) + 1
      : scenes.length;

  return [...scenes.slice(0, insertAt), ...extra, ...scenes.slice(insertAt)];
};

export const getAllCameras = ({
  compositionId,
  scenes,
}: {
  compositionId: string;
  scenes: SelectableScene[];
}) => {
  const allCameras = getCameras(compositionId);
  const fittedScenes = autoFitScenesToRecordings(scenes, allCameras.length);
  let videoIndex = -1;

  const scenesWithCameras = fittedScenes.map((scene): CamerasAndScene => {
    if (scene.type !== "videoscene") {
      return { cameras: null, scene };
    }

    videoIndex += 1;
    return { scene, cameras: allCameras[videoIndex] as Cameras };
  });

  const hasAtLeast1Camera = allCameras.length > 0;

  return { scenesWithCameras, hasAtLeast1Camera };
};
