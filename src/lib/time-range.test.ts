import { describe, expect, it } from "vitest";

import {
  InvalidTimeRangeError,
  durationMinutes,
  parseTimeRange,
  rangesOverlap,
} from "./time-range";

const r = (start: string, end: string) => parseTimeRange(start, end);

describe("parseTimeRange", () => {
  it("accepts UTC and offset timestamps", () => {
    const range = r("2026-03-02T09:00:00Z", "2026-03-02T10:30:00+01:00");
    expect(range.start.toISOString()).toBe("2026-03-02T09:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-03-02T09:30:00.000Z");
  });

  it("rejects timestamps without a timezone offset", () => {
    expect(() => r("2026-03-02T09:00:00", "2026-03-02T10:00:00Z")).toThrow(
      InvalidTimeRangeError,
    );
    expect(() => r("2026-03-02", "2026-03-03")).toThrow(/timezone offset/);
  });

  it("rejects strings that match the shape but are not real dates", () => {
    // Plain `new Date()` would roll Feb 30 over to Mar 2 without complaint.
    for (const bad of [
      "2026-02-30T09:00:00Z",
      "2026-02-29T09:00:00Z", // 2026 is not a leap year
      "2026-13-01T09:00:00Z",
      "2026-04-31T09:00:00Z",
      "2026-03-02T24:00:00Z",
      "2026-03-02T09:60:00Z",
      "2026-03-02T09:00:00+25:00",
    ]) {
      expect(() => r(bad, "2027-01-01T00:00:00Z"), bad).toThrow(/not a real date-time/);
    }
  });

  it("accepts Feb 29 in a leap year", () => {
    const range = r("2028-02-29T09:00:00Z", "2028-02-29T10:00:00Z");
    expect(range.start.getUTCDate()).toBe(29);
  });

  it("rejects empty and reversed ranges", () => {
    expect(() => r("2026-03-02T10:00:00Z", "2026-03-02T10:00:00Z")).toThrow(
      "end must be after start",
    );
    expect(() => r("2026-03-02T11:00:00Z", "2026-03-02T10:00:00Z")).toThrow(
      "end must be after start",
    );
  });

  it("compares instants, not wall-clock text", () => {
    // 10:00 in New York (UTC-5) is 15:00 UTC, so this is a valid 1h range.
    const range = r("2026-03-02T10:00:00-05:00", "2026-03-02T16:00:00Z");
    expect(durationMinutes(range)).toBe(60);
  });
});

describe("rangesOverlap", () => {
  const nineToTen = r("2026-03-02T09:00:00Z", "2026-03-02T10:00:00Z");

  it("treats back-to-back ranges as not overlapping", () => {
    const tenToEleven = r("2026-03-02T10:00:00Z", "2026-03-02T11:00:00Z");
    expect(rangesOverlap(nineToTen, tenToEleven)).toBe(false);
    expect(rangesOverlap(tenToEleven, nineToTen)).toBe(false);
  });

  it("detects partial overlap from either side", () => {
    const nineThirtyToTenThirty = r("2026-03-02T09:30:00Z", "2026-03-02T10:30:00Z");
    expect(rangesOverlap(nineToTen, nineThirtyToTenThirty)).toBe(true);
    expect(rangesOverlap(nineThirtyToTenThirty, nineToTen)).toBe(true);
  });

  it("detects containment and identical ranges", () => {
    const inner = r("2026-03-02T09:15:00Z", "2026-03-02T09:45:00Z");
    expect(rangesOverlap(nineToTen, inner)).toBe(true);
    expect(rangesOverlap(inner, nineToTen)).toBe(true);
    expect(rangesOverlap(nineToTen, nineToTen)).toBe(true);
  });

  it("detects a one-minute overlap", () => {
    const late = r("2026-03-02T09:59:00Z", "2026-03-02T11:00:00Z");
    expect(rangesOverlap(nineToTen, late)).toBe(true);
  });

  it("handles ranges written in different offsets", () => {
    // 10:00+01:00 is 09:00Z, so this is the same slot as nineToTen.
    const sameSlot = r("2026-03-02T10:00:00+01:00", "2026-03-02T11:00:00+01:00");
    expect(rangesOverlap(nineToTen, sameSlot)).toBe(true);
    // 11:00+01:00 is 10:00Z: back-to-back, so no overlap.
    const nextSlot = r("2026-03-02T11:00:00+01:00", "2026-03-02T12:00:00+01:00");
    expect(rangesOverlap(nineToTen, nextSlot)).toBe(false);
  });
});

describe("durationMinutes", () => {
  it("counts real elapsed time across a DST change", () => {
    // US clocks spring forward on 2026-03-08 at 02:00 local: 01:00-05:00 EST->EDT
    // reads as a 4h span on the wall but is 3h of real time.
    const range = r("2026-03-08T01:00:00-05:00", "2026-03-08T05:00:00-04:00");
    expect(durationMinutes(range)).toBe(180);
  });
});
