/**
 * Doctor availability helpers.
 *
 * `availableDays` is a list of weekday ints (0=Sun … 6=Sat) supplied by the
 * doctors API. When the field is missing we return false — the UI must never
 * claim availability it can't back up.
 */
export function isAvailableToday(availableDays?: number[]): boolean {
  if (!availableDays || availableDays.length === 0) return false;
  return availableDays.includes(new Date().getDay());
}
