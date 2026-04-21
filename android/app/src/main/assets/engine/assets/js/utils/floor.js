/**
 * Floor / map_no utilities.
 *
 * A single source of truth for the room-id <-> floor mapping used across the
 * engine (Engine.js, Suggestion-index.js, ...). Before this module these
 * ranges (1..114 ground, 115..204 second, 205..302 first, 303+ backyard) were
 * hard-coded in ~a dozen places, which made the "show the starting floor on
 * shared links" fix error-prone. Change the mapping here and every consumer
 * stays in sync.
 *
 * Exports:
 *   - FLOORS          ordered descriptors (detection + iteration bounds + label)
 *   - floorForRoom    room id -> "0" | "1" | "2" | "3" | null
 *   - detectFinalFloor room id -> [label, mapNo] with Ground as fallback
 *                     (preserves legacy detectfinalFloor contract)
 *   - isOnFloor       boolean: is this room id on the given map_no?
 *   - floorBounds     map_no -> { first, last } loop bounds for room iteration
 *   - isValidRoomId   guard matching the engine's null/undefined/"null" checks
 */

// Descriptors are ordered so `FLOORS.find(...)` returns a deterministic result
// for any integer. `detectMin`/`detectMax` are the *classification* range
// (what floor does a given room id belong to); `firstRoom`/`lastRoom` are the
// concrete iteration bounds used when walking every room on a floor (the
// backyard stops at 321 rather than Infinity).
export const FLOORS = [
  {
    mapNo: "0",
    label: "Ground",
    detectMin: -Infinity,
    detectMax: 114,
    firstRoom: 1,
    lastRoom: 114,
  },
  {
    mapNo: "2",
    label: "Second",
    detectMin: 115,
    detectMax: 204,
    firstRoom: 115,
    lastRoom: 204,
  },
  {
    mapNo: "1",
    label: "First",
    detectMin: 205,
    detectMax: 302,
    firstRoom: 205,
    lastRoom: 302,
  },
  {
    mapNo: "3",
    label: "Back",
    detectMin: 303,
    detectMax: Infinity,
    firstRoom: 303,
    lastRoom: 321,
  },
];

const toNumber = (value) => {
  const n = Number.parseInt(value);
  return Number.isNaN(n) ? null : n;
};

const findFloor = (value) => {
  const n = toNumber(value);
  if (n == null) return null;
  return (
    FLOORS.find((floor) => n >= floor.detectMin && n <= floor.detectMax) ||
    null
  );
};

export const floorForRoom = (value) => findFloor(value)?.mapNo ?? null;

// Legacy detectfinalFloor always returned ["Ground", "0"] for unknown input
// (null / undefined / "undefined"), so downstream code could blindly index [0]
// / [1]. Keep that contract.
export const detectFinalFloor = (value) => {
  const floor = findFloor(value);
  return floor ? [floor.label, floor.mapNo] : ["Ground", "0"];
};

export const isOnFloor = (value, mapNo) => {
  const floor = floorForRoom(value);
  return floor != null && floor === String(mapNo);
};

export const floorBounds = (mapNo) => {
  const floor = FLOORS.find((f) => f.mapNo === String(mapNo));
  return floor ? { first: floor.firstRoom, last: floor.lastRoom } : null;
};

export const isValidRoomId = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  value !== "null" &&
  value !== "undefined";
