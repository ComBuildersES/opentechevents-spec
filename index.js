import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** The spec version these schemas describe. Matches the `specVersion` field of a document. */
export const specVersion = "0.3.0";

/** JSON Schema (draft 2020-12) of a single OTE event. */
export const eventSchema = require("./spec/v0.3/event.schema.json");

/** JSON Schema (draft 2020-12) of an OTE feed. */
export const feedSchema = require("./spec/v0.3/feed.schema.json");

/**
 * Both schemas, in the order a validator needs them: the feed references the event by $id,
 * so the event schema must be registered first.
 */
export const schemas = [eventSchema, feedSchema];

/**
 * Quality profiles, NOT validity: a document that fails one is still a valid OTE document.
 * They list the fields that decide whether an event can be found, filtered and subscribed to.
 * Report their failures as warnings; never reject a document for them. Both reference the base
 * schemas by $id, so register `schemas` first.
 */
export const eventRecommendedSchema = require("./spec/v0.3/event.recommended.schema.json");
export const feedRecommendedSchema = require("./spec/v0.3/feed.recommended.schema.json");
export const recommendedSchemas = [eventRecommendedSchema, feedRecommendedSchema];

/**
 * Annotation keywords the schemas carry, with the meta-schema each one's value obeys.
 * They constrain nothing — a validator that ignores them accepts exactly the same documents.
 * `x-inheritsFrom` names the FEED field an event field falls back to when it omits its own
 * (`event.license` → `feed.license`), which no standard keyword can say: the default is not a
 * literal, it is whatever the enclosing feed declared.
 *
 * JSON Schema allows unknown keywords, so most validators need nothing. Ajv in `strict: true`
 * refuses to compile a schema carrying one, so register them first:
 *
 *   for (const kw of annotationKeywords) ajv.addKeyword(kw);
 */
export const annotationKeywords = [
  { keyword: "x-inheritsFrom", metaSchema: { type: "string" } },
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * `$defs.dateTime`'s own concept — a wall-clock date-time, deliberately without an offset and
 * without seconds (this is the hour on a poster, never a technical instant) — has no standard
 * RFC 3339 format, so ajv-formats cannot validate it. Checks real calendar validity (days per
 * month, leap years) the same way ajv-formats' own `date` format does internally.
 */
function isOteLocalDateTime(value) {
  const match = WALL_CLOCK.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12) return false;
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= maxDay && hour <= 23 && minute <= 59;
}

const languageSubtags = require("./language-subtags.json");
const LANGUAGE = new Set(languageSubtags.language);
const SCRIPT = new Set(languageSubtags.script);
const REGION = new Set(languageSubtags.region);
const VARIANT = new Set(languageSubtags.variant);

/**
 * Parses the CORE of a BCP 47 (RFC 5646) tag — `language ["-" script] ["-" region] *("-" variant)`
 * — checking each subtag against the real IANA Language Subtag Registry, not just its shape.
 * Deliberately does NOT handle `extlang`, extension singletons (`-u-...`, `-t-...`), private use
 * (`x-...`) or the 26 fixed `grandfathered` tags: none has a real use case for "what language is
 * this event's text in", and `grandfathered` tags are relics RFC 5646 itself deprecates in favor
 * of the modern subtag form. See CHANGES.log #P006 / DECISIONS.md D007.
 *
 * Returns null if the tag doesn't parse; a well-formed tag with an unregistered subtag also
 * returns null — e.g. "en-12345678" is 8 alphanumeric characters, which the grammar's own
 * `5*8alphanum` variant form permits regardless of leading digit (contrary to a first read of
 * the ABNF, only the SEPARATE 4-character `DIGIT 3alphanum` form is digit-led-and-length-4); it
 * fails only because "12345678" was never registered as an actual variant.
 */
function parseCoreLanguageTag(value) {
  if (typeof value !== "string" || value === "") return null;
  const parts = value.split("-");

  const language = parts[0].toLowerCase();
  if (!/^[a-z]{2,8}$/.test(language) || !LANGUAGE.has(language)) return null;

  let i = 1;
  let script = null;
  if (i < parts.length && /^[A-Za-z]{4}$/.test(parts[i])) {
    const candidate = parts[i].toLowerCase();
    if (!SCRIPT.has(candidate)) return null;
    script = candidate;
    i++;
  }

  let region = null;
  if (i < parts.length && /^([A-Za-z]{2}|\d{3})$/.test(parts[i])) {
    const candidate = parts[i].toLowerCase();
    if (!REGION.has(candidate)) return null;
    region = candidate;
    i++;
  }

  const variants = [];
  while (i < parts.length) {
    if (!/^([A-Za-z0-9]{5,8}|\d[A-Za-z0-9]{3})$/.test(parts[i])) return null;
    const candidate = parts[i].toLowerCase();
    if (!VARIANT.has(candidate) || variants.includes(candidate)) return null;
    variants.push(candidate);
    i++;
  }

  return { language, script, region, variants };
}

function isOteLanguageTag(value) {
  return parseCoreLanguageTag(value) !== null;
}

/**
 * Formats the schemas use beyond what ajv-formats provides. Ajv's strict mode refuses to
 * compile a schema referencing an unregistered format, so register these before compiling —
 * the same requirement `annotationKeywords` already has, for the same reason:
 *
 *   for (const f of customFormats) ajv.addFormat(f.name, f.validate);
 */
export const customFormats = [
  { name: "ote-local-date-time", validate: isOteLocalDateTime },
  { name: "ote-language-tag", validate: isOteLanguageTag },
];

/**
 * `$defs.event`'s own constraint: `endDate`, when present, must not be earlier than `startDate`.
 * Both are wall-clock strings of the same form (the schema's own `oneOf` already guarantees
 * that) and, since `dateTime` forbids seconds, always the same fixed width — so ordinary string
 * comparison already matches chronological order, no timezone conversion needed.
 *
 * Unlike `annotationKeywords`, this keyword DOES restrict which documents pass — register it
 * the same way, before compiling:
 *
 *   for (const kw of customKeywords) ajv.addKeyword(kw);
 */
/**
 * `$defs.offer` and `$defs.cfp` share this constraint: `closesAt`, when both it and `opensAt`
 * exist, must not be an instant earlier than `opensAt`. Unlike `orderedDates`, these are
 * `$defs.instant` values — real points in time WITH a mandatory offset, and deliberately not
 * forced to a single one (UTC or otherwise): the offset is whatever the producing system or
 * organiser naturally writes, and forcing a conversion would repeat the exact authoring burden
 * D003 already rejected for `startDate`. Two instants with different offsets can have a string
 * order that disagrees with their real chronological order, so — unlike `orderedDates`, where
 * the fixed-width wall-clock form makes string comparison safe — this parses both values and
 * compares the actual instants.
 */
function parseInstant(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export const customKeywords = [
  {
    keyword: "orderedDates",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) =>
      !schemaValue || typeof data.endDate !== "string" || data.endDate >= data.startDate,
    error: { message: "endDate must not be earlier than startDate" },
  },
  {
    keyword: "orderedInstants",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) => {
      if (!schemaValue || typeof data.opensAt !== "string" || typeof data.closesAt !== "string") {
        return true;
      }
      const opensAt = parseInstant(data.opensAt);
      const closesAt = parseInstant(data.closesAt);
      return opensAt === null || closesAt === null || closesAt >= opensAt;
    },
    error: { message: "closesAt must not be earlier than opensAt" },
  },
  {
    keyword: "distinctTranslationLanguages",
    type: "object",
    schemaType: "boolean",
    /**
     * No `translations` map — the event's own, or one nested in `eligibility`, `partOf`, each
     * `offers[]` or each `image[]` — may carry a key equal to `textLanguage`, the document's own
     * language: that would be a second, possibly contradictory version of the same text under
     * the same language tag, which the field's own description already promises cannot happen.
     * Same set of nested locations already enumerated by the sibling rule that REQUIRES
     * textLanguage wherever any of these maps exists (see `$defs.event`'s own `allOf`) — this
     * just adds the other half, that the language it requires can't also be a translation key.
     * Comparison is case-insensitive: RFC 5646 §2.1.1 treats language tags case-insensitively,
     * so "es" and "ES" name the same language and both must be caught.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || typeof data.textLanguage !== "string") return true;
      const primary = data.textLanguage.toLowerCase();
      const maps = [
        data.translations,
        data.eligibility?.translations,
        data.partOf?.translations,
        ...(Array.isArray(data.offers) ? data.offers.map((o) => o?.translations) : []),
        ...(Array.isArray(data.image) ? data.image.map((i) => i?.translations) : []),
      ];
      return !maps.some(
        (map) => map && typeof map === "object" && Object.keys(map).some((k) => k.toLowerCase() === primary)
      );
    },
    error: { message: "a translations map must not repeat textLanguage's own language" },
  },
  {
    keyword: "uniqueEventIds",
    type: "object",
    schemaType: "boolean",
    /**
     * `feed.events`' own constraint: no two events in the same feed may share an `id`. `id` is
     * "minted once, never rewritten — this is what lets consumers update an event instead of
     * duplicating it"; two events under the same `id` in one document is that promise broken by
     * the very document that made it, not the cross-source deduplication this spec deliberately
     * leaves unsolved (a different feed reusing a URL is not this keyword's problem). Compares
     * `id` by exact string equality only — no URI normalization, no inferring that two different
     * identifiers name the same event. `uniqueItems` can't express this: it compares whole event
     * objects, and two events sharing an `id` typically differ in every other field too.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data.events)) return true;
      const ids = data.events.map((e) => e?.id).filter((id) => typeof id === "string");
      return new Set(ids).size === ids.length;
    },
    error: { message: "events must not repeat the same id" },
  },
];
