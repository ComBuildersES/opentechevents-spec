#!/usr/bin/env node
/**
 * Turns an adopter-registration issue into an adopters.json entry.
 *
 * Reads the issue-form body from $ISSUE_BODY, fetches the feed, validates it with
 * the real schemas (the browser form only did a best-effort check — this is the
 * authoritative pass), and on success updates docs/data/adopters.json in place.
 * The workflow around it turns that change into a PR.
 *
 * Outputs (to $GITHUB_OUTPUT when set, stdout otherwise):
 *   valid=true|false   whether the feed validated
 *   name=<community>   for commit message / PR title
 *   spec=v0.4          the spec version this run measured against, for the PR body
 *   validator=<url>    the feed's permalink in the online validator, for the PR body
 * A human-readable report is written to $REPORT_PATH (default: adopter-report.md)
 * — that file becomes the comment on the issue, valid or not. It opens with a hidden
 * marker so the workflow can edit one sticky comment instead of stacking a new one on
 * every re-run, and every report carries the online validator link for this feed plus
 * the `/revalidate` command: the usual fix happens on the publisher's server, where
 * editing the issue changes nothing and there is otherwise no way to ask for a retry.
 *
 * An invalid feed is a normal outcome, not a job failure: the script only exits
 * non-zero when it cannot do its work (missing fields, unreadable adopters.json).
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { annotationKeywords, customFormats, customKeywords } from "../index.js";

const SPEC = "spec/v0.4";
const SPEC_VERSION = SPEC.split("/").pop(); // "v0.4" — the version every message quotes
const ADOPTERS = join("docs", "data", "adopters.json");
const REPORT = process.env.REPORT_PATH || "adopter-report.md";

/* The sticky comment's identity: the workflow finds its previous comment by this
   prefix and patches it. Changing it orphans the comments already posted. */
const MARKER = "<!-- ote-adopter-check -->";

/* The same verdict this script produces, in a page the publisher can re-run themselves
   while they fix things — with human-readable messages instead of ajv's error text. */
const VALIDATOR = "https://validator.opentechevents.org/";
const validatorLink = (feed) => `${VALIDATOR}?doc=${encodeURIComponent(feed)}`;

/* Closing line of every report. The feed lives on the publisher's server, so a fix
   leaves the issue untouched: without a command there is nothing to re-trigger on. */
const RETRY =
  "Fixed your feed? Comment `/revalidate` on this issue and the check runs again — no edit needed.";

/* ---------- issue-form parsing ----------
   Issue forms render as "### <label>\n\n<value>" blocks; empty optional fields
   come through as "_No response_". Labels must match .github/ISSUE_TEMPLATE/adopter.yml. */

const LABELS = {
  "Community name": "name",
  "Website": "url",
  "OTE feed URL": "feed",
  "Logo URL": "logo",
  "Community directory ID": "directory",
};

function parseIssue(body) {
  const fields = {};
  for (const match of body.matchAll(/^### (.+?)\r?\n+([\s\S]*?)(?=^### |$(?![\r\n]))/gm)) {
    const key = LABELS[match[1].trim()];
    if (!key) continue; // checkboxes and future sections just pass through
    const value = match[2].trim();
    fields[key] = value === "_No response_" ? "" : value;
  }
  return fields;
}

/* ---------- outputs ---------- */

function setOutput(key, value) {
  const line = `${key}=${value}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line);
  else process.stdout.write(line);
}

function report(valid, lines) {
  writeFileSync(REPORT, [MARKER, "", ...lines].join("\n") + "\n");
  setOutput("valid", String(valid));
  console.log(readFileSync(REPORT, "utf8"));
}

/* ---------- main ---------- */

const body = process.env.ISSUE_BODY;
if (!body) {
  console.error("ISSUE_BODY is not set");
  process.exit(1);
}

const fields = parseIssue(body);
setOutput("name", fields.name || "");
setOutput("spec", SPEC_VERSION);

if (!fields.name || !fields.feed) {
  report(false, [
    "### ❌ Registration incomplete",
    "",
    "Couldn't find the community name and/or the feed URL in the issue. Please edit the issue keeping the form's section headings intact.",
  ]);
  process.exit(0);
}

setOutput("validator", validatorLink(fields.feed));

/* Whether a browser could read this feed. Checked here because this is the one moment
   the publisher is listening: the report becomes a comment on their issue. It never
   affects the verdict — a feed without CORS is valid, it just can't be read by
   browser-based clients (readers, widgets, static directories). */
const ORIGIN = "https://opentechevents.org";
let cors = null;

let doc;
try {
  const res = await fetch(fields.feed, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`the URL answered HTTP ${res.status}`);
  const acao = res.headers.get("access-control-allow-origin");
  if (acao !== "*") cors = acao ? `only allows reads from \`${acao}\`` : "sends no `Access-Control-Allow-Origin`";
  doc = await res.json();
} catch (err) {
  report(false, [
    "### ❌ Feed unreachable or not JSON",
    "",
    `Fetching \`${fields.feed}\` failed: ${err.message}`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})** to see what a client gets when it asks for that URL.`,
    "",
    "If the URL itself is wrong, edit the issue. If the server is what needs fixing, fix it there — nothing in this issue has to change.",
    "",
    RETRY,
  ]);
  process.exit(0);
}

// Same Ajv setup as scripts/validate.mjs — see the comment there about strictRequired.
const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
// The schemas carry annotations strict mode would refuse to compile; they constrain nothing.
for (const kw of annotationKeywords) ajv.addKeyword(kw);
// `ote-local-date-time` covers the one temporal shape ajv-formats doesn't: wall-clock,
// deliberately without an offset. Strict mode refuses to compile a schema referencing an
// unregistered format, same as with annotationKeywords above.
for (const f of customFormats) ajv.addFormat(f.name, f.validate);
// Unlike annotationKeywords, these restrict which documents pass (e.g. distinctTranslationLanguages).
for (const kw of customKeywords) ajv.addKeyword(kw);
ajv.addSchema(JSON.parse(readFileSync(join(SPEC, "event.schema.json"), "utf8")));
const validateFeed = ajv.compile(JSON.parse(readFileSync(join(SPEC, "feed.schema.json"), "utf8")));

if (!validateFeed(doc)) {
  report(false, [
    `### ❌ The feed does not validate against OTE Spec ${SPEC_VERSION}`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})** — same verdict as here, with each problem explained in plain language and pointed at the field that caused it. The [field reference](https://opentechevents.org/spec/) documents every field.`,
    "",
    "<details><summary>Raw validator output</summary>",
    "",
    "```",
    ajv.errorsText(validateFeed.errors, { separator: "\n" }),
    "```",
    "",
    "</details>",
    "",
    RETRY,
  ]);
  process.exit(0);
}

// Valid → upsert into adopters.json, keyed by feed URL: re-registering an
// existing feed updates its entry instead of duplicating it.
const registry = JSON.parse(readFileSync(ADOPTERS, "utf8"));
const entry = { name: fields.name };
if (fields.url) entry.url = fields.url;
entry.feed = fields.feed;
if (fields.logo) entry.logo = fields.logo;
if (fields.directory) entry.directory = fields.directory;

const existing = registry.adopters.findIndex((a) => a.feed === fields.feed);
if (existing === -1) registry.adopters.push(entry);
else registry.adopters[existing] = { ...registry.adopters[existing], ...entry };
writeFileSync(ADOPTERS, JSON.stringify(registry, null, 2) + "\n");

report(true, [
  `### ✅ Feed validates against OTE Spec ${SPEC_VERSION}`,
  "",
  `**${fields.name}** — \`${fields.feed}\` (${doc.events.length} event${doc.events.length === 1 ? "" : "s"})`,
  fields.directory ? `Linked to directory entry \`${fields.directory}\`.` : "No directory link.",
  "",
  "A pull request adding the community to the adopters registry follows; a maintainer will review and merge it.",
  "",
  `Keep this link to re-check the feed whenever you change it: [validator.opentechevents.org](${validatorLink(fields.feed)}).`,
  ...(cors
    ? [
        "",
        `> ⚠️ **One thing worth fixing:** the server ${cors}, so clients that run in a browser — the [OTE Reader](https://reader.opentechevents.org/), embeddable widgets, static directories — can't fetch your feed. It doesn't block anything here (your feed is valid and server-side consumers read it fine), but adding \`Access-Control-Allow-Origin: *\` to the feed response takes one line of server config: [how and why](https://opentechevents.org/#serving).`,
      ]
    : []),
]);
