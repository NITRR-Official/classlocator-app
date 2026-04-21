/**
 * Unit tests for utils/floor.js.
 *
 * Run from the workspace root:
 *   node android/app/src/main/assets/engine/assets/js/utils/floor.test.js
 *
 * Or open in a browser console by importing the module:
 *   import("./floor.test.js");
 *
 * Uses Node's built-in `node:test` runner + `node:assert/strict`. No
 * dependencies, no extra setup. The colocated package.json scopes
 * "type":"module" to this folder so Node parses both files as ESM.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FLOORS,
  floorForRoom,
  detectFinalFloor,
  isOnFloor,
  floorBounds,
  isValidRoomId,
} from "./floor.js";

// Each tuple: [room id input, expected mapNo, expected detectFinalFloor pair, human label]
// Covers every range boundary the user called out plus a representative
// interior value per floor and the negative / out-of-range edges.
const FLOOR_CASES = [
  [-100, "0", ["Ground", "0"], "negative interior -> Ground"],
  [0, "0", ["Ground", "0"], "zero -> Ground"],
  [1, "0", ["Ground", "0"], "first ground room"],
  [50, "0", ["Ground", "0"], "ground interior"],
  [114, "0", ["Ground", "0"], "last ground room"],
  [115, "2", ["Second", "2"], "first second-floor room"],
  [160, "2", ["Second", "2"], "second-floor interior"],
  [204, "2", ["Second", "2"], "last second-floor room"],
  [205, "1", ["First", "1"], "first first-floor room"],
  [250, "1", ["First", "1"], "first-floor interior"],
  [302, "1", ["First", "1"], "last first-floor room"],
  [303, "3", ["Back", "3"], "first backyard room"],
  [316, "3", ["Back", "3"], "backyard interior (the bug-report example)"],
  [321, "3", ["Back", "3"], "high backyard id"],
  [9999, "3", ["Back", "3"], "way past the highest known room"],
];

test("floorForRoom: every boundary maps to the right mapNo", () => {
  for (const [input, expected, , label] of FLOOR_CASES) {
    assert.equal(
      floorForRoom(input),
      expected,
      `floorForRoom(${input}) [${label}] expected "${expected}"`,
    );
  }
});

test("floorForRoom: accepts string ids the same as numeric ids", () => {
  for (const [input, expected, , label] of FLOOR_CASES) {
    assert.equal(
      floorForRoom(String(input)),
      expected,
      `floorForRoom("${input}") [${label}] expected "${expected}"`,
    );
  }
});

test("floorForRoom: returns null for unparseable / missing input", () => {
  // floorForRoomId in Engine.js (the helper this replaced) returned null
  // for non-numeric input so callers could guard with `!= null`. Preserve.
  for (const garbage of [null, undefined, "", "abc", "null", "undefined", NaN, {}, []]) {
    assert.equal(
      floorForRoom(garbage),
      null,
      `floorForRoom(${JSON.stringify(garbage)}) should be null`,
    );
  }
});

test("detectFinalFloor: every boundary returns [label, mapNo]", () => {
  for (const [input, , expectedPair, label] of FLOOR_CASES) {
    assert.deepEqual(
      detectFinalFloor(input),
      expectedPair,
      `detectFinalFloor(${input}) [${label}]`,
    );
  }
});

test("detectFinalFloor: falls back to ['Ground','0'] for missing input", () => {
  // The legacy detectfinalFloor in Engine.js fell through every else-if for
  // null/undefined and returned ["Ground","0"]. Downstream code does
  // detectFinalFloor(x)[0] / [1] without a null check, so this fallback is
  // load-bearing.
  for (const garbage of [null, undefined, "", "null", "undefined", "abc"]) {
    assert.deepEqual(
      detectFinalFloor(garbage),
      ["Ground", "0"],
      `detectFinalFloor(${JSON.stringify(garbage)}) should fall back to Ground`,
    );
  }
});

test("isOnFloor: matches floorForRoom for every (room, mapNo) pair", () => {
  const allMapNos = ["0", "1", "2", "3"];
  for (const [input, expectedMapNo, , label] of FLOOR_CASES) {
    for (const mapNo of allMapNos) {
      assert.equal(
        isOnFloor(input, mapNo),
        expectedMapNo === mapNo,
        `isOnFloor(${input}, "${mapNo}") [${label}]`,
      );
    }
  }
});

test("isOnFloor: handles number map_no the same as string", () => {
  // map_no in sessionStorage is always a string, but the engine compares it
  // with `==` in lots of places, so accept both shapes.
  assert.equal(isOnFloor(316, 3), true);
  assert.equal(isOnFloor(316, "3"), true);
  assert.equal(isOnFloor(50, 0), true);
  assert.equal(isOnFloor(50, "0"), true);
});

test("isOnFloor: false for unparseable inputs", () => {
  for (const garbage of [null, undefined, "abc", "", NaN]) {
    for (const mapNo of ["0", "1", "2", "3"]) {
      assert.equal(
        isOnFloor(garbage, mapNo),
        false,
        `isOnFloor(${JSON.stringify(garbage)}, "${mapNo}") should be false`,
      );
    }
  }
});

test("floorBounds: returns the iteration ranges removeDestinationAll relies on", () => {
  // These are the exact bounds the original `removeDestinationAll` hard-coded.
  // Backyard caps at 321 (NOT Infinity) because the iteration loop walks every
  // integer between firstRoom and lastRoom and the dataset stops there.
  assert.deepEqual(floorBounds("0"), { first: 1, last: 114 });
  assert.deepEqual(floorBounds("2"), { first: 115, last: 204 });
  assert.deepEqual(floorBounds("1"), { first: 205, last: 302 });
  assert.deepEqual(floorBounds("3"), { first: 303, last: 321 });
});

test("floorBounds: accepts numeric map_no, returns null for unknown", () => {
  assert.deepEqual(floorBounds(0), { first: 1, last: 114 });
  assert.deepEqual(floorBounds(3), { first: 303, last: 321 });
  assert.equal(floorBounds("5"), null);
  assert.equal(floorBounds(null), null);
  assert.equal(floorBounds(undefined), null);
});

test("isValidRoomId: matches the engine's null/undefined/'null'/'undefined' guard", () => {
  // Equivalent to Engine.js's local `isValidEnd`, plus an extra guard against
  // the empty string (which `sessionStorage.setItem(k, null)` can produce).
  for (const invalid of [null, undefined, "", "null", "undefined"]) {
    assert.equal(
      isValidRoomId(invalid),
      false,
      `isValidRoomId(${JSON.stringify(invalid)}) should be false`,
    );
  }
  for (const valid of ["1", "316", "0", 1, 316, 0]) {
    assert.equal(
      isValidRoomId(valid),
      true,
      `isValidRoomId(${JSON.stringify(valid)}) should be true`,
    );
  }
});

test("FLOORS: detection ranges are disjoint and cover the integer line", () => {
  // Catch the kind of regression where editing a boundary on one floor leaves
  // a one-off gap or overlap with another. We sample the boundary points and
  // ensure exactly one floor claims each.
  const boundaries = [-1000, -1, 0, 1, 113, 114, 115, 116, 203, 204, 205, 206, 301, 302, 303, 304, 1000];
  for (const n of boundaries) {
    const matches = FLOORS.filter((f) => n >= f.detectMin && n <= f.detectMax);
    assert.equal(
      matches.length,
      1,
      `room id ${n} should belong to exactly one floor; got ${matches.length} (${matches.map((m) => m.mapNo).join(",")})`,
    );
  }
});

test("FLOORS: iteration bounds are inside detection bounds", () => {
  // Catches a typo where firstRoom/lastRoom drift outside the detection range
  // (e.g. lastRoom=315 while detectMax stays at Infinity).
  for (const f of FLOORS) {
    assert.ok(
      f.firstRoom >= f.detectMin && f.firstRoom <= f.detectMax,
      `${f.label}.firstRoom (${f.firstRoom}) outside detection range`,
    );
    assert.ok(
      f.lastRoom >= f.detectMin && f.lastRoom <= f.detectMax,
      `${f.label}.lastRoom (${f.lastRoom}) outside detection range`,
    );
    assert.ok(
      f.firstRoom <= f.lastRoom,
      `${f.label} firstRoom must be <= lastRoom`,
    );
  }
});

test("regression: shared link bug-report URL classifies starts on backyard", () => {
  // The exact case from the user: ?start=316&end=276&map_no=1.
  // The fix in hydrateFromUrl re-derives map_no from the start, so we want
  // floorForRoom("316") -> "3" (Back), not "1".
  assert.equal(floorForRoom("316"), "3");
  assert.equal(floorForRoom("276"), "1");
  assert.notEqual(floorForRoom("316"), floorForRoom("276"));
});
