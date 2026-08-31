#!/usr/bin/env node
/**
 * Reviewable check for the v0.5 proposal fragments (proposals/v0.5-schema-fragments.json).
 *
 * Loads the REAL spec/v0.4/event.schema.json, injects the draft $defs + property additions +
 * document constraints from the fragments file, compiles with the same Ajv 2020 setup
 * scripts/validate.mjs uses (annotationKeywords, customFormats, customKeywords), and runs the
 * C1–C7 pricing matrix plus edge cases through it.
 *
 * It does NOT touch spec/. Run: `node proposals/validate-fragments.mjs`
 * Nothing here is normative — it exists so a reviewer can reproduce the "N/N pass" claim.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const { default: Ajv2020 } = await import(join(REPO, "node_modules/ajv/dist/2020.js"));
const { default: addFormats } = await import(join(REPO, "node_modules/ajv-formats/dist/index.js"));
const { annotationKeywords, customFormats, customKeywords } = await import(join(REPO, "index.js"));

const eventSchema = JSON.parse(readFileSync(join(REPO, "spec/v0.4/event.schema.json"), "utf8"));
const fragments = JSON.parse(readFileSync(join(REPO, "proposals/v0.5-schema-fragments.json"), "utf8"));

for (const [name, def] of Object.entries(fragments.$defs)) {
  if (eventSchema.$defs[name]) throw new Error(`$def ${name} already exists in v0.4`);
  eventSchema.$defs[name] = def;
}
const ev = eventSchema.$defs.event.properties;
ev.speakers = fragments.propertyAdditions["event.properties.speakers"];
ev.recordings = fragments.propertyAdditions["event.properties.recordings"];
// P040: shared $def in event.schema.json#/$defs; feed + event property copies $ref it (feed cross-schema).
// The fragment writes the canonical .../v0.5/... ref; here we bind it to the loaded v0.4 $id.
eventSchema.$defs.contributing = { ...fragments.propertyAdditions["event.$defs.contributing"] };
delete eventSchema.$defs.contributing.$comment;
ev.contributing = { description: "P040 event copy", $ref: "#/$defs/contributing", "x-inheritsFrom": "feed.contributing" };
eventSchema.$defs.partOf.properties.offers = fragments.propertyAdditions["partOf.properties.offers"];
eventSchema.$defs.offer.properties.scope = fragments.propertyAdditions["offer.properties.scope"];
eventSchema.$defs.event.allOf = (eventSchema.$defs.event.allOf || []).concat(
  fragments.documentConstraints.addOnRequiresSetAdmission,
);

const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
for (const kw of annotationKeywords) ajv.addKeyword(kw);
for (const f of customFormats) ajv.addFormat(f.name, f.validate);
for (const kw of customKeywords) ajv.addKeyword(kw);

let validate, validateFeed;
try {
  ajv.addSchema(eventSchema);          // register by $id so the feed schema can $ref it
  validate = ajv.getSchema(eventSchema.$id);
  console.log("  ok    event schema compiles in strict mode with the injected fragments");
} catch (e) {
  console.log("  FAIL  event schema does not compile:", e.message);
  process.exit(1);
}
try {
  const feedSchema = JSON.parse(readFileSync(join(REPO, "spec/v0.4/feed.schema.json"), "utf8"));
  feedSchema.$defs = { alternates: fragments.$defs.alternates, alternate: fragments.$defs.alternate };
  feedSchema.properties.alternates = fragments.propertyAdditions["feed.properties.alternates"];
  // feed copy: $ref the shared $def cross-schema by the loaded event schema's $id; no x-inheritsFrom (feed is the source)
  feedSchema.properties.contributing = { description: "P040 feed copy", $ref: `${eventSchema.$id}#/$defs/contributing` };
  validateFeed = ajv.compile(feedSchema);
  console.log("  ok    feed schema compiles with alternates + contributing (P039/P040)");
} catch (e) {
  console.log("  FAIL  feed schema does not compile:", e.message);
  process.exit(1);
}

const base = {
  specVersion: "0.4.0",
  license: "CC-BY-4.0",
  id: "https://ex.example/e/1",
  name: "Test event",
  startDate: "2026-10-15T18:00",
  timezone: "Europe/Madrid",
};
const setAdmission = [{ name: "General", price: 240, currency: "EUR", url: "https://ex.example/tix" }];

const cases = [
  // ---- P035 speakers ----
  ["P035 speakers: one person", true, { speakers: [{ name: "Ada Lovelace", url: "https://ada.example" }] }],
  ["P035 speakers: empty list", false, { speakers: [] }],
  ["P035 speakers: exact duplicate", false, { speakers: [{ name: "A" }, { name: "A" }] }],
  ["P035 speakers: missing name", false, { speakers: [{ url: "https://x.example" }] }],
  ["P035 speakers: userinfo url", false, { speakers: [{ name: "A", url: "https://u:p@x.example" }] }],
  ["P035 speakers: bad type", false, { speakers: [{ name: "A", type: "robot" }] }],
  ["P035 speakers: extension field alongside name", true, { speakers: [{ name: "A", "combuilders:id": "x" }] }],
  ["P035 speakers.sameAs: list of profiles", true, { speakers: [{ name: "Ada", url: "https://ada.example", sameAs: ["https://fosstodon.org/@ada", "https://www.linkedin.com/in/ada"] }] }],
  ["P035 speakers.sameAs: empty list", false, { speakers: [{ name: "Ada", sameAs: [] }] }],
  ["P035 speakers.sameAs: exact dup", false, { speakers: [{ name: "Ada", sameAs: ["https://x.example", "https://x.example"] }] }],
  ["P035 speakers.sameAs: userinfo", false, { speakers: [{ name: "Ada", sameAs: ["https://u:p@x.example"] }] }],
  ["P035 speakers.sameAs: non-http rejected", false, { speakers: [{ name: "Ada", sameAs: ["did:plc:abc"] }] }],

  // ---- P036 recordings ----
  ["P036 recordings: bare url", true, { recordings: ["https://www.youtube.com/watch?v=abc"] }],
  ["P036 recordings: object + title", true, { recordings: [{ url: "https://tube.example/w/1", title: "Q&A" }] }],
  ["P036 recordings: mixed string + object", true, { recordings: ["https://youtu.be/abc", { url: "https://tube.example/w/1" }] }],
  ["P036 recordings: http allowed (P034 alignment)", true, { recordings: ["http://old.example/video"] }],
  ["P036 recordings: empty list", false, { recordings: [] }],
  ["P036 recordings: exact dup", false, { recordings: ["https://youtu.be/abc", "https://youtu.be/abc"] }],
  ["P036 recordings: object missing url", false, { recordings: [{ title: "Q&A" }] }],
  ["P036 recordings: translations require title", false, { textLanguage: "en", recordings: [{ url: "https://tube.example/w/1", translations: { es: { title: "P&R" } } }] }],
  ["P036 recordings: title + translations ok", true, { textLanguage: "en", recordings: [{ url: "https://tube.example/w/1", title: "Q&A", translations: { es: { title: "P&R" } } }] }],

  // ---- P037 pricing model (Model A: flat admission + add-on) ----
  ["C1 partOf.offers single price, part omits offers", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: [{ price: 0, url: "https://ex.example/reg" }] } }],
  ["C2 partOf.offers tiered admission", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: [{ name: "Early bird", price: 180, currency: "EUR", url: "https://ex.example/t" }, { name: "General", price: 240, currency: "EUR", url: "https://ex.example/t" }] } }],
  ["C3 add-on with set admission in-document", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: setAdmission }, offers: [{ name: "Workshop", price: 60, currency: "EUR", scope: "add-on", url: "https://ex.example/t#w" }] }],
  ["C3 add-on WITHOUT partOf -> base error", false, { offers: [{ name: "Workshop", price: 60, currency: "EUR", scope: "add-on", url: "https://ex.example/w" }] }],
  ["C3 add-on WITH partOf but NO partOf.offers -> base error", false, { partOf: { id: "https://ex.example/c", name: "Conf" }, offers: [{ price: 60, currency: "EUR", scope: "add-on", url: "https://ex.example/w" }] }],
  ["C4 free public part: scope admission price 0", true, { partOf: { id: "https://ex.example/c", type: "multipart" }, offers: [{ price: 0, scope: "admission", url: "https://ex.example/rsvp" }] }],
  ["C5 standalone + add-on in one list", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: setAdmission }, offers: [{ name: "Workshop only", price: 80, currency: "EUR", scope: "admission", url: "https://ex.example/w" }, { name: "Workshop (with ticket)", price: 40, currency: "EUR", scope: "add-on", url: "https://ex.example/w2" }] }],
  ["scope: bad enum value", false, { partOf: { id: "https://ex.example/c", offers: setAdmission }, offers: [{ price: 10, currency: "EUR", scope: "bundle", url: "https://ex.example/x" }] }],
  // Round 5: URL-only offers are valid; the total is "unknown, relationship known" — a consumer concern, not a validity one.
  ["R5 add-on over URL-only admission (valid, total unknown)", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: [{ url: "https://ex.example/tix" }] }, offers: [{ price: 60, currency: "EUR", scope: "add-on", url: "https://ex.example/w" }] }],
  ["R5 URL-only add-on over priced admission (valid, total unknown)", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: setAdmission }, offers: [{ scope: "add-on", url: "https://ex.example/w" }] }],
  ["R5 URL-only on both sides (valid)", true, { partOf: { id: "https://ex.example/c", type: "multipart", offers: [{ url: "https://ex.example/tix" }] }, offers: [{ scope: "add-on", url: "https://ex.example/w" }] }],
  ["partOf.offers: currency without price still rejected", false, { partOf: { id: "https://ex.example/c", offers: [{ currency: "EUR", url: "https://ex.example/t" }] } }],
  ["partOf.offers: empty list", false, { partOf: { id: "https://ex.example/c", offers: [] } }],
  ["partOf.offers: waitlistUrl + in-stock still rejected", false, { partOf: { id: "https://ex.example/c", offers: [{ price: 10, currency: "EUR", url: "https://ex.example/t", availability: "in-stock", waitlistUrl: "https://ex.example/wl" }] } }],
  ["regression: v0.4 doc, no partOf.offers, no scope", true, { offers: [{ price: 20, currency: "EUR", url: "https://ex.example/t" }] }],
  ["regression: v0.4 partOf without offers still fine", true, { partOf: { id: "https://ex.example/series", name: "Monthly", type: "series" } }],
];

let bad = 0;
for (const [label, expectValid, patch] of cases) {
  const doc = { ...base, ...patch };
  const ok = validate(doc);
  const pass = ok === expectValid;
  if (!pass) bad++;
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${label}  (want ${expectValid ? "valid" : "invalid"}, got ${ok ? "valid" : "invalid"})`);
  if (!pass && validate.errors) for (const e of validate.errors.slice(0, 3)) console.log(`         ${e.instancePath} ${e.message}`);
}

// ---------------------------------------------------------------------------
// Round 5: sharedOffersConsistent is a FUTURE feed-root custom keyword. Ajv cannot
// test it (it does not exist yet), so here is the reference equality check the
// DECISIONS.md entry would encode, plus a feed-level probe.
// ---------------------------------------------------------------------------
function deepEqualJson(a, b) {
  if (a === null || a === undefined) a = undefined;         // null treated as absent
  if (b === null || b === undefined) b = undefined;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a === "number" && typeof b === "number") return a === b;   // 45 === 45.0
  if (typeof a !== "object") return a === b;                             // exact strings/bools
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqualJson(x, b[i])); // order significant
  const ka = Object.keys(a).filter((k) => a[k] !== null && a[k] !== undefined).sort();
  const kb = Object.keys(b).filter((k) => b[k] !== null && b[k] !== undefined).sort();             // member order NOT significant
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && deepEqualJson(a[k], b[k]));
}
function sharedOffersConsistent(feedEvents) {
  const groups = new Map();
  for (const ev of feedEvents) {
    const pid = ev.partOf?.id;
    if (!pid) continue;
    if (!groups.has(pid)) groups.set(pid, []);
    groups.get(pid).push(ev.partOf.offers);
  }
  for (const [, blocks] of groups) {
    const present = blocks.filter((b) => b !== undefined);
    for (let i = 1; i < present.length; i++) if (!deepEqualJson(present[0], present[i])) return false;
  }
  return true;
}
const A = [{ name: "General", price: 240, currency: "EUR", url: "https://ex.example/t" }];
const feedCases = [
  ["feed: two siblings, identical partOf.offers (member order swapped)", true,
    [{ partOf: { id: "https://ex.example/c", offers: [{ price: 240, name: "General", currency: "EUR", url: "https://ex.example/t" }] } },
     { partOf: { id: "https://ex.example/c", offers: A } }]],
  ["feed: two siblings, differing partOf.offers price -> inconsistent", false,
    [{ partOf: { id: "https://ex.example/c", offers: A } },
     { partOf: { id: "https://ex.example/c", offers: [{ name: "General", price: 999, currency: "EUR", url: "https://ex.example/t" }] } }]],
  ["feed: two siblings, array order differs -> inconsistent", false,
    [{ partOf: { id: "https://ex.example/c", offers: [A[0], { name: "Student", price: 90, currency: "EUR", url: "https://ex.example/t" }] } },
     { partOf: { id: "https://ex.example/c", offers: [{ name: "Student", price: 90, currency: "EUR", url: "https://ex.example/t" }, A[0]] } }]],
  ["feed: one sibling omits partOf.offers -> allowed (warning territory)", true,
    [{ partOf: { id: "https://ex.example/c", offers: A } },
     { partOf: { id: "https://ex.example/c", name: "Conf" } }]],
];
for (const [label, expectOk, evs] of feedCases) {
  const ok = sharedOffersConsistent(evs);
  const pass = ok === expectOk;
  if (!pass) bad++;
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${label}  (want ${expectOk ? "consistent" : "inconsistent"}, got ${ok ? "consistent" : "inconsistent"})`);
}

// ---------------------------------------------------------------------------
// P039 feed.alternates + P040 contributing (feed-level)
// ---------------------------------------------------------------------------
const feedBase = { specVersion: "0.4.0", title: "Test feed", updatedAt: "2026-07-06T10:00:00Z", events: [], license: "CC-BY-4.0" };
const feedSchemaCases = [
  ["P039 alternates: rss + ical", true, { alternates: [{ mediaType: "application/rss+xml", url: "https://ex.example/f.rss" }, { mediaType: "text/calendar", url: "https://ex.example/f.ics" }] }],
  ["P039 alternates: atom+xml valid", true, { alternates: [{ mediaType: "application/atom+xml", url: "https://ex.example/f.atom" }] }],
  ["P039 alternates: feed+json valid", true, { alternates: [{ mediaType: "application/feed+json", url: "https://ex.example/f.json" }] }],
  ["P039 alternates: vnd.* valid", true, { alternates: [{ mediaType: "application/vnd.api+json", url: "https://ex.example/f" }] }],
  ["P039 alternates: two rss mirrors (same mediaType) ok", true, { alternates: [{ mediaType: "application/rss+xml", url: "https://a.example/f.rss" }, { mediaType: "application/rss+xml", url: "https://b.example/f.rss" }] }],
  ["P039 alternates: empty list", false, { alternates: [] }],
  ["P039 alternates: exact dup", false, { alternates: [{ mediaType: "text/calendar", url: "https://ex.example/f.ics" }, { mediaType: "text/calendar", url: "https://ex.example/f.ics" }] }],
  ["P039 alternates: missing url", false, { alternates: [{ mediaType: "text/calendar" }] }],
  ["P039 alternates: bad mediaType shape (bare word)", false, { alternates: [{ mediaType: "RSS", url: "https://ex.example/f.rss" }] }],
  ["P039 alternates: mediaType with parameter rejected", false, { alternates: [{ mediaType: "application/rss+xml; charset=utf-8", url: "https://ex.example/f.rss" }] }],
  ["P039 alternates: uppercase mediaType rejected", false, { alternates: [{ mediaType: "Application/RSS+XML", url: "https://ex.example/f.rss" }] }],
  ["P039 alternates: userinfo url", false, { alternates: [{ mediaType: "text/calendar", url: "https://u:p@ex.example/f.ics" }] }],
  ["P040 contributing (feed): issue url", true, { contributing: "https://github.com/pyalmeria/eventos/issues/new" }],
  ["P040 contributing (feed): editor deep link", true, { contributing: "https://tools.opentechevents.org/editor/?repo=rustmadrid/events" }],
  ["P040 contributing (feed): mailto role address (dev.events)", true, { contributing: "mailto:hello@dev.events" }],
  ["P040 contributing (feed): mailto with ?subject header rejected", false, { contributing: "mailto:hello@dev.events?subject=fix" }],
  ["P040 contributing (feed): mailto with ?body header rejected", false, { contributing: "mailto:hello@dev.events?body=hi" }],
  ["P040 contributing (feed): mailto two recipients rejected", false, { contributing: "mailto:a@b.example,c@d.example" }],
  ["P040 contributing (feed): mailto with fragment rejected", false, { contributing: "mailto:hello@dev.events#frag" }],
  ["P040 contributing (feed): mailto with raw slash rejected", false, { contributing: "mailto:a/b@dev.events" }],
  ["P040 contributing (feed): bare email (no mailto:) rejected", false, { contributing: "hello@dev.events" }],
  ["P040 contributing (feed): not a url", false, { contributing: "issues" }],
  ["P040 contributing (feed): userinfo", false, { contributing: "https://u:p@github.com/x/issues/new" }],
  ["P040 contributing (event override in a feed)", true, { events: [{ ...base, contributing: "https://github.com/rustmadrid/events/issues/new" }] }],
  ["P040 contributing (event override with mailto)", true, { events: [{ ...base, contributing: "mailto:corrections@rustmadrid.example" }] }],
  ["regression: v0.4 feed with neither new field", true, {}],
];
for (const [label, expectValid, patch] of feedSchemaCases) {
  const doc = { ...feedBase, ...patch };
  const ok = validateFeed(doc);
  const pass = ok === expectValid;
  if (!pass) bad++;
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${label}  (want ${expectValid ? "valid" : "invalid"}, got ${ok ? "valid" : "invalid"})`);
  if (!pass && validateFeed.errors) for (const e of validateFeed.errors.slice(0, 3)) console.log(`         ${e.instancePath} ${e.message}`);
}

const total = cases.length + feedCases.length + feedSchemaCases.length;
console.log(bad === 0 ? `\nALL ${total} CASES CLASSIFIED AS EXPECTED` : `\n${bad} CASES WRONG`);
process.exit(bad === 0 ? 0 : 1);
