/**
 * Reads the JSON Schemas and derives the field model the docs are built from.
 *
 * The schema is the single source of truth for everything factual about a field: its name,
 * type, whether it is required, its allowed values and its examples. Prose that a validator
 * cannot check (why `id` must never change, why a cancelled event stays published) is NOT
 * here — it is hand-written, and marked as such in the docs.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Resolves a local (#/$defs/x) or remote-by-$id ($id#/$defs/x) reference. */
function resolve(ref, self, registry) {
  const [base, pointer] = ref.split("#");
  const schema = base ? registry[base] : self;
  if (!schema || !pointer) return undefined;
  return pointer
    .split("/")
    .filter(Boolean)
    .reduce((acc, key) => acc?.[key.replace(/~1/g, "/").replace(/~0/g, "~")], schema);
}

/** Human-readable type, e.g. "string (uri)", "enum: online | hybrid", "string[]". */
function typeOf(subschema, self, registry) {
  const s = subschema.$ref ? { ...resolve(subschema.$ref, self, registry), ...subschema } : subschema;
  if (s.const !== undefined) return `const: ${JSON.stringify(s.const)}`;
  if (s.enum) return `enum: ${s.enum.join(" | ")}`;
  if (s.type === "array") {
    const item = s.items?.$ref ? resolve(s.items.$ref, self, registry) : s.items;
    return `${item?.type ?? "object"}[]`;
  }
  if (s.anyOf) return s.type ?? "string";
  if (s.type === "object" || s.properties) return "object";
  return s.format ? `${s.type} (${s.format})` : (s.type ?? "—");
}

/**
 * Walks a schema's fields, following local $refs into sub-objects.
 * Yields [dottedPath, subschema, meta] — e.g. ["location.venue", {...}, { required, type }].
 */
export function* fieldsOf(schema, registry = {}, node = null, prefix = "", basePointer = null) {
  const isEvent = Boolean(schema.$defs?.event);
  const root = node ?? schema.$defs?.event ?? schema;
  const pointer = basePointer ?? (isEvent ? "/$defs/event" : "");
  const required = new Set([
    ...(root.required ?? []),
    // The top-level allOf adds what a standalone document must carry (specVersion, license).
    ...(prefix ? [] : (schema.allOf ?? []).flatMap((branch) => branch.required ?? [])),
  ]);

  for (const [name, raw] of Object.entries(root.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const target = raw.$ref ? resolve(raw.$ref, schema, registry) : raw;
    const subschema = { ...target, ...raw };

    yield [
      path,
      subschema,
      {
        required: required.has(name),
        type: typeOf(raw, schema, registry),
        description: subschema.description ?? "",
        examples: subschema.examples ?? [],
        enum: subschema.enum,
        // JSON pointer into the schema, so a validator can compile the field by reference
        // instead of in isolation (an isolated copy cannot resolve #/$defs/… refs).
        pointer: `${pointer}/properties/${name}`,
      },
    ];

    const targetPointer = raw.$ref?.startsWith("#") ? raw.$ref.slice(1) : `${pointer}/properties/${name}`;

    // Recurse into sub-objects (location, source) so their fields are documented too.
    if (target?.properties) {
      yield* fieldsOf(schema, registry, target, path, targetPointer);
    }

    // Same for arrays of objects (organizers): `organizers[].name` is a field people need
    // documented, and it is the schema — not prose — that knows it exists.
    // Only within the owning schema: `feed.events[]` and `feed.organizers[]` point at the
    // EVENT schema, and inlining them here would document the whole event twice — once as
    // itself, once nested under the feed. Each field is documented where it is defined.
    if (target?.type === "array") {
      const itemRef = target.items?.$ref;
      const isLocal = !itemRef || itemRef.startsWith("#");
      const items = itemRef ? resolve(itemRef, schema, registry) : target.items;
      if (isLocal && items?.properties) {
        const itemPointer = itemRef ? itemRef.slice(1) : `${targetPointer}/items`;
        yield* fieldsOf(schema, registry, items, `${path}[]`, itemPointer);
      }
    }
  }
}

/**
 * The fields a recommended profile asks for, as a Set of dotted paths.
 *
 * The profile is a plain JSON Schema whose `allOf` branches carry `required` — including the
 * conditional ones (`if`/`then`), which are recommendations too: `endDate` is recommended for a
 * timed event and pointless for an all-day one, and the docs must still show it as recommended.
 * A branch may also ask for a field one level down (`location.address`), so `required` nested
 * under `properties` counts the same. Read from the profile, never re-typed: a list of field
 * names written twice is a list that drifts.
 */
export function recommendedOf(profile) {
  if (!profile) return new Set();
  const nested = (branch) =>
    Object.entries(branch?.properties ?? {}).flatMap(([parent, sub]) =>
      (sub?.required ?? []).map((name) => `${parent}.${name}`)
    );
  const names = (branch) => [
    ...(branch?.required ?? []),
    ...nested(branch),
    ...(branch?.then?.required ?? []),
    ...nested(branch?.then),
  ];
  return new Set([...names(profile), ...(profile.allOf ?? []).flatMap(names)]);
}

export function loadSchemas(version = "v0.1", dir = "spec") {
  const event = JSON.parse(readFileSync(join(dir, version, "event.schema.json"), "utf8"));
  const feed = JSON.parse(readFileSync(join(dir, version, "feed.schema.json"), "utf8"));
  const registry = { [event.$id]: event, [feed.$id]: feed };

  // Recommended profiles arrive in v0.3; v0.1 and v0.2 are frozen without them.
  const profile = (name) => {
    const path = join(dir, version, `${name}.recommended.schema.json`);
    if (!existsSync(path)) return null;
    const schema = JSON.parse(readFileSync(path, "utf8"));
    registry[schema.$id] = schema;
    return schema;
  };
  const profiles = { event: profile("event"), feed: profile("feed") };

  return { event, feed, profiles, registry };
}
