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

/**
 * Formats the schemas use beyond what ajv-formats provides. Ajv's strict mode refuses to
 * compile a schema referencing an unregistered format, so register these before compiling —
 * the same requirement `annotationKeywords` already has, for the same reason:
 *
 *   for (const f of customFormats) ajv.addFormat(f.name, f.validate);
 */
export const customFormats = [{ name: "ote-local-date-time", validate: isOteLocalDateTime }];

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
export const customKeywords = [
  {
    keyword: "orderedDates",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) =>
      !schemaValue || typeof data.endDate !== "string" || data.endDate >= data.startDate,
    error: { message: "endDate must not be earlier than startDate" },
  },
];
