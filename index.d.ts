/** The spec version these schemas describe. Matches the `specVersion` field of a document. */
export declare const specVersion: "0.3.0";

/** JSON Schema (draft 2020-12) of a single OTE event. */
export declare const eventSchema: Record<string, unknown>;

/** JSON Schema (draft 2020-12) of an OTE feed. */
export declare const feedSchema: Record<string, unknown>;

/**
 * Both schemas, in the order a validator needs them: the feed references the event by $id,
 * so the event schema must be registered first.
 */
export declare const schemas: Record<string, unknown>[];

/**
 * Quality profiles, NOT validity: a document that fails one is still a valid OTE document.
 * They list the fields that decide whether an event can be found, filtered and subscribed to.
 * Report their failures as warnings; never reject a document for them. Both reference the base
 * schemas by $id, so register `schemas` first.
 */
export declare const eventRecommendedSchema: Record<string, unknown>;
export declare const feedRecommendedSchema: Record<string, unknown>;
export declare const recommendedSchemas: Record<string, unknown>[];
