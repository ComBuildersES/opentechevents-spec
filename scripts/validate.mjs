#!/usr/bin/env node
/**
 * Validates every example under spec/<version>/examples/ against the schemas.
 *
 * Naming convention drives what each example is checked against:
 *   event-*.json → event.schema.json   (standalone event: specVersion + license required)
 *   feed*.json   → feed.schema.json
 *
 * Files under spec/<version>/examples/invalid/ MUST fail: they are the guardrails.
 * A schema that only ever accepts is not a schema.
 *
 * Two levels, and they must not be confused. The schemas decide VALIDITY and a failure here is
 * an error. The `*.recommended.schema.json` profiles decide whether the document is any good at
 * the job — findable, filterable, subscribable — and a failure there is a WARNING that never
 * changes the exit code. Turning a recommendation into an error would push whoever imports a
 * bare .ics into inventing data, which is the one thing this spec refuses to cause.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, basename } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { fieldsOf, loadSchemas } from "./schema-model.mjs";

const VERSIONS = ["v0.1", "v0.2", "v0.3"];
const SPEC_DIR = "spec";
const LATEST = VERSIONS[VERSIONS.length - 1];

let failures = 0;
let warnings = 0;
const log = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${msg}`);
};
const warn = (msg) => {
  warnings++;
  console.log(`  warn  ${msg}`);
};

function build(version) {
  // strictRequired off: `anyOf: [{required: [venue]}, …]` is valid JSON Schema, and it is how
  // "at least one of venue / onlineUrl" is expressed. Ajv's strict mode dislikes required
  // living apart from its properties; the spec does not.
  const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
  addFormats(ajv);

  const dir = join(SPEC_DIR, version);
  const eventSchema = JSON.parse(readFileSync(join(dir, "event.schema.json"), "utf8"));
  const feedSchema = JSON.parse(readFileSync(join(dir, "feed.schema.json"), "utf8"));
  ajv.addSchema(eventSchema);
  ajv.addSchema(feedSchema); // the profiles reference it by $id, so it must be registered first

  // Recommended profiles arrive in v0.3; v0.1 and v0.2 are frozen without them.
  const profile = (name) => {
    const path = join(dir, `${name}.recommended.schema.json`);
    return existsSync(path) ? ajv.compile(JSON.parse(readFileSync(path, "utf8"))) : null;
  };

  return {
    ajv,
    validateEvent: ajv.compile(eventSchema),
    validateFeed: ajv.compile(feedSchema),
    recommendEvent: profile("event"),
    recommendFeed: profile("feed"),
  };
}

/**
 * Which recommended fields a document leaves out. Only `required` errors at the root count:
 * the profile also carries the base schema by $ref, and a document that is already invalid has
 * been reported as such — repeating its errors as warnings would bury the useful ones.
 */
function missingRecommended(validate, doc) {
  if (!validate || validate(doc)) return [];
  return [
    ...new Set(
      (validate.errors ?? [])
        .filter((e) => e.keyword === "required" && e.instancePath === "")
        .map((e) => e.params.missingProperty)
    ),
  ];
}

/**
 * An event inside a feed inherits the feed's organizers (and license, and specVersion), so the
 * profile has to see the event as a consumer will — otherwise every event in a well-formed
 * community feed gets warned for a field the feed already answered.
 */
const asPublished = (feed, event) => ({
  ...(feed.organizers ? { organizers: feed.organizers } : {}),
  ...(feed.license ? { license: feed.license } : {}),
  ...(feed.specVersion ? { specVersion: feed.specVersion } : {}),
  ...event,
});

/** Reports the recommended fields a document is missing. Never fails the build. */
function checkRecommended({ recommendEvent, recommendFeed }, path, doc) {
  const isFeed = Array.isArray(doc.events);
  if (isFeed) {
    const missing = missingRecommended(recommendFeed, doc);
    if (missing.length) warn(`${path} — feed missing recommended: ${missing.join(", ")}`);
    doc.events.forEach((event, i) => {
      const gaps = missingRecommended(recommendEvent, asPublished(doc, event));
      if (gaps.length) warn(`${path} — events[${i}] (${event.id ?? "?"}) missing recommended: ${gaps.join(", ")}`);
    });
    return;
  }
  const missing = missingRecommended(recommendEvent, doc);
  if (missing.length) warn(`${path} — missing recommended: ${missing.join(", ")}`);
}

// `npm run validate -- my-feed.json` → validate your own documents before opening an issue.
// A document with an `events` array is a feed; anything else is a single event.
const args = process.argv.slice(2);
if (args.length) {
  const built = build(LATEST);
  const { ajv, validateEvent, validateFeed } = built;
  for (const path of args) {
    const doc = JSON.parse(readFileSync(path, "utf8"));
    const isFeed = Array.isArray(doc.events);
    const validate = isFeed ? validateFeed : validateEvent;
    const valid = validate(doc);
    log(
      valid,
      `${path} (${isFeed ? "feed" : "event"}, ${LATEST})` +
        (valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" }))
    );
    if (valid) checkRecommended(built, path, doc);
  }
  console.log(failures ? `\n${failures} failure(s)` : "\nValid.");
  if (warnings) console.log(`${warnings} recommendation(s) — valid either way. See the field reference.`);
  process.exit(failures ? 1 : 0);
}

for (const version of VERSIONS) {
  const dir = join(SPEC_DIR, version);
  console.log(`\n${dir}`);

  const built = build(version);
  const { ajv, validateEvent, validateFeed } = built;
  const pick = (file) => (basename(file).startsWith("feed") ? validateFeed : validateEvent);

  const examples = join(dir, "examples");
  for (const file of readdirSync(examples).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(examples, file);
    const validate = pick(file);
    const doc = JSON.parse(readFileSync(path, "utf8"));
    const valid = validate(doc);
    log(valid, `${path}${valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" })}`);
    // event-minimal.json is SUPPOSED to warn: it illustrates the floor of validity, and the
    // warnings are exactly the distance between "valid" and "useful". Do not silence them by
    // fattening that example — the gap is the lesson.
    if (valid) checkRecommended(built, path, doc);
  }

  // Every `examples` entry must satisfy the very field it illustrates. Without this, the
  // documentation drifts from the schema silently: someone tightens a format, forgets the
  // example, and the docs go on showing a value the validator would now reject.
  const { event: eventSchema, feed: feedSchema, registry } = loadSchemas(version);
  for (const [schemaName, schema] of [
    ["event", eventSchema],
    ["feed", feedSchema],
  ]) {
    for (const [path, , meta] of fieldsOf(schema, registry)) {
      for (const [i, example] of meta.examples.entries()) {
        // By reference, not by copy: an isolated subschema cannot resolve #/$defs/… refs.
        const check = ajv.compile({ $ref: `${schema.$id}#${meta.pointer}` });
        const valid = check(example);
        log(
          valid,
          `${schemaName}.${path} examples[${i}] = ${JSON.stringify(example)}` +
            (valid ? "" : `\n${ajv.errorsText(check.errors)}`)
        );
      }
    }
  }

  // Negative cases: these must be rejected, and it must be for the stated reason.
  const invalid = join(examples, "invalid");
  if (!existsSync(invalid)) continue;
  for (const file of readdirSync(invalid).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(invalid, file);
    const validate = pick(file);
    const valid = validate(JSON.parse(readFileSync(path, "utf8")));
    log(!valid, `${path} — must be rejected${valid ? " BUT WAS ACCEPTED" : ""}`);
  }
}

// The code samples on the landing page are a promise: "this is what an OTE event looks like".
// They were the first thing to go stale when v0.1 landed (they still showed the old draft's
// shape), so they are validated too. Mark a sample with `<pre data-ote="event|feed">`.
console.log("\ndocs/index.html code samples");
{
  const { ajv, validateEvent, validateFeed } = build(LATEST);
  const html = readFileSync(join("docs", "index.html"), "utf8");
  const samples = [...html.matchAll(/<pre data-ote="(event|feed)"><code>([\s\S]*?)<\/code><\/pre>/g)];

  if (!samples.length) log(false, "no samples found — did the markup change?");
  for (const [, kind, raw] of samples) {
    // Strip the syntax-highlighting tags and decode the entities the browser would.
    const json = raw
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    let doc;
    try {
      doc = JSON.parse(json);
    } catch (err) {
      log(false, `${kind} sample is not valid JSON — ${err.message}`);
      continue;
    }
    const validate = kind === "feed" ? validateFeed : validateEvent;
    const valid = validate(doc);
    log(valid, `${kind} sample${valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }
}

// The schemas' $id points at https://opentechevents.org/schema/<version>/… , so that URL must
// resolve. GitHub Pages only serves docs/, hence the published copies — and hence this check,
// which is the only thing keeping them from drifting apart.
console.log("\npublished copies (docs/schema/)");
for (const version of VERSIONS) {
  // Every schema in the version's directory, profiles included: whatever has an $id under
  // opentechevents.org/schema/ has to be reachable there.
  for (const schema of readdirSync(join(SPEC_DIR, version)).filter((f) => f.endsWith(".schema.json")).sort()) {
    const src = join(SPEC_DIR, version, schema);
    const published = join("docs", "schema", version, schema);
    const same =
      existsSync(published) && readFileSync(published, "utf8") === readFileSync(src, "utf8");
    log(same, `${published} is in sync with ${src}${same ? "" : " — run: npm run publish-schemas"}`);
  }
}

// Chaining these in package.json would break `npm run validate -- my-feed.json`: npm appends the
// arguments to the END of the script string, so they would land on the wrong command.
const generated = ["scripts/build-reference.mjs", "scripts/build-examples.mjs"]
  .map((script) => spawnSync(process.execPath, [script, "--check"], { stdio: "inherit" }))
  .filter((run) => run.status).length;

console.log(failures || generated ? `\n${failures + generated} failure(s)` : "\nAll examples validate.");
if (warnings) console.log(`${warnings} recommendation(s) — warnings only, they never fail the build.`);
process.exit(failures || generated ? 1 : 0);
