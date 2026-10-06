// The school day ends at 20:00. After that the app already looks at the next
// school day, and after Friday 20:00 (or on the weekend) at Monday of the next
// week, i.e. the next turnus. The school day starts at 7:55.
const DAY_END_HOUR = 20;
const DAY_START_HOUR = 7;
const DAY_START_MINUTE = 55;

function startOfNextDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

// The school day the app should be showing for the given moment.
export function getScheduleDate(now = new Date()) {
  let date = new Date(now);
  if (date.getHours() >= DAY_END_HOUR) date = startOfNextDay(date);
  while (date.getDay() === 0 || date.getDay() === 6) date = startOfNextDay(date);
  return date;
}

// True outside school hours (20:00 - 7:55, or on the weekend): the "current"
// marker then sits on the day header of the school day being shown.
export function isOutsideSchoolDay(now = new Date()) {
  const day = now.getDay();
  const hour = now.getHours();
  const beforeStart = hour < DAY_START_HOUR ||
    (hour === DAY_START_HOUR && now.getMinutes() < DAY_START_MINUTE);
  return hour >= DAY_END_HOUR || beforeStart || day === 0 || day === 6;
}

// ISO 8601 week number of a local calendar date.
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// true = PLAVI (odd week), false = CRVENI (even week)
export function getCurrentTurnus(now = new Date()) {
  return getWeekNumber(getScheduleDate(now)) % 2 != 0;
}

// Day column of the "current" marker: 1 = Monday ... 5 = Friday
export function getScheduleDay(now = new Date()) {
  return getScheduleDate(now).getDay();
}
