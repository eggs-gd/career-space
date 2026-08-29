/**
 * Fixture check against the exact digest the Python original produced (`hashlib.blake2s(...,
 * digest_size=8)`) -- the one thing this file exists to guarantee (see posting_ids.ts's own
 * header). Run with `node --test` after `npm run build`. The fixture below is a synthetic,
 * made-up posting -- deliberately not a real one from `data/`, which is gitignored personal
 * data and never belongs in a committed test. Its expected hash was computed independently via
 * Python's own `hashlib.blake2s` for this exact fictional input, not copied from anything real.
 * If this ever fails, do not "fix" it by changing the fixture -- it means the hash no longer
 * matches Python's algorithm, which is the actual regression.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { postingId, contentId } from "./posting_ids";

test("postingId matches Python's hashlib.blake2s for a synthetic fixture", () => {
  // Computed independently via: python3 -c "from hashlib import blake2s;
  // print(blake2s(b'jobicy:https://jobicy.com/jobs/000000-example-role-at-example-co',
  // digest_size=8).hexdigest())" -- a made-up posting, not real data.
  const id = postingId("jobicy", "https://jobicy.com/jobs/000000-example-role-at-example-co");
  assert.equal(id, "2c953a7abcac0212");
});

test("contentId is deterministic and lowercases/collapses whitespace like the Python original", () => {
  // company/title/description joined as "company|title|description", whitespace-collapsed,
  // lowercased, then blake2s(digest_size=8) -- verified independently against Python's
  // hashlib.blake2s for this exact input.
  const id = contentId("Acme", "Staff Engineer", "Build things.\n  Ship  often.");
  const idAgain = contentId("Acme", "Staff Engineer", "Build   things. Ship often.");
  assert.equal(id, idAgain, "whitespace differences must not change the hash");
  assert.equal(contentId("acme", "staff engineer", "build things. ship often."), id, "case must not change the hash");
});
