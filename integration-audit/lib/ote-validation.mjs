import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";

const eventSchema = JSON.parse(readFileSync(new URL("../../spec/v0.3/event.schema.json", import.meta.url), "utf8"));
const feedSchema = JSON.parse(readFileSync(new URL("../../spec/v0.3/feed.schema.json", import.meta.url), "utf8"));

export function createAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addFormat("ote-local-date-time", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  ajv.addFormat("ote-language-tag", /^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?(?:-[A-Za-z0-9]{5,8})*$/);

  for (const keyword of [
    "x-inheritsFrom",
    "orderedDates",
    "orderedInstants",
    "distinctTranslationLanguages",
    "distinctPartOfId",
    "distinctLanguageTags",
    "uniqueEventIds",
    "eventsNotNewerThanFeed",
    "eventsRespectInheritedTextLanguage",
    "languagesCoveredByText"
  ]) {
    ajv.addKeyword({ keyword, schemaType: ["boolean", "string"], valid: true });
  }

  ajv.addSchema(eventSchema);
  ajv.addSchema(feedSchema);
  return ajv;
}

export function validateEvent(event) {
  const ajv = createAjv();
  const validate = ajv.getSchema(eventSchema.$id) || ajv.compile(eventSchema);
  if (!validate(event)) {
    throw new Error(`Invalid OTE event:\n${ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }
}

export function validateFeed(feed) {
  const ajv = createAjv();
  const validate = ajv.getSchema(feedSchema.$id) || ajv.compile(feedSchema);
  if (!validate(feed)) {
    throw new Error(`Invalid OTE feed:\n${ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }
}

export function isFeed(document) {
  return document && typeof document === "object" && Array.isArray(document.events);
}
