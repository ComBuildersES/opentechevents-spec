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
