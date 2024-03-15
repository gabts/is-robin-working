import * as cp from "child_process";
import type { Message } from "discord.js";

export * from "./emitter";

interface SpawnProcessData {
  stdout: string;
  stderr: string;
}

/**
 * Spawn some child process.
 */
export function spawn(
  cmd: string,
  args: string[] = [],
  opts: cp.SpawnOptionsWithoutStdio = {}
) {
  return new Promise<SpawnProcessData>(function (resolve, reject) {
    let data: SpawnProcessData = { stdout: "", stderr: "" };

    const proc = cp.spawn(cmd, args, opts);

    proc.stdout.on("data", (chunk) => (data.stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (data.stderr += chunk.toString()));

    proc.on("error", (error) => {
      console.error(error);
    });

    proc.on("close", (code) =>
      code && code > 0 ? reject(data) : resolve(data)
    );
  });
}

/**
 * Get Discord user name.
 */
export function getDisplayName(event: Message) {
  const { username } = event.author || {};
  const { nickname } = event.member || {};

  return nickname || username || "No name available";
}
