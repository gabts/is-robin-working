import * as cp from "child_process";
import type { Message } from "discord.js";

/**
 * Set date as the coming day.
 */
function addDay(date: Date): Date {
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 * Whether date is saturday or sunday.
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Whether two date objects refer to same date (year, month, day).
 */
function isSameDate(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Whether a date is tomorrow from current date.
 */
function isTomorrow(date: Date): boolean {
  const tomorrow = addDay(new Date());
  return isSameDate(date, tomorrow);
}

interface ProcessData {
  stdout: string;
  stderr: string;
}

/**
 * Spawn some child process.
 */
function spawn(
  cmd: string,
  args: string[] = [],
  opts: cp.SpawnOptionsWithoutStdio = {}
) {
  return new Promise<ProcessData>(function (resolve, reject) {
    let data: ProcessData = { stdout: "", stderr: "" };

    const proc = cp.spawn(cmd, args, opts);

    proc.stdout.on("data", (chunk) => (data.stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (data.stderr += chunk.toString()));

    proc.on("close", (code) =>
      code && code > 0 ? reject(data) : resolve(data)
    );
  });
}

/**
 * Get Discord user name.
 */
function getDisplayName(event: Message) {
  const { username } = event.author || {};
  const { nickname } = event.member || {};

  return nickname || username || "No name available";
}

export default {
  addDay,
  isWeekend,
  isTomorrow,
  spawn,
  getDisplayName,
};