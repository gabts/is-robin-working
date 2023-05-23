import * as utils from "../../utils";

// remember first month is 0
const holidays2023 = [
  { month: 4, date: 18 },
  { month: 4, date: 19 },
  { month: 5, date: 6 },
  { month: 5, date: 23 },
  // TODO: add autumn and winter 2023 when available
];

const vacation = {
  start: new Date("2023-06-15T00:00:00.000Z"),
  ends: new Date("2023-07-17T23:59:59.999Z"),
};

/**
 * Whether given date is weekend, vacation or a holiday.
 */
export function isWeekendOrVacationOrHoliday(d: Date): boolean {
  // is on vacation
  if (d >= vacation.start && d <= vacation.ends) return true;

  if (utils.isWeekend(d)) return true;

  const month = d.getMonth();
  const date = d.getDate();

  return holidays2023.some(
    (holiday) => month === holiday.month && date === holiday.date
  );
}

/**
 * Gets next working date from today.
 */
export function nextWorkingDate(isWorkingToday: boolean): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  utils.addDay(date);

  while (isWeekendOrVacationOrHoliday(date)) {
    utils.addDay(date);
  }

  // if working today next working day is an off day so we need to add a day
  // again and make sure it is not red day or weekend
  if (isWorkingToday) {
    utils.addDay(date);
    while (isWeekendOrVacationOrHoliday(date)) {
      utils.addDay(date);
    }
  }

  return date;
}
