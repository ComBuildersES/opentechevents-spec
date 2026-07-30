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

/**
 * The branches an array item may take. One entry for a plain `items`, several when the item is
 * a `oneOf` — `image` accepts a bare URL string or an object that adds alt text, and a docs
 * table that showed only one of the two would document a form nobody can write.
 */
function itemBranches(items, self, registry) {
  if (!items) return [];
  const branches = items.oneOf ?? items.anyOf ?? [items];
  return branches.map((branch) => (branch.$ref ? resolve(branch.$ref, self, registry) : branch));
}

/** Human-readable type, e.g. "string (uri)", "enum: online | hybrid", "string[]", "(string | object)[]". */
function typeOf(subschema, self, registry) {
  const s = subschema.$ref ? { ...resolve(subschema.$ref, self, registry), ...subschema } : subschema;
  if (s.const !== undefined) return `const: ${JSON.stringify(s.const)}`;
  if (s.enum) return `enum: ${s.enum.join(" | ")}`;
  if (s.type === "array") {
    const kinds = [...new Set(itemBranches(s.items, self, registry).map((b) => b?.type ?? "object"))];
    return kinds.length > 1 ? `(${kinds.join(" | ")})[]` : `${kinds[0] ?? "object"}[]`;
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
    // An item may also be a `oneOf` of forms (image: a bare URL, or an object with alt); the
    // object branch is the one that carries fields, and it is the one that gets documented.
    if (target?.type === "array") {
      const forms = target.items?.oneOf ?? target.items?.anyOf ?? [target.items];
      for (const [index, form] of forms.entries()) {
        const itemRef = form?.$ref;
        const isLocal = !itemRef || itemRef.startsWith("#");
        const items = itemRef ? resolve(itemRef, schema, registry) : form;
        if (!isLocal || !items?.properties) continue;
        const branch = target.items?.oneOf || target.items?.anyOf ? `/${index}` : "";
        const itemPointer = itemRef
          ? itemRef.slice(1)
          : `${targetPointer}/items${branch ? `/oneOf${branch}` : ""}`;
        yield* fieldsOf(schema, registry, items, `${path}[]`, itemPointer);
      }
    }
  }
}

/* ---------- the constraints that are not a plain `required` ---------- */

/**
 * A schema enforces more than "this field must be there": `location` needs a venue OR an
 * onlineUrl, a non-zero `price` drags `currency` in with it, an `image` that carries
 * translations must carry the `alt` they translate. Those rules are as normative as
 * `required` and were invisible in the docs — a reference that shows every field as
 * "optional" while the validator rejects the document is worse than no reference.
 *
 * Each rule is yielded STRUCTURED (a kind plus the field names it talks about), never as a
 * sentence: the phrasing belongs to whoever renders it, in whichever language. The branch's
 * own `description`, when the schema author wrote one, travels along as `note` — it is the
 * rationale, and no generated sentence can replace it.
 */

/** What an `if` looks at, as far as we can name it: a value, a bound, or mere presence. */
function conditionOf(when) {
  const required = when?.required ?? [];
  if (required.length !== 1) return null; // more than one antecedent: not phrasable, skip
  const field = required[0];
  const sub = when?.properties?.[field];
  if (sub?.const !== undefined) return { field, equals: sub.const };
  if (sub?.exclusiveMinimum !== undefined) return { field, above: sub.exclusiveMinimum };
  if (sub?.minimum !== undefined) return { field, atLeast: sub.minimum };
  return { field, present: true };
}

/** The rules an `if`/`then` branch states, if we can name them. */
function conditionalRules(branch) {
  const when = conditionOf(branch.if);
  if (!when) return [];
  const rules = [];
  for (const name of branch.then?.required ?? []) {
    rules.push({ kind: "conditional", when, field: name, note: branch.description });
  }
  for (const [name, sub] of Object.entries(branch.then?.properties ?? {})) {
    if (sub?.not?.const !== undefined) {
      rules.push({ kind: "conditionalNot", when, field: name, value: sub.not.const, note: branch.description });
    }
  }
  return rules;
}

/** The rules one object states about itself. `node` is already $ref-resolved. */
function rulesOfObject(node) {
  const rules = [];

  // `anyOf` whose every branch is a bare `required`: "at least one of these".
  const branches = node.anyOf ?? [];
  const asRequired = branches.every((b) => Object.keys(b).every((k) => k === "required" || k === "description"));
  if (branches.length && asRequired) {
    const fields = [...new Set(branches.flatMap((b) => b.required ?? []))];
    if (fields.length) {
      rules.push({
        kind: "anyOfRequired",
        fields,
        note: branches.map((b) => b.description).find(Boolean),
      });
    }
  }

  for (const [when, then] of Object.entries(node.dependentRequired ?? {})) {
    rules.push({ kind: "dependent", when: { field: when, present: true }, fields: then });
  }

  if (node.minProperties) rules.push({ kind: "minProperties", min: node.minProperties });

  for (const branch of [node, ...(node.allOf ?? [])]) {
    if (branch?.if) rules.push(...conditionalRules(branch));
  }

  // A branch we cannot phrase still has to be readable: if its author explained it, the
  // explanation IS the rule. Silently dropping it is how the docs drifted in the first place.
  for (const branch of node.allOf ?? []) {
    const named = branch.if ? conditionalRules(branch).length : 0;
    if (!named && branch.description) rules.push({ kind: "prose", note: branch.description });
  }
  for (const key of ["oneOf", "anyOf"]) {
    if (key === "anyOf" && asRequired) continue;
    for (const branch of node[key] ?? []) {
      if (branch.description) rules.push({ kind: "prose", note: branch.description });
    }
  }

  return rules;
}

/**
 * Walks a schema the way `fieldsOf` does, yielding [ownerPath, rule] — the owner being the
 * object the rule constrains, `""` for the document itself. Same traversal, so a rule cannot
 * end up hanging off an object the field table does not show.
 */
export function* constraintsOf(schema, registry = {}, node = null, prefix = "") {
  const root = node ?? schema.$defs?.event ?? schema;
  // The document itself: its own rules, plus the ones the wrapping allOf adds ($ref branches
  // carry no rules of their own, and their `required` is already the field table's business).
  const wrapping = prefix || root === schema ? [] : (schema.allOf ?? []).filter((b) => !b.$ref);
  const own = [...rulesOfObject(root), ...wrapping.flatMap(rulesOfObject)];
  for (const rule of own) yield [prefix, rule];

  for (const [name, raw] of Object.entries(root.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const target = raw.$ref ? resolve(raw.$ref, schema, registry) : raw;
    if (target?.properties) yield* constraintsOf(schema, registry, target, path);
    if (target?.type === "array") {
      const forms = target.items?.oneOf ?? target.items?.anyOf ?? [target.items];
      for (const form of forms) {
        const itemRef = form?.$ref;
        if (itemRef && !itemRef.startsWith("#")) continue;
        const items = itemRef ? resolve(itemRef, schema, registry) : form;
        if (!items?.properties) continue;
        yield* constraintsOf(schema, registry, items, `${path}[]`);
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
