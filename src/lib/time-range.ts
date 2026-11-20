/**
 * Time ranges for bookings.
 *
 * A range is half-open: [start, end). The start instant belongs to the range,
 * the end instant does not. That makes back-to-back bookings (one ends at 10:00,
 * the next starts at 10:00) legal, and means two ranges overlap exactly when
 * each one starts before the other ends.
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

export class InvalidTimeRangeError extends Error {
  override name = "InvalidTimeRangeError";
}

// ISO 8601 date-time that carries an explicit offset ("Z" or "+05:30").
// A string without one would be read in whatever timezone the server happens
// to run in, so a 9:00 booking could silently become 9:00 UTC.
const ISO_WITH_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-](\d{2}):(\d{2}))$/;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseInstant(value: string, label: string): Date {
  const match = ISO_WITH_OFFSET.exec(value);
  if (!match) {
    throw new InvalidTimeRangeError(
      `${label} must be an ISO 8601 date-time with a timezone offset, got "${value}"`,
    );
  }
  // `new Date()` quietly rolls impossible dates forward (Feb 30 becomes Mar 2),
  // so check each field ourselves before handing the string over.
  const fields = match.slice(1).map((part) => (part === undefined ? 0 : Number(part)));
  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = fields;
  const [offH = 0, offM = 0] = fields.slice(6);
  const valid =
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month) &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offH <= 23 &&
    offM <= 59;
  if (!valid) {
    throw new InvalidTimeRangeError(`${label} is not a real date-time: "${value}"`);
  }
  return new Date(value);
}

/** Parse and validate a range from two ISO strings (e.g. from a form or API body). */
export function parseTimeRange(start: string, end: string): TimeRange {
  const range = { start: parseInstant(start, "start"), end: parseInstant(end, "end") };
  if (range.end.getTime() <= range.start.getTime()) {
    throw new InvalidTimeRangeError("end must be after start");
  }
  return range;
}

/** True when the two half-open ranges share at least one instant. */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/** Length of a range in whole minutes. */
export function durationMinutes(range: TimeRange): number {
  return Math.floor((range.end.getTime() - range.start.getTime()) / 60_000);
}
