import { spawn } from "child_process";
import { startServer } from "./express-server";

export const startStudioAndServer = async () => {
  await startServer();

  // An inherited PORT variable would make Remotion Studio bind that exact
  // port, which collides with the recording interface on SERVER_PORT.
  const env = { ...process.env };
  delete env.PORT;

  const bunxProcess = spawn("bun", ["x", "remotion", "studio"], {
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : undefined,
    detached: false,
    env,
  });

  // Forces the process to crash in case of error
  process.on("uncaughtException", (e) => {
    console.error(e);
    bunxProcess.kill();
  });
};
