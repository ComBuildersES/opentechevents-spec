#!/usr/bin/env node
/**
 * Generates the field reference FROM the schemas. Nothing here is written by hand.
 *
 *   npm run build-reference            → writes the generated files
 *   npm run build-reference -- --check → fails if they are stale or a translation is missing (CI)
 *
 * What is generated: everything factual about a field (name, type, required, allowed values,
 * examples). What is NOT: the rules a validator cannot check — why `id` must never change, why
 * a cancelled event stays published. Those live, hand-written, in spec/<version>/README.md.
 *
 * Outputs:
 *   spec/<version>/reference.<lang>.md   → for people reading the repo
 *   docs/data/reference.json             → for the website, which renders it in both languages
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { constraintsOf, fieldsOf, loadSchemas, recommendedOf } from "./schema-model.mjs";

const VERSION = "v0.3";
const BASE_LANG = "en"; // the schema's own `description` fields
const check = process.argv.includes("--check");

const { event, feed, profiles, registry } = loadSchemas(VERSION);
const i18nDir = join("spec", VERSION, "i18n");
const locales = { [BASE_LANG]: null };
if (existsSync(i18nDir)) {
  for (const file of readdirSync(i18nDir).filter((f) => f.endsWith(".json"))) {
    locales[file.replace(".json", "")] = JSON.parse(readFileSync(join(i18nDir, file), "utf8"));
  }
}

/**
 * A constraint, said in words. Phrased HERE and not in the page's JavaScript: the same rule is
 * printed by the markdown reference and by the website, and a sentence assembled twice is a
 * sentence that ends up saying two different things. The renderers receive it ready to print.
 */
const PHRASE = {
  en: {
    anyOfRequired: (r) => `Requires at least one of: ${r.fields.map(code).join(", ")}.`,
    dependent: (r) => `With ${code(r.when.field)}, ${r.fields.map(code).join(", ")} is required.`,
    conditional: (r) => `${when.en(r.when)}, ${code(r.field)} is required.`,
    conditionalNot: (r) => `${when.en(r.when)}, ${code(r.field)} must not be ${code(JSON.stringify(r.value))}.`,
    minProperties: (r) =>
      r.min === 1 ? "Must carry at least one property." : `Must carry at least ${r.min} properties.`,
    prose: () => "",
  },
  es: {
    anyOfRequired: (r) => `Requiere al menos uno de: ${r.fields.map(code).join(", ")}.`,
    dependent: (r) => `Con ${code(r.when.field)}, ${r.fields.map(code).join(", ")} es obligatorio.`,
    conditional: (r) => `${when.es(r.when)}, ${code(r.field)} es obligatorio.`,
    conditionalNot: (r) => `${when.es(r.when)}, ${code(r.field)} no puede ser ${code(JSON.stringify(r.value))}.`,
    minProperties: (r) =>
      r.min === 1 ? "Debe llevar al menos una propiedad." : `Debe llevar al menos ${r.min} propiedades.`,
    prose: () => "",
  },
};

const code = (text) => `\`${text}\``;

const when = {
  en: (w) =>
    w.equals !== undefined
      ? `When ${code(w.field)} is ${code(JSON.stringify(w.equals))}`
      : w.above !== undefined
        ? `When ${code(w.field)} is above ${w.above}`
        : w.atLeast !== undefined
          ? `When ${code(w.field)} is ${w.atLeast} or more`
          : `With ${code(w.field)}`,
  es: (w) =>
    w.equals !== undefined
      ? `Cuando ${code(w.field)} es ${code(JSON.stringify(w.equals))}`
      : w.above !== undefined
        ? `Cuando ${code(w.field)} es mayor que ${w.above}`
        : w.atLeast !== undefined
          ? `Cuando ${code(w.field)} es ${w.atLeast} o más`
          : `Con ${code(w.field)}`,
};

/**
 * The object a field is required INSIDE, when that object is itself not required — `source.name`
 * is required, but only once there is a `source`. Saying "required" flat would be a lie in a
 * minimal document, and saying "optional" would be a lie in any document that has a `source`.
 * `null` for a field a minimal valid document must carry.
 */
function requiredIn(fields, field) {
  if (!field.required) return null;
  const parts = field.path.split(".");
  let prefix = "";
  for (const part of parts.slice(0, -1)) {
    prefix = prefix ? `${prefix}.${part}` : part;
    // The parent of `organizers[].name` is the field named `organizers`: `[]` means "each item
    // of", it is not part of the parent's name.
    const parent = prefix.replace(/\[\]$/, "");
    if (fields.some((f) => f.path === parent && !f.required)) return parts.slice(0, -1).join(".");
  }
  return null;
}

/** Stable key for a rule's `note`, so the translation of a rule survives adding another. */
const ruleKey = (schemaName, owner, index) => `${schemaName}${owner ? `.${owner}` : ""}#${index}`;

/** The model both renderers consume. One source, many outputs. */
const model = {
  specVersion: "0.3.0",
  languages: Object.keys(locales),
  schemas: [
    { name: "event", schema: event },
    { name: "feed", schema: feed },
  ].map(({ name, schema }) => {
    // Recommended is read from the profile schema, not declared here: one list, one place.
    // Paths are dotted, so a profile can ask for `location.address` as well as for `location`.
    const recommended = recommendedOf(profiles[name]);
    // Rules are numbered within their owner, not across the schema: adding a rule to `offers[]`
    // must not renumber — and so silently mistranslate — the one on `source`.
    const seen = {};
    const rules = [...constraintsOf(schema, registry)].map(([owner, rule]) => {
      seen[owner] = (seen[owner] ?? -1) + 1;
      const entry = { ...rule, owner, key: ruleKey(name, owner, seen[owner]) };
      entry.text = { [BASE_LANG]: PHRASE[BASE_LANG][rule.kind](rule) };
      if (rule.note) entry.note = { [BASE_LANG]: rule.note };
      return entry;
    });
    const fields = [...fieldsOf(schema, registry)].map(([path, , meta]) => ({
      path,
      type: meta.type,
      required: meta.required,
      recommended: !meta.required && recommended.has(path),
      examples: meta.examples,
      // Only carried when the schema declares one. Absent here is a claim, not a gap: the field
      // has no default, and a consumer that meets it missing knows nothing — see the legend.
      ...(meta.default === undefined ? {} : { default: meta.default }),
      ...(meta.inheritsFrom === undefined ? {} : { inheritsFrom: meta.inheritsFrom }),
      description: { [BASE_LANG]: meta.description },
    }));
    for (const field of fields) field.requiredIn = requiredIn(fields, field);

    return {
      name,
      rules,
      title: { [BASE_LANG]: schema.title },
      description: { [BASE_LANG]: schema.description },
      fields,
    };
  }),
};

// Inheritance is declared once, on the side that falls back — `event.license` says it takes
// `feed.license`. The feed field is told from that, never annotated by hand: two annotations
// facing each other is two chances to disagree about which fields a feed lends its events.
{
  const byName = Object.fromEntries(model.schemas.map((s) => [s.name, s]));
  for (const field of byName.event?.fields ?? []) {
    if (!field.inheritsFrom) continue;
    const [schemaName, ...rest] = field.inheritsFrom.split(".");
    const lender = byName[schemaName]?.fields.find((f) => f.path === rest.join("."));
    if (!lender) throw new Error(`x-inheritsFrom points at a field that does not exist: ${field.inheritsFrom}`);
    lender.inheritedBy = `event.${field.path}`;
  }
}

// Merge translations, and refuse to ship a half-translated reference.
const missing = [];
for (const [lang, dict] of Object.entries(locales)) {
  if (!dict) continue;
  for (const schema of model.schemas) {
    schema.title[lang] = dict.schemas?.[schema.name]?.title;
    schema.description[lang] = dict.schemas?.[schema.name]?.description;
    if (!schema.title[lang]) missing.push(`${lang}: schemas.${schema.name}.title`);
    for (const field of schema.fields) {
      const key = `${schema.name}.${field.path}`;
      const text = dict.fields?.[key];
      if (!text) missing.push(`${lang}: fields["${key}"]`);
      field.description[lang] = text ?? field.description[BASE_LANG];
    }
    // A rule's sentence is generated per language; only the author's rationale is translated.
    for (const rule of schema.rules) {
      rule.text[lang] = (PHRASE[lang] ?? PHRASE[BASE_LANG])[rule.kind](rule);
      if (!PHRASE[lang]) missing.push(`${lang}: no phrasing for the constraints (PHRASE.${lang})`);
      if (!rule.note) continue;
      const note = dict.rules?.[rule.key];
      if (!note) missing.push(`${lang}: rules["${rule.key}"]`);
      rule.note[lang] = note ?? rule.note[BASE_LANG];
    }
  }
}

const md = (lang) => {
  const t = {
    en: {
      intro: `Generated from the schemas — do not edit by hand. Run \`npm run build-reference\`.`,
      rules: `The rules a validator cannot check (why \`id\` must never change, why a cancelled event stays published) are in [README.md](README.md).`,
      field: "Field",
      type: "Type",
      req: "Level",
      def: "Default",
      inherited: (parent) => `the feed's \`${parent.replace(/^feed\./, "")}\``,
      lends: "every event that omits it",
      desc: "Description",
      ex: "Examples",
      yes: "required",
      rec: "recommended",
      no: "optional",
      inParent: (parent) => `within \`${parent}\``,
      legend:
        "**Level** — `required`: the validator rejects the document without it. `recommended`: valid without it, but a checker warns — these are the fields that decide whether the event can be found, filtered and subscribed to. They are read from [`event.recommended.schema.json`](event.recommended.schema.json) and [`feed.recommended.schema.json`](feed.recommended.schema.json).",
      levelInParent:
        "`required within X` means required **inside an object that is itself optional**: a minimal document needs neither, but a document that has an `X` must give the field. Omitting the whole object stays valid.",
      defaultLegend:
        "**Default** — the value a consumer assumes when the field is absent. Some are not literals: inside a feed, an event that omits `license`, `organizers`, `textLanguage` or `specVersion` takes the feed's, which is what makes a feed cheap to publish — said once, never repeated per event. A blank cell is a statement, not an omission: the field has **no default**, and absent means *unknown* — never the reassuring value. An event with no `attendanceMode` is not in-person, an offer with no `availability` is not on sale.",
      constraints: "Constraints",
      constraintsLead:
        "Rules the schema enforces on whole objects, which no single field's level can express. Generated from the schemas too — a validator rejects a document that breaks them.",
      constraintsDoc: "the document",
    },
    es: {
      intro: `Generado a partir de los schemas — no lo edites a mano. Ejecuta \`npm run build-reference\`.`,
      rules: `Las reglas que un validador no puede comprobar (por qué el \`id\` no cambia nunca, por qué un evento cancelado sigue publicado) están en [README.md](README.md).`,
      field: "Campo",
      type: "Tipo",
      req: "Nivel",
      def: "Por defecto",
      inherited: (parent) => `el \`${parent.replace(/^feed\./, "")}\` del feed`,
      lends: "todo evento que lo omita",
      desc: "Descripción",
      ex: "Ejemplos",
      yes: "obligatorio",
      rec: "recomendado",
      no: "opcional",
      inParent: (parent) => `dentro de \`${parent}\``,
      legend:
        "**Nivel** — `obligatorio`: sin él, el validador rechaza el documento. `recomendado`: el documento es válido sin él, pero un checker avisa — son los campos que deciden si el evento se puede encontrar, filtrar y seguir. Se leen de [`event.recommended.schema.json`](event.recommended.schema.json) y [`feed.recommended.schema.json`](feed.recommended.schema.json).",
      levelInParent:
        "`obligatorio dentro de X` significa obligatorio **dentro de un objeto que es opcional**: un documento mínimo no necesita ninguno de los dos, pero un documento que traiga `X` tiene que dar el campo. Omitir el objeto entero sigue siendo válido.",
      defaultLegend:
        "**Por defecto** — el valor que un consumidor asume cuando el campo no está. Algunos no son literales: dentro de un feed, el evento que omite `license`, `organizers`, `textLanguage` o `specVersion` toma el del feed, y eso es lo que hace barato publicar un feed — se dice una vez y ningún evento lo repite. Una celda vacía afirma algo, no es un olvido: el campo **no tiene valor por defecto**, y su ausencia significa *desconocido* — nunca el valor tranquilizador. Un evento sin `attendanceMode` no es presencial, una entrada sin `availability` no está a la venta.",
      constraints: "Restricciones",
      constraintsLead:
        "Reglas que el schema impone sobre objetos completos y que el nivel de un campo suelto no puede expresar. También generadas de los schemas: el validador rechaza el documento que las incumple.",
      constraintsDoc: "el documento",
    },
  }[lang];

  const lines = [
    `# ${lang === "es" ? "Referencia de campos" : "Field reference"} — OTE Spec ${model.specVersion}`,
    "",
    `> 🤖 ${t.intro}`,
    ">",
    `> ${t.rules}`,
    "",
    t.legend,
    "",
    t.levelInParent,
    "",
    t.defaultLegend,
    "",
  ];

  for (const schema of model.schemas) {
    // The column appears only where there is something to put in it: a table of blank cells
    // teaches nothing, and the legend already says what a blank one means where they exist.
    const hasDefaults = schema.fields.some((f) => f.default !== undefined || f.inheritsFrom || f.inheritedBy);
    lines.push(`## \`${schema.name}\` — ${schema.title[lang]}`, "", schema.description[lang], "");
    lines.push(
      `| ${t.field} | ${t.type} | ${t.req} |${hasDefaults ? ` ${t.def} |` : ""} ${t.desc} | ${t.ex} |`,
      `| --- | --- | :---: |${hasDefaults ? " :---: |" : ""} --- | --- |`
    );
    for (const f of schema.fields) {
      const ex = f.examples.map((e) => `\`${JSON.stringify(e)}\``).join("<br>") || "—";
      // An enum renders as "a | b | c": unescaped, those pipes become table columns.
      const cell = (s) => String(s).replace(/\|/g, "\\|");
      const level = f.required
        ? `**${t.yes}**${f.requiredIn ? ` ${t.inParent(f.requiredIn)}` : ""}`
        : f.recommended
          ? `_${t.rec}_`
          : t.no;
      const def =
        f.default !== undefined
          ? ` \`${JSON.stringify(f.default)}\` |`
          : f.inheritsFrom
            ? ` ${t.inherited(f.inheritsFrom)} |`
            : f.inheritedBy
              ? ` → ${t.lends} |`
              : "";
      lines.push(
        `| \`${f.path}\` | ${cell(f.type)} | ${level} |${hasDefaults ? def || " |" : ""} ${cell(
          f.description[lang]
        )} | ${cell(ex)} |`
      );
    }
    lines.push("");

    if (schema.rules.length) {
      lines.push(`### ${t.constraints}`, "", t.constraintsLead, "");
      for (const rule of schema.rules) {
        const owner = rule.owner ? `\`${rule.owner}\`` : t.constraintsDoc;
        const said = [rule.text[lang], rule.note?.[lang]].filter(Boolean).join(" ");
        lines.push(`- **${owner}** — ${said}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
};

const outputs = [
  ...Object.keys(locales).map((lang) => [join("spec", VERSION, `reference.${lang}.md`), md(lang)]),
  [join("docs", "data", "reference.json"), JSON.stringify(model, null, 2) + "\n"],
];

if (check) {
  const stale = outputs.filter(([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content);
  for (const [path] of stale) console.log(`  FAIL  ${path} is stale — run: npm run build-reference`);
  for (const key of missing) console.log(`  FAIL  missing translation → ${key}`);
  if (stale.length || missing.length) process.exit(1);
  console.log(`  ok    reference is generated from the schemas and fully translated (${model.languages.join(", ")})`);
} else {
  for (const [path, content] of outputs) {
    writeFileSync(path, content);
    console.log(`  wrote ${path}`);
  }
  if (missing.length) {
    console.log(`\n${missing.length} missing translation(s):`);
    for (const key of missing) console.log(`  - ${key}`);
    process.exit(1);
  }
}
