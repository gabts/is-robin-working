const cp = require("child_process");

/**
 * Set date as the coming day.
 * @param {Date} date
 * @returns {Date}
 */
function addDay(date) {
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 * Whether date is saturday or sunday.
 * @param {Date} date
 * @returns {boolean}
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Whether two date objects refer to same date (year, month, day).
 * @param {Date} dateA
 * @param {Date} dateB
 * @returns {boolean}
 */
function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Whether a date is tomorrow from current date.
 * @param {Date} date
 * @returns {boolean}
 */
function isTomorrow(date) {
  const tomorrow = addDay(new Date());
  return isSameDate(date, tomorrow);
}

const spawn = (cmd, args = [], opts = {}) =>
  new Promise((resolve, reject) => {
    let d = { stdout: "", stderr: "" };

    const proc = cp.spawn(cmd, args, opts);

    proc.stdout.on("data", (chunk) => (d.stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (d.stderr += chunk.toString()));

    proc.on("close", (code) => (code > 0 ? reject(d) : resolve(d)));
  });

function getDisplayName(event = {}) {
  const { username } = event.author || {};
  const { nickname } = event.member || {};

  return nickname || username || "No name available";
}

module.exports = {
  addDay,
  isWeekend,
  isTomorrow,
  spawn,
  getDisplayName,
};
