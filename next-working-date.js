// remember first month is 0
const redDaysSpring2023 = [
  { month: 4, date: 18 },
  { month: 4, date: 19 },
  { month: 5, date: 6 },
  { month: 5, date: 23 },
];

const vacation = {
  start: new Date("2023-06-15T00:00:00.000Z"),
  ends: new Date("2023-07-17T23:59:59.999Z"),
};

/**
 *
 * @param {Date} d
 * @returns {boolean}
 */
function isWeekendOrRedDay(d) {
  const day = d.getDay();

  // is weekend
  if (day === 6 || day === 0) return true;

  // is vacation
  if (d >= vacation.start && d <= vacation.ends) return true;

  const month = d.getMonth();
  const date = d.getDate();

  return redDaysSpring2023.some(
    (redDate) => month === redDate.month && date === redDate.date
  );
}

/**
 *
 * @param {Date} date
 * @param {number} n
 */
function addDay(date, n) {
  date.setDate(date.getDate() + n);
}

/**
 *
 * @param {boolean} isWorkingToday
 * @returns {Date}
 */
function nextWorkingDate(isWorkingToday) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  addDay(date, 1);

  while (isWeekendOrRedDay(date)) {
    addDay(date, 1);
  }

  // if working today next working day is an off day so we need to add a day
  // again and make sure it is not red day or weekend
  if (isWorkingToday) {
    addDay(date, 1);
    while (isWeekendOrRedDay(date)) {
      addDay(date, 1);
    }
  }

  return date;
}

module.exports = { nextWorkingDate };
