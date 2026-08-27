#!/usr/bin/env node
/**
 * Health check for registered adopter feeds: fetches every feed in
 * docs/data/adopters.json and validates it against the schemas.
 *
 * Consecutive failures are tracked in .github/feed-health.json (committed by the
 * workflow, not published — GitHub Pages only serves docs/). When a feed reaches
 * FEED_FAILURE_THRESHOLD consecutive failures an issue is opened; when it
 * recovers, the counter resets and the issue is closed. Nothing is ever removed
 * from the registry automatically — feeds die over a weekend all the time, and
 * delisting a community is a human call (a PR).
 *
 * With GITHUB_TOKEN + GITHUB_REPOSITORY set it manages the issues itself via the
 * REST API; without them (local run) it prints what it would do.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { annotationKeywords, customFormats, customKeywords } from "../index.js";

const SPEC = "spec/v0.4";
const ADOPTERS = join("docs", "data", "adopters.json");
const STATE = join(".github", "feed-health.json");
const THRESHOLD = Number(process.env.FEED_FAILURE_THRESHOLD || 3);
const LABEL = "feed-health";

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

/* ---------- GitHub REST (no deps; skipped on local runs) ---------- */

async function gh(method, path, body) {
  if (!token || !repo) {
    console.log(`  (dry-run) ${method} ${path}${body ? " " + JSON.stringify(body).slice(0, 120) : ""}`);
    return method === "GET" ? [] : {};
  }
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // 422 on label creation = already exists; anything else unexpected should fail loudly.
  if (!res.ok && res.status !== 422) throw new Error(`${method} ${path}: HTTP ${res.status}`);
  return res.status === 422 ? {} : res.json();
}

const issueTitle = (name) => `[Feed health] ${name}: feed unreachable or invalid`;

async function openIssues() {
  return gh("GET", `/issues?state=open&labels=${LABEL}&per_page=100`);
}

/* ---------- validation ---------- */

const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
// The schemas carry annotations strict mode would refuse to compile; they constrain nothing.
for (const kw of annotationKeywords) ajv.addKeyword(kw);
// Same setup as scripts/register-adopter.mjs: without the custom formats and keywords
// (`ote-local-date-time`, `distinctTranslationLanguages`) strict mode refuses to compile
// the schema at all, and the health check dies before fetching a single feed.
for (const f of customFormats) ajv.addFormat(f.name, f.validate);
for (const kw of customKeywords) ajv.addKeyword(kw);
ajv.addSchema(JSON.parse(readFileSync(join(SPEC, "event.schema.json"), "utf8")));
const validateFeed = ajv.compile(JSON.parse(readFileSync(join(SPEC, "feed.schema.json"), "utf8")));

/* A feed nobody can read from a browser is still a valid, healthy feed — this is a
   note, never a failure. `*` is what lets an arbitrary client read it; anything else
   (absent, or a single reflected origin) means only some origins can. See
   https://opentechevents.org/#serving */
const ORIGIN = "https://opentechevents.org";

function corsNote(res) {
  const acao = res.headers.get("access-control-allow-origin");
  if (acao === "*") return null;
  return acao
    ? `only reads from ${acao} (no \`Access-Control-Allow-Origin: *\`)`
    : "no `Access-Control-Allow-Origin`";
}

async function checkFeed(url) {
  let res;
  try {
    res = await fetch(url, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(20000) });
  } catch (err) {
    return { error: `fetch failed: ${err.message}` };
  }
  const cors = corsNote(res);
  if (!res.ok) return { error: `HTTP ${res.status}`, cors };
  let doc;
  try {
    doc = await res.json();
  } catch {
    return { error: "response is not JSON", cors };
  }
  if (!validateFeed(doc)) {
    return { error: "schema errors:\n" + ajv.errorsText(validateFeed.errors, { separator: "\n" }), cors };
  }
  return { error: null, cors }; // healthy
}

/* ---------- main ---------- */

const adopters = JSON.parse(readFileSync(ADOPTERS, "utf8")).adopters.filter((a) => a.feed);
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const today = new Date().toISOString().slice(0, 10);
const next = {};
let failures = 0;
const noCors = [];

for (const adopter of adopters) {
  const { error, cors } = await checkFeed(adopter.feed);
  const prev = state[adopter.feed];

  if (!error) {
    console.log(`  ok    ${adopter.name} — ${adopter.feed}`);
    // Only worth saying about a feed that otherwise works: a broken one has a bigger problem.
    if (cors) {
      noCors.push(adopter);
      console.log(`        ${cors} — browser-based clients can't read this feed`);
    }
    if (prev && prev.failures >= THRESHOLD) {
      // Recovered after having been reported: close the alert.
      const issues = await openIssues();
      const open = issues.find((i) => i.title === issueTitle(adopter.name));
      if (open) {
        await gh("POST", `/issues/${open.number}/comments`, {
          body: `The feed answers and validates again as of ${today}. Closing.`,
        });
        await gh("PATCH", `/issues/${open.number}`, { state: "closed" });
        console.log(`        recovered — closed #${open.number}`);
      }
    }
    continue; // healthy feeds carry no state
  }

  failures++;
  next[adopter.feed] = {
    failures: (prev ? prev.failures : 0) + 1,
    since: prev ? prev.since : today,
    lastError: error.split("\n")[0],
  };
  console.log(`  FAIL  ${adopter.name} — ${adopter.feed} (${next[adopter.feed].failures} consecutive): ${error.split("\n")[0]}`);

  // Exactly at the threshold: open the alert once. Beyond it, the issue exists
  // (or was closed by a human who knows better — don't reopen it every day).
  if (next[adopter.feed].failures === THRESHOLD) {
    await gh("POST", "/labels", { name: LABEL, color: "d93f0b", description: "Registered adopter feed failing its health check" });
    const issues = await openIssues();
    if (!issues.some((i) => i.title === issueTitle(adopter.name))) {
      await gh("POST", "/issues", {
        title: issueTitle(adopter.name),
        labels: [LABEL],
        body: [
          `The feed of **${adopter.name}** has failed its daily health check ${THRESHOLD} times in a row (since ${next[adopter.feed].since}).`,
          "",
          `- Feed: ${adopter.feed}`,
          adopter.url ? `- Website: ${adopter.url}` : null,
          `- Last error:`,
          "```",
          error,
          "```",
          "",
          "If the feed is gone for good, delist the community with a PR removing its entry from `docs/data/adopters.json`. If it's temporary, this issue closes itself when the feed recovers.",
        ].filter((l) => l !== null).join("\n"),
      });
      console.log("        opened health issue");
    }
  }
}

writeFileSync(STATE, JSON.stringify(next, null, 2) + "\n");
console.log(`\n${adopters.length} feed(s), ${failures} failing.`);
if (noCors.length) {
  // Deliberately not an issue and not part of the failure count: these feeds are healthy.
  console.log(
    `${noCors.length} readable only from a server (no CORS): ${noCors.map((a) => a.name).join(", ")}` +
      ` — https://opentechevents.org/#serving`
  );
}
