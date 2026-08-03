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

### D004 — `dateTime` has no seconds, and `endDate` must not precede `startDate`

**Status:** Decided 2026-08-03. See `CHANGES.log` #P003 for the full trail.

**Context.** Nothing checked the relationship between `startDate` and `endDate` — an event could end before it started and still validate (`{"startDate": "...T20:00:00", "endDate": "...T18:00:00", ...}`). While reviewing how to implement that check, a second, sharper problem showed up: `$defs.dateTime` allowed optional seconds independently on each field, and comparing the two strings directly — the natural way to check order without a timezone conversion (see D003) — breaks exactly there. `"2026-08-03T18:30:00" > "2026-08-03T18:30"` is `true` in plain string comparison, even though both denote the same nominal wall-clock minute. A naive `endDate >= startDate` string check would have flagged that pair as "inverted."

**Decision.** Two changes, landed together because the second is what makes the first correct:
1. `$defs.dateTime` no longer allows seconds at all (`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$`, the optional `(:\d{2})?` group removed). This is the field's own description already said in spirit — "the hour on a poster" — now enforced. A survey of every `startDate`/`endDate` in the repo's own example corpus found seconds present only as `:00`, never anything else: no real use case lost precision it needed.
2. A new Ajv keyword, `orderedDates` (shipped via a new `customKeywords` export, registered the same way `annotationKeywords`/`customFormats` already are), rejects `endDate < startDate` on `$defs.event`. Equality is allowed — zero-duration events are not this decision's problem to solve. Because (1) makes every wall-clock `dateTime` the same fixed width, plain string comparison is now safe and needs no normalization step.

**Alternatives considered.**
- *Keep seconds optional, normalize the missing component to `:00` inside the comparison keyword instead of changing the wire format.* This was the first fix proposed (during review, before the format-level fix). Rejected in favor of removing seconds entirely: it fixes the same bug with less code (no normalization logic to maintain) and simplifies the field itself, at the cost of losing sub-minute precision from `.ics` sources that supply non-zero seconds — a case the repo's own corpus never needed and real calendar UIs essentially never produce (they don't let a human pick seconds).
- *Convert to instants via `timezone` before comparing.* Rejected as unnecessary complexity: D003 already made the wall-clock representation ordering-comparable by design; converting away from it just to compare two same-timezone values back-to-back adds a moving part for no benefit.
- *Require `endDate > startDate` (forbid equal instants).* Rejected as a separate, unnecessary decision — it would additionally rule out zero-duration events, which nothing in this proposal's evidence called for.

**Compatibility impact.** Restrictive on two axes, both cheap: no example in the repo's own corpus uses non-`:00` seconds or an inverted interval, so nothing in the existing corpus needed to change to stay valid (though the corpus files carrying `:00` were rewritten to drop it, since the field no longer accepts it).

**Revisit if:** a real, recurring source of `startDate`/`endDate` values with meaningful non-zero seconds turns up (this would be surprising — check the source is emitting wall-clock event times, not something like a `DTSTAMP` or another instant-typed field, before concluding this decision was wrong).

---

### D005 — `offers[].currency` must be a real ISO 4217 code

**Status:** Decided 2026-08-03. See `CHANGES.log` #P004 for the full trail, including a real methodology mistake made and caught while sourcing the enum — worth reading for that alone.

**Context.** `currency` is described normatively as "ISO 4217 alpha-3 code, uppercase" and mapped 1:1 to `schema.org/Offer.priceCurrency`, but the schema only checked `^[A-Z]{3}$` — three uppercase letters, not a real currency. `{"price": 10, "currency": "ZZZ"}` validated. Same failure shape as D002 (`timezone`): a field whose entire job is to make a number interpretable and comparable can be satisfied with a value that does neither.

**Decision.** `currency` must be one of an `enum` of real, currently-active ISO 4217 codes, generated by `scripts/update-currencies.mjs` from the **official** source: the active-currency list (`list-one.xml`) published by SIX Group, the ISO-designated maintenance agency for ISO 4217.

**Why "official source" gets its own sentence here.** The first attempt at this enum did not use that source. It used `Intl.supportedValuesOf('currency')` (Node's bundled Unicode CLDR data), cross-checked against a third-party GitHub mirror of the ISO list — and concluded, wrongly, that `Intl` was fine and the mirror had a bug, because `Intl` still accepted `BGN` (Bulgarian Lev) and the mirror didn't. That conclusion was an assumption ("Bulgaria hasn't adopted the euro, I'd know") standing in for a fact, and it was wrong: fetching the actual SIX Group registry showed `BGN` withdrawn 2026-01 (Bulgaria's euro adoption), confirmed by its `list-three.xml` (withdrawn codes) entry. `Intl` was the outdated one; the mirror had been right. Neither `Intl` nor a random mirror is the authority — only SIX Group's own published list is — and the first pass treated a convenient proxy as good enough without checking it against the thing it was a proxy *for*. That is precisely the mistake D002 already existed to warn against, made again despite the warning being right there in this same file.

**Alternatives considered.**
- *`Intl.supportedValuesOf('currency')` as the source.* Tried first, rejected once verified against the real registry (see above) — it lags real-world currency retirements.
- *A third-party "currency codes" dataset mirror.* Considered as a cross-check, and turned out to already agree with the true authority on the one case that mattered (`BGN`) — but it is still not the authority itself, and was not adopted as the source of record for that reason; only SIX Group's own published list is cited as the source.
- *Query the ISO list at validation time.* Rejected for the same reason as D002: a frozen version should not validate differently depending on the date, network, or consumer's library.
- *Warning instead of error.* Rejected: `currency` exists specifically so a price is interpretable and comparable; an invented code fails that as completely as an invented timezone fails `timezone`'s job (D002) — same category as an error, not a recommended-field-style warning.

**Compatibility impact.** Restrictive, but only for codes that were never real ISO 4217 currencies, or that named a currency now retired. `EUR`/`USD`, used by every real example in the repo, are unaffected. As with D002, a future ISO amendment adding a new code will require a new OTE version to accept it — an explicit, accepted cost of a frozen version, not an oversight.

**Revisit if:** SIX Group changes how or where it publishes the ISO 4217 lists (the URL breaks), or a legitimate, currently-circulating currency is found missing from `list-one.xml` at generation time (check the withdrawal list first — it may be legitimately retired, the way `BGN` was).

---

### D006 — `location.address.country` must be a real, currently-assigned ISO 3166-1 code

**Status:** Decided 2026-08-03. See `CHANGES.log` #P005 for the full trail — including a case where the official source could not be fetched by a script at all, and how that was resolved.

**Context.** `country` is described normatively as "ISO 3166-1 alpha-2 code" and maps 1:1 to `schema.org/PostalAddress.addressCountry`, but the schema only checked `^[A-Z]{2}$`. `{"country": "ZZ"}` validated. Same failure shape as D002/D005: a field whose whole point is to let a consumer group events by country without depending on which language wrote the name can be satisfied with two letters that name nothing.

**Decision.** `country` must be one of an `enum` of the **officially assigned** ISO 3166-1 alpha-2 codes — 249 at the time of writing. ISO 3166-1 alpha-2 space is not simply "assigned or not": the ISO 3166 Maintenance Agency's own decoding table divides all 676 two-letter combinations into seven categories — officially assigned (real, current countries/territories — this decision's enum), user-assigned (reserved for private use, no fixed meaning, e.g. the `AA`/`QM`–`QZ`/`XA`–`XZ`/`ZZ` ranges), exceptionally reserved, transitionally reserved, indeterminately reserved (in wide informal use but never ISO-assigned — `UK` lives here; the real code is `GB`), formerly assigned (real countries that no longer exist in that form — `SU` Soviet Union, `CS` Serbia and Montenegro, …), and unassigned. Only the first category answers "is this a real, currently addressable country" — the field's actual job — so only it goes in the enum.

**Why this one can't just fetch the official source directly, unlike D002/D005.** The official source is the ISO Online Browsing Platform (`iso.org`), and unlike IANA (tzdata, D002) and SIX Group (ISO 4217, D005), **it returns HTTP 403 to automated requests** — tested with and without a realistic browser `User-Agent`, not a simple bot filter to work around. There is nothing at the end of a URL a script can fetch.

**The compromise: automate the fetch, but verify it against a human before trusting it, every time — not just once.** `scripts/update-countries.mjs` fetches the Debian `iso-codes` project's data (used by glibc/GNOME across most Linux distributions for exactly this purpose) automatically, the same convenience-source shape D002/D005 warn about. What makes this safe rather than a repeat of D005's near-miss: the script also holds `scripts/data/iso-3166-1-alpha-2.json`, a snapshot hhkaos retrieved by hand from a real OBP browser session (where the 403 does not apply) on 2026-08-03, and compares the live fetch against it on every run. If they still match — 249/249, as they did the day this was written — the script proceeds. **If they ever disagree, the script refuses to update the schema and prints the difference**, because a disagreement means either the mirror drifted from the real registry or the registry itself changed, and either way a human needs to re-visit the OBP, confirm the truth by hand, and update the snapshot file before the automation is trusted again. The mirror is the fetch mechanism; the human-retrieved snapshot is the standing check on it — the `$comment` this decision generates names both.

This is the structural fix for the mistake D005 (`currency`) almost shipped with: there, a convenience source was checked against the truth *once*, found to agree, and trusted from then on with no ongoing verification. Here, the check runs every time the script does, so a future drift gets caught automatically instead of requiring someone to think to re-verify.

**Alternatives considered.**
- *Keep the two-letter pattern, accept the field is unenforceable.* Rejected: same reasoning as D002/D005 — the field promises ISO 3166-1, so a value with the right shape but no referent breaks that promise while still passing.
- *Source the enum from `Intl`, CLDR, or a country-list npm package.* Rejected as the primary source for the reason D002/D005 already established: these are derivatives that can lag or apply different criteria than the registry itself.
- *Adopt the Debian `iso-codes` mirror as the source of record, trusted unconditionally.* Rejected in that unconditional form even though it agreed with the official table on every code checked — D002's `Intl` also looked fine right up until it wasn't (`Europe/Kiev`/`Kyiv`), and D005's `currency` cross-check reasoning was itself wrong before the real registry was checked. What shipped instead uses the mirror as the fetch mechanism but never unconditionally: the script diffs it against a human-retrieved OBP snapshot every run and refuses to proceed on any disagreement (see above).
- *Only ever fetch by hand, no automation at all.* Considered as the more conservative option, and initially shipped that way — hhkaos asked, reasonably, why not automate it given the mirror had just been shown to match exactly. Rejected in favor of the diff-and-refuse design: it gets the automation without giving up the guarantee, by making the human-retrieved snapshot a standing check rather than a one-time comparison.
- *Include "indeterminately reserved" codes like `UK` for leniency, since they are in wide informal use.* Rejected: ISO never assigned `UK` any meaning, so accepting it would not be "being lenient with a real country," it would be inventing a meaning ISO itself declines to give it. Documented as a call-out in the field description and prose instead (the likely real mistake this stricter validation will surface), rather than silently accepted.

**Compatibility impact.** Restrictive, but only for codes that were never officially assigned, or that named an entity that no longer exists in that form. `ES`/`US`, used by real examples in the repo, are unaffected. As with D002/D005, a country ISO assigns in the future needs a new OTE version to become valid — the same explicit, accepted cost of a frozen version.

**Revisit if:** the script ever refuses to run because the mirror and the OBP snapshot disagree (see its output for which codes differ) — re-visit the OBP by hand, confirm the true current list, and update `scripts/data/iso-3166-1-alpha-2.json` before rerunning it. Also revisit if `iso.org` starts serving automated requests at all, which would let this fetch the true authority directly instead of through the Debian mirror.

---

### D007 — `languageTag` validates the CORE of BCP 47 against the real IANA registry, not all of it

**Status:** Decided 2026-08-03. See `CHANGES.log` #P006 for the full trail — including a scoping question hhkaos asked before agreeing to any implementation, which changed the shape of this decision, and a subtle error in the original evidence's own stated reasoning that this decision's implementation had to get right anyway.

**Context.** `languageTag` (shared by `languages`, both `textLanguage` fields, and every `translations` key) is described as "a BCP 47 language tag" but only checked `^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$` — a regex that manages to be wrong in **both directions** at once: it rejects real, valid BCP 47 tags (`x-example`, a private-use tag; `i-klingon`, a grandfathered tag), and it accepts strings that are not valid BCP 47 at all (`en-12345678`).

**The scoping question, and why the answer isn't "implement all of BCP 47."** Before agreeing to any fix, hhkaos asked whether BCP 47 was even the right standard to begin with, and to question any prior decision rather than just the mechanics. The standard itself checks out — there is no serious competing standard for "what language is this web content in" (it's what HTML `lang`, `schema.org/inLanguage` and HTTP `Accept-Language` all use). But **how much of BCP 47's grammar to actually validate** was a fair question. RFC 5646's full grammar includes branches — extended language subtags, extension singletons (`-u-...`, locale negotiation like calendar/numbering system), private use (`x-...`), and 26 fixed `grandfathered` tags RFC 5646 itself deprecates in favour of modern subtag combinations — that have no real use case for declaring the language of an event's own text. Codex's own evidence examples (`x-example`, `i-klingon`) live entirely in those branches.

**Decision.** `languageTag` validates the CORE langtag form only: `language ["-" script] ["-" region] *("-" variant)`. Each subtag is checked against the real IANA Language Subtag Registry (fetched by `scripts/update-language-subtags.mjs`, data shipped as `language-subtags.json` in the npm package, read by a custom `ote-language-tag` Ajv format in `index.js`'s `customFormats`). `extlang`, extensions, private use and `grandfathered` tags are out of scope **by name, in the field description and in prose** — not silently unsupported while claiming "BCP 47" unqualified, which is exactly the kind of mismatch between promise and behaviour D001–D006 all exist to close.

**A second exclusion, found while building this, not proposed by Codex:** the IANA registry itself contains "private use" and "not one specific thing" placeholder subtags — region `ZZ` and `AA`, script `Zzzz` (uncoded) and `Zyyy` (undetermined), language `und` (Undetermined), `mis` (Uncoded languages), `mul` (Multiple languages), `zxx` (No linguistic content) — the exact same shape of problem as ISO 3166-1's user-assigned `ZZ` in D006. `en-ZZ` and `textLanguage: "und"` both passed an early version of this implementation's own test battery, structurally well-formed and registry-present, before being caught and excluded on the same principle as D006: registered is not the same test as "names one specific, real thing," and only the latter answers this field's actual question.

**A precision correction, since Codex's own reasoning here had a small error worth recording:** the evidence for `en-12345678` argued that a digit-led variant subtag "must be exactly 4 characters," implying `en-12345678` fails on raw grammar. Re-reading RFC 5646 §2.1 closely: `variant = 5*8alphanum / (DIGIT 3alphanum)` — the exactly-4-characters-starting-with-a-digit rule applies only to the SECOND alternative; the first alternative (5 to 8 alphanumeric characters) has no constraint on the leading character at all, so an 8-digit string like `12345678` is structurally well-formed as a variant *candidate*. It is invalid only because "12345678" was never registered as an actual variant subtag — a registry-membership failure, not a grammar failure. This implementation checks registry membership regardless (so it gets the right answer either way), but the field description and this entry state the precise reason rather than repeating the imprecise one.

**Alternatives considered.**
- *Implement all of BCP 47*, including `extlang`, extensions, private use and `grandfathered` tags, exactly as Codex proposed. Rejected as disproportionate: real cost (parsing/maintaining branches with materially more edge cases) for real-world benefit close to zero, for this field's actual purpose. The rejected branches remain valid BCP 47 in general — OTE just does not need them here, and says so.
- *Grammar-only, no registry check* (fixes `en-12345678` structurally without fetching IANA data). Considered and rejected once it became clear grammar alone cannot distinguish `en-12345678` (structurally a valid variant candidate) from `en-1901` (a real one) — only registry membership can, the same reasoning D002/D005/D006 already established for timezone/currency/country.
- *Trust `Intl.Locale`/CLDR to validate tags.* Rejected as the primary source for the same reason as D002/D005: a runtime's bundled data is a derivative that can lag or disagree with the registry, and there is no need to accept that risk when IANA's registry is directly fetchable (no `iso.org`-style block here).

**Compatibility impact.** Mixed by nature — additive for well-formed core tags the old regex used to reject (there are no real examples of this in the repo's own corpus, since nothing here used those forms), restrictive for the malformed/placeholder values the old regex let through. Every language tag in the repo's existing examples (`es`, `ca`, `en`, `es-MX`, `zh-Hant`) is unaffected.

**Revisit if:** a real production need emerges for private use, extensions or grandfathered tags in this specific field (would be surprising — check whether the actual need is `languages`, which is a list and could in principle carry a differently-scoped tag type, before concluding `languageTag` itself must change), or IANA restructures the registry's file format (the parser in `scripts/update-language-subtags.mjs` depends on the current `Type:`/`Subtag:`/`Description:` record shape).

---

### D008 — `license` validates simple SPDX identifiers against the real SPDX License List

**Status:** Decided 2026-08-03. See `CHANGES.log` #P007 — the cleanest cycle of this audit: the proposal already applied the sourcing lesson from D002/D005/D006 and the scoping lesson from D007 without needing either pointed out.

**Context.** `license` (shared by the event, `source.license`, and the feed) is described as "an SPDX identifier … or a URL", but `$defs.license` only checked `^([A-Za-z0-9.+-]+|https?://.+)$` — characters that could plausibly appear in an SPDX id, not an actual one. `{"license": "TOTALLY-MADE-UP-9.9"}` validated. Same failure shape as D002/D005/D006/D007: the field's whole reason for using an identifier instead of prose ("CC0-1.0" instead of "public domain, sort of") is that a consumer can check it against an allowlist — and an invented identifier defeats that while still passing.

**Decision.** The identifier branch of `license` is now an `enum` of every ID in the official SPDX License List, generated by `scripts/update-licenses.mjs` from `github.com/spdx/license-list-data` — the SPDX project's own repository, fetched at a tagged release (not the `main` branch) for a reproducible snapshot. Deprecated IDs are included: SPDX's own documentation states a deprecated identifier remains valid, merely discouraged for new use — that is SPDX's actual rule, not an assumption carried over from D002's timezone aliases (where the reasoning is different: a renamed timezone is the same place under two names, whereas SPDX explicitly keeps old IDs valid on its own terms). Scope stays at simple identifiers, the same as the field's own prose and examples (`CC0-1.0`, `CC-BY-4.0`) — full SPDX license *expressions* (`MIT OR Apache-2.0`, `LicenseRef-...`) are out of scope, applying D007's "core, not everything" principle without it needing to be asked for again this time.

**Follow-up, same day: a recommended-tier warning for licenses that can block a directory.** hhkaos raised the real concern behind wanting this validated at all: this spec exists so events get picked up by directories and aggregators, and some real, valid SPDX identifiers actively work against that goal. Three clause types matter specifically because of what an aggregator needs to do: **NonCommercial** rules out any commercial directory outright (a hard legal bar, not a technicality); **NoDerivatives** blocks the reformatting/translation an aggregator routinely performs; **ShareAlike** (including `ODbL-1.0`) is viral for a *combined* database — merging one NC/SA-licensed event into a larger aggregated feed can force the whole feed to adopt that license. Software copyleft licenses (GPL and family) are excluded from the recommendation for a related but distinct reason: their share-alike mechanics are built around "distributing the Program", legally ambiguous applied to a JSON document, and that ambiguity alone is enough for a cautious directory's legal team to decline rather than risk it — even though, per D008's main decision above, they remain perfectly *valid* SPDX identifiers for `license`.

This is deliberately a **warning, not a validity error** — added to `event.recommended.schema.json` (a new `$defs.dataLicense` enum: `CC0-1.0`, `CC-BY-*` with no `-NC-`/`-ND-`/`-SA-` token, `CC-PDDC`, `CC-PDM-1.0`, `PDDL-1.0`, `ODC-By-1.0` — 17 identifiers, same generation script), not `event.schema.json`. A real community may have a deliberate reason to choose a restrictive license; the spec's job here is to surface the trade-off, not make the choice for them — the same reasoning that keeps `offers`/`cfp`/`eligibility` out of the required tier. Implementing this reused the existing `missingRecommended` reporting in `scripts/validate.mjs`, generalized to report a value-level `anyOf` mismatch on an already-present field the same bare way it already reports a missing one (field path only) — the mechanism was built for presence checks only until this needed it to do a little more.

**On cross-feed license compatibility, considered and deliberately NOT addressed:** hhkaos also asked whether the spec should enforce or check compatibility between different events' licenses within one feed. Decision: no. Each event is an independently licensed work — `license` can be overridden per event specifically because not every community wants the same terms — so there is no single derivative work whose licenses must reconcile, unlike linking two differently-licensed software libraries into one binary. Whoever aggregates and wants to redistribute or merge a feed as a single unit is the one creating that combined work, and checking real license compatibility is a genuine legal judgment call (SPDX itself does not publish an official compatibility matrix even for software; for content licenses with NC/SA clauses it is more contested still) — not something a JSON Schema validator can or should adjudicate. A prose note in `README.md` states this explicitly instead: compatibility across a feed's events is the aggregator's responsibility, not a guarantee this spec makes.

**Alternatives considered.** Codex's own proposal already worked through the same alternatives D002/D005/D006 close off (consumer-side allowlists, runtime/CLDR-style derived sources, live queries against a frozen version, excluding deprecated IDs against SPDX's own stated position) and D007's scope question (full license expression grammar vs. simple identifiers) — see the `PROPUESTA` and `REVISION` entries in `CHANGES.log` #P007 for the full reasoning; nothing here changed any of it.

**Compatibility impact.** Restrictive only for strings that matched the old shape-only pattern but were never real SPDX identifiers, or a malformed URL. `CC0-1.0`/`CC-BY-4.0`, used throughout the repo's real examples, are unaffected, as are deprecated-but-still-valid IDs. A license SPDX adds in the future needs a new OTE version to become valid — the same accepted cost as D002/D005/D006.

**Revisit if:** `scripts/update-licenses.mjs`'s GitHub Releases API call ever stops resolving a `latest` tag the way it does today (would need a fallback way to find the current release), or a real producer needs a genuine SPDX license *expression* rather than a single identifier — check whether that need is real (a specific dual-licensed dataset) before reopening the scope question this decision just closed. For the recommended-tier warning specifically: revisit if a real community reports the warning firing on a license that does NOT actually block redistribution/transformation (the `-NC-`/`-ND-`/`-SA-` token check might need refinement), or if real adoption data suggests directories are declining integrations over software-copyleft licenses less often than assumed here.

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
