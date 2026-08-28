#!/usr/bin/env node
/**
 * Regenerates language-subtags.json (shipped in the npm package, read by index.js) from the
 * official IANA Language Subtag Registry.
 *
 * Scope is deliberately the CORE of BCP 47 (RFC 5646): `language`, `script`, `region` and
 * `variant` subtags only. `extlang`, `grandfathered`/`redundant` tags and extension singletons
 * are out of scope on purpose — see docs/history/CHANGES.log #P006 and DECISIONS.md D007 for why: they have
 * no real use case for "what language is this event's text in", and grandfathered tags in
 * particular are relics RFC 5646 itself deprecates in favor of the modern subtag form.
 *
 * Deprecated subtags ARE included (e.g. `in`→`id` Indonesian, `iw`→`he` Hebrew): like a renamed
 * IANA timezone (D002), a deprecated subtag still names exactly one unambiguous thing, so
 * rejecting it would only punish old-but-correct data for no benefit.
 *
 * Placeholder subtags are EXCLUDED — the registry's own "private use" ranges (`qaa..qtz`,
 * `Qaaa..Qabx`, `AA`, `QM..QZ`, `XA..XZ`, `ZZ`) plus the handful of specific codes that mean
 * "not one specific thing" (`mis` Uncoded languages, `mul` Multiple languages, `und`
 * Undetermined, `zxx` No linguistic content, `Zyyy`/`Zzzz` undetermined/uncoded script). Same
 * reasoning as D006 excluding ISO 3166-1's "user-assigned" `ZZ`: these don't identify a real,
 * specific language/script/region, so accepting them would satisfy the field's required-ness
 * without answering the question it exists to answer.
 *
 * Maintenance script, not part of `npm run validate` or CI: run by hand when IANA updates the
 * registry (see the registry's own File-Date header, embedded below for provenance).
 */
import { writeFileSync } from "node:fs";

const REGISTRY_URL =
  "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry";
const OUTPUT_PATH = new URL("../language-subtags.json", import.meta.url);
const KEPT_TYPES = new Set(["language", "script", "region", "variant"]);

const res = await fetch(REGISTRY_URL);
if (!res.ok) throw new Error(`fetch ${REGISTRY_URL} failed: ${res.status}`);
const text = await res.text();

const fileDate = /^File-Date:\s*(\S+)/m.exec(text)?.[1];
if (!fileDate) throw new Error("could not find File-Date in the registry");

const PLACEHOLDER = /private use|uncoded|undetermined|multiple languages|no linguistic content/i;

const subtags = { language: new Set(), script: new Set(), region: new Set(), variant: new Set() };
for (const record of text.split("%%")) {
  const type = /^Type:\s*(\S+)/m.exec(record)?.[1];
  if (!KEPT_TYPES.has(type)) continue;
  const subtag = /^Subtag:\s*(\S+)/m.exec(record)?.[1];
  if (!subtag || subtag.includes("..")) continue; // open private-use ranges, not exact codes
  const description = /^Description:\s*(.+)/m.exec(record)?.[1];
  if (description && PLACEHOLDER.test(description)) continue;
  // Registry casing varies (language lowercase, region uppercase or digits, script Title-case,
  // variant lowercase); BCP 47 tags are case-insensitive, so normalize to lowercase for lookup.
  subtags[type].add(subtag.toLowerCase());
}

const out = {
  source: REGISTRY_URL,
  fileDate,
  language: [...subtags.language].sort(),
  script: [...subtags.script].sort(),
  region: [...subtags.region].sort(),
  variant: [...subtags.variant].sort(),
};
writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");

console.log(
  `registry ${fileDate}: ${out.language.length} language, ${out.script.length} script, ` +
    `${out.region.length} region, ${out.variant.length} variant subtags`
);
console.log(`Updated ${OUTPUT_PATH.pathname}`);
