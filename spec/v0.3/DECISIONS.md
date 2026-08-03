# Design decisions

A record of the deliberate design choices behind OTE Spec, written so any of them can be **reopened on purpose** rather than overturned by accident. Each entry states what was decided, what else was considered, and what would have to change for the decision to be worth revisiting — that last part matters most: it is the difference between "this is arbitrary, argue with it" and "this is load-bearing, here is what breaks."

This is not the same list as [Open questions](README.md#preguntas-abiertas) in the main README: those are things the spec has **not** decided yet. Everything below **has** been decided — recorded here so the reasoning survives past the person who made the call.

Two kinds of entries:
- **Full entries** — decisions made during the schema.org audit (see root [`CHANGES.log`](../../CHANGES.log) for the full deliberation, including the evidence and the back-and-forth that led here). Written directly in English because that log is Spanish-only and audit-specific.
- **Indexed decisions** — older decisions already argued at length in [`README.md`](README.md) (Spanish). Rather than duplicate that prose, each gets a short English summary and a link to the full reasoning.

---

## Full entries

### D001 — Temporal fields must be calendar-valid, not just lexically shaped

**Status:** Decided 2026-08-03. See `CHANGES.log` #P001 for the full trail (Codex's proposal, the evidence, the review).

**Context.** `event.schema.json`'s three shared temporal definitions (`$defs.date`, `$defs.dateTime`, `$defs.instant`) validated only the *lexical shape* of a value via regex — four digits, a dash, two digits, and so on — never whether the value was a value a calendar could actually produce. `"2026-99-99T99:99"` validated as a well-formed event `startDate`.

**Decision.** All three now enforce real calendar validity (correct day-per-month counts, leap years, valid hour/minute/second ranges):
- `$defs.date` → ajv-formats' standard `format: "date"`.
- `$defs.instant` → ajv-formats' standard `format: "date-time"` (with a mandatory offset, which is what OTE's `instant` concept already required).
- `$defs.dateTime` — OTE's own concept, a wall-clock date-time *without* an offset by design (see D003 below) — has no equivalent in RFC 3339, so ajv-formats cannot cover it. A custom Ajv format (`ote-local-date-time`) ships in the npm package's `customFormats` export, alongside the existing `annotationKeywords` mechanism used for `x-inheritsFrom`. Consumers using Ajv in `strict: true` must register it, exactly as they already must for `annotationKeywords`.

**Alternatives considered.**
- *Leave it to consumers to validate further.* Rejected: it turns OTE's own validity into a promise the spec cannot back, and different exporters would end up accepting different sets of "valid" documents.
- *Simple range checks only (month 01–12, hour 00–23, …).* Rejected: still accepts `2026-02-31`, which is exactly the class of bug this decision exists to close.
- *A single hand-written regex encoding calendar validity (including leap years) for `dateTime`, avoiding any custom Ajv code.* Considered and rejected: correctness-critical logic like leap-year and days-per-month handling is easy to get subtly wrong in an unreviewable ~500-character regex, and hard to verify by inspection. A ~15-line, directly testable function is safer even though it costs the "zero custom code" portability story ajv-formats otherwise gives for free.

**Compatibility impact.** Restrictive by design: only rejects documents that already contained impossible dates/times, which no real calendar, `.ics` export, or scheduling tool can ever produce. No real, previously-valid document becomes invalid.

**Revisit if:** a real-world data source is found that legitimately needs to express a date/time OTE now rejects as impossible (this should not be possible by construction, so finding one would mean the calendar-validity logic itself has a bug — check that first).

---

### D002 — `timezone` must be a real IANA identifier, error not warning

**Status:** Decided 2026-08-03. See `CHANGES.log` #P002 (and the follow-up note about the data source, D003 territory but logged under P002) for the full trail.

**Context.** `timezone` is a required field whose entire normative purpose is to "turn a wall-clock `startDate` into an unambiguous instant." It only validated the *shape* of the string (`Area/Location`, or literally `UTC`) via regex — `"Europe/Atlantida"` validated as a well-formed timezone despite not existing.

**Decision.** `timezone` must be one of a generated `enum` of real IANA time zone identifiers. Failing this is a validation **error**, not a warning: unlike the "recommended fields" tier (see D005 below), a `timezone` that doesn't resolve to a real zone doesn't just make the document less useful — it fails to do the one thing the field exists for, the same way an impossible date does.

**How the enum is generated (and why this took two attempts).** The first version of this decision proposed sourcing the list from `Intl.supportedValuesOf('timeZone')` — the running JavaScript engine's own idea of the canonical zone list. Verified empirically before implementing and found to be the wrong source: which of two equivalent names counts as "canonical" depends on which tzdata snapshot the engine's ICU build happens to bundle, and different Node versions disagree — one build considers `Europe/Kiev` canonical and doesn't recognize `Europe/Kyiv` at all (the 2022 rename), even though both resolve to the same zone. Regenerating the enum on a different machine could silently flip which documents validate — exactly the instability this decision exists to prevent, just relocated from the `timezone` field to the maintenance script.

The corrected source is the **official IANA tzdata release** (`https://data.iana.org/time-zones/`), parsed directly by `scripts/update-timezones.mjs`: every `Zone` and every `Link` (historical alias) across the zone files is added to the enum, so both an old and a new name for the same zone stay valid regardless of who regenerates the list or when. `UTC` is force-included (it does not appear as a `Zone`/`Link` in the data itself). The script also stamps the tzdata release version into the schema's `$comment` for provenance.

**Alternatives considered.**
- *`Intl.supportedValuesOf('timeZone')` as the source.* Rejected after testing — see above.
- *Runtime/"semantic" validation, delegated to each consumer's own `Intl` (or equivalent).* Rejected: forces every implementation to write custom code to answer a question the spec should be able to answer on its own with a generic JSON Schema validator — the same reasoning that already justifies using ajv-formats for dates instead of ad hoc checks.
- *Warning instead of error.* Rejected: `timezone` is required, and a value that fails to resolve doesn't clear the bar of "is this an OTE event", it's in the same category as an impossible date (D001), not the same category as a missing `image` (D005).

**Compatibility impact.** Restrictive, but only rejects genuinely invented or malformed zone names. No real calendar export can emit a zone that was never a real IANA identifier. Historical renames are explicitly *not* a compatibility risk here, because both names are kept valid — that was the entire point of switching the data source.

**Revisit if:** IANA ever removes rather than renames a zone identifier outright (historically this has not happened — renames become links, they don't disappear), or if the maintenance burden of periodically rerunning `scripts/update-timezones.mjs` turns out to be higher than expected (it is a manual, occasional script, not part of CI).

---

### D003 — Event times are wall-clock + separate timezone, never a precomputed UTC instant

**Status:** Long-standing design decision, predates this audit. Documented in Spanish at [README.md § Fechas: reloj de pared, no instantes](README.md#fechas-reloj-de-pared-no-instantes). Recorded here because D001 and D002 both depend on understanding *why* this split exists — a reviewer who doesn't know this will keep proposing to "simplify" it away.

**Summary.** `startDate`/`endDate` store what a poster would say — "18:30" — plus a separate IANA `timezone` field, deliberately *not* a UTC offset baked in at publish time. If a country changes its DST rules between when an event is published and when it happens, this representation keeps computing the correct instant automatically; a precomputed UTC instant would not. This mirrors why iCalendar itself uses floating local time plus `TZID` rather than absolute UTC for `DTSTART`. Metadata and deadlines (`updatedAt`, `cfp.closesAt`, `offers[].opensAt`, …) are the opposite case on purpose: those use `$defs.instant`, WITH a mandatory offset, because a deadline is a fixed moment regardless of what any calendar's rules do later — see [README.md § Fechas límite: por qué llevan offset, y `startDate` no](README.md#fechas-límite-por-qué-llevan-offset-y-startdate-no).

**Revisit if:** someone proposes representing `startDate` as an absolute instant "for simplicity" — that trade-off has already been made, and the direction that looks simpler (store UTC) is the one known to produce wrong times for future events after a timezone rule change.

---

## Indexed decisions

Already argued in full in `README.md`; summarized here for discoverability.

| Decision | Summary | Full reasoning |
| --- | --- | --- |
| Two-tier validity vs. usefulness | A document can be a *valid* OTE event with only 6 required fields and still be useless for discovery. Rather than making more fields required, quality is a separate, non-blocking schema (`*.recommended.schema.json`) whose failures are warnings, never rejections. | [§ Válido no es lo mismo que útil](README.md#válido-no-es-lo-mismo-que-útil-los-campos-recomendados) |
| `location` and `attendanceMode` are separate fields | "Where" and "can I attend from home" are different questions that don't reliably derive from one another; collapsing them would force guessing. | [§ `location` y `attendanceMode` no son redundantes](README.md#location-y-attendancemode-no-son-redundantes) |
| `location.address` is structured, but not required even when `location` is recommended | Google needs address parts to validate `schema.org/Event`, but a meetup at "the bar on the corner" has no postal address to give — recommending `address` would teach organizers to ignore recommendations. | [§ `location.address`](README.md#locationaddress-la-dirección-que-se-valida-por-partes) |
| A cancelled/postponed event stays published, never deleted | Removing it leaves a dead reference in subscribers' calendars; `status` communicates what happened without breaking incremental sync. | [§ `status`](README.md#status-un-evento-cancelado-sigue-publicado) |
| No `eventSchedule`-style recurrence; `partOf` groups occurrences instead | schema.org's recurrence model assumes a rule generates occurrences; real recurring meetups drift from any rule (skipped months, moved rooms) more often than they follow one. | [§ Por qué no `eventSchedule`](README.md#por-qué-no-eventschedule-de-schemaorg) |
| `eligibility` is not a `tag` | "Who is allowed in" is a gate, not a topic — conflating it with free-text topical tags makes it unfilterable and easy to miss. | [§ `eligibility`](README.md#eligibility-quién-puede-entrar--y-por-qué-no-es-un-tag) |
| `offers`, `cfp`, and `eligibility` are deliberately not "recommended" fields | Most events have none of these (no ticketing, no call for papers, no restricted door), and a source importing a bare `.ics` has no way to answer the question — a warning that can only be silenced by inventing data is worse than no warning. | [§ Qué se recomienda, y por qué ese y no otro](README.md#qué-se-recomienda-y-por-qué-ese-y-no-otro) |
| Once published, a spec version is frozen forever | `spec/v0.1/` and `spec/v0.2/` are never edited again; changes go to a new `spec/vX/` directory. This is what lets a document's `specVersion` field mean something to a consumer years later. | [root README.md](../../README.md), spec/v0.3/README.md intro |
| Two kinds of extension, deliberately distinguished | Local, undeclared extension fields vs. namespaced/registered ones serve different trust levels and shouldn't be conflated into one escape hatch. | [§ Dos tipos de extensión](README.md#dos-tipos-de-extensión-y-por-qué-distinguirlos) |

---

## How to use this document

Adding a new full entry does **not** require going through the Codex/Claude audit workflow in `CHANGES.log` — that workflow is for the schema.org audit specifically. Any decision worth recording here should:
1. State the decision and the context that produced it.
2. List the alternatives that were seriously considered, and why each lost.
3. End with a **Revisit if** line — the condition under which re-opening the decision would be legitimate, not just a matter of taste.

A decision without a "Revisit if" is usually a sign the trade-off wasn't actually thought through.
