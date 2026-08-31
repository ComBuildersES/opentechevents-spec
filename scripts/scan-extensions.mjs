#!/usr/bin/env node
/**
 * Counts how many registered adopter feeds emit each field listed in
 * docs/data/suggested-extensions.json, and writes the count back into that file's
 * `observedAdoption` blocks. The rest of the file is maintained by hand.
 *
 *   npm run scan-extensions            → fetch feeds, update the counts
 *   npm run scan-extensions -- --check → fail if the counts are stale (CI)
 *
 * A feed that will not fetch is skipped, not counted as zero — same principle as
 * scripts/check-feeds.mjs keeping the last-known version through an outage.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REGISTRY = join("docs", "data", "suggested-extensions.json");
const ADOPTERS = join("docs", "data", "adopters.json");
const check = process.argv.includes("--check");
const TIMEOUT_MS = 15000;

/** "speakers[].affiliation" → walk speakers[] and look for .affiliation; "sameAs" → a top-level key. */
function feedCarries(doc, dotted) {
  const events = Array.isArray(doc?.events) ? doc.events : [doc];
  const [head, ...rest] = dotted.split(".");
  const arrayField = head.endsWith("[]") ? head.slice(0, -2) : null;
  return events.some((ev) => {
    if (!ev || typeof ev !== "object") return false;
    if (arrayField) {
      const list = ev[arrayField];
      return Array.isArray(list) && list.some((item) => item && typeof item === "object" && has(item, rest));
    }
    return has(ev, [head, ...rest]);
  });
}
function has(obj, path) {
  let cur = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object" || !(key in cur)) return false;
    cur = cur[key];
  }
  return cur !== undefined;
}

async function fetchFeed(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const feeds = JSON.parse(readFileSync(ADOPTERS, "utf8")).adopters.filter((a) => a.feed);
const today = new Date().toISOString().slice(0, 10);

const counts = new Map(registry.extensions.map((e) => [e.name, 0]));
let fetched = 0;
for (const { feed } of feeds) {
  const doc = await fetchFeed(feed);
  if (!doc) continue;
  fetched++;
  for (const ext of registry.extensions) {
    if (feedCarries(doc, ext.name)) counts.set(ext.name, counts.get(ext.name) + 1);
  }
}

let changed = false;
for (const ext of registry.extensions) {
  const next = { feeds: counts.get(ext.name), asOf: today };
  if (ext.observedAdoption.feeds !== next.feeds) changed = true;
  ext.observedAdoption = next;
  console.log(`  ${String(next.feeds).padStart(3)}  ${ext.name}`);
}
console.log(`\n  ${fetched}/${feeds.length} feeds fetched`);

if (check) {
  if (changed) {
    console.error("\nsuggested-extensions.json counts are stale — run: npm run scan-extensions");
    process.exit(1);
  }
  console.log("  counts are current");
} else {
  writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");
  console.log(`\n  wrote ${REGISTRY}`);
}
