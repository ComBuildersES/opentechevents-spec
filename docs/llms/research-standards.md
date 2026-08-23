# Findings — Existing standards

Unlike platforms and directories, here we are not analysing "how to submit an event" but **the standard's data model** and **how to map to and from it**. These are the foundation of the interoperability OTE Spec is after: we want an event described in our format to be transformable into these without loss.

## Summary

Two clear families:

- **Standards with a native event model**: **iCalendar** (`VEVENT`) and **schema.org/`Event`** (JSON-LD) and, in HTML, **h-event** (microformats). They cover name, dates, location, time zone, organiser/speakers and, in iCal, recurrence. These are the priority mapping targets.
- **Feed standards with no notion of an event**: **RSS 2.0** and **JSON Feed**. They model neither events nor date ranges nor location; they serve as a **distribution/announcement format** (one event per `item`), leaning on extensions (namespaces in RSS, `_` fields in JSON Feed) for the structured data.

Design conclusion: OTE Spec should map **1:1 to schema.org/Event and iCalendar** (they cover the core), and offer RSS/JSON Feed feeds as a broadcast output, carrying the structured part via an extension plus a link to the full entry.

## iCalendar — `VEVENT` (RFC 5545)

- **Reference**: https://datatracker.ietf.org/doc/html/rfc5545
- **Serialisation**: plain text `text/calendar` (.ics). Very widely supported by calendar clients (Google Calendar, Apple, Outlook).

| Aspect | Detail |
| --- | --- |
| **Required** | `UID` (unique identifier), `DTSTAMP` (creation timestamp) and `DTSTART` (start). |
| **Optional core** | `DTEND` or `DURATION` (end/duration), `SUMMARY` (title), `DESCRIPTION`, `LOCATION`, `URL`, `CATEGORIES` (tags), `GEO` (lat/long), `STATUS`, `ORGANIZER`, `ATTENDEE`, `TRANSP`. |
| **Dates/time zones** | DATE-TIME in 3 forms: floating (`19970714T133000`), UTC (`...Z`) and local with a zone (`TZID=America/New_York:...`). The `TZID` references a `VTIMEZONE` component defining the zone's rules (offsets, DST). |
| **Recurrence** | `RRULE` (with mandatory `FREQ`; `INTERVAL`, `COUNT`/`UNTIL`, `BYDAY`, `BYMONTHDAY`, `BYMONTH`, `WKST`). Plus `RDATE` (extra dates), `EXDATE` (excluded ones) and `RECURRENCE-ID` (a modified instance). Ideal for recurring meetups. |
| **Online events** | There is no native "online/hybrid" field; the URL usually goes in `URL`/`LOCATION`. Covered worse than in schema.org. |
| **CFP / speakers** | No notion of a CFP. Speakers only fit if forced into `ATTENDEE`/`ORGANIZER`. |

**OTE → iCal mapping**: `name→SUMMARY`, `description→DESCRIPTION`, `start/end→DTSTART/DTEND`, `timezone→TZID`+`VTIMEZONE`, `location→LOCATION`+`GEO`, `url→URL`, `tags→CATEGORIES`, recurrence→`RRULE`. **What is lost**: the CFP, the fine online/hybrid distinction, structured speakers, social profiles. UID/DTSTAMP have to be generated on export.

## schema.org / `Event` (JSON-LD)

- **Reference**: https://schema.org/Event
- **Serialisation**: JSON-LD embedded in HTML (`<script type="application/ld+json">`). **Key point**: dev.events (and search engines) already detect it automatically → publishing it gives you reach "for free".

| Aspect | Detail |
| --- | --- |
| **Core properties** | `name`, `description`, `startDate`, `endDate` (ISO 8601), `location`, `organizer`, `performer` (speakers), `offers` (tickets/price), `image`, `url`, `eventStatus`, `eventAttendanceMode`. |
| **Online/in-person/hybrid** | `eventAttendanceMode`: `OnlineEventAttendanceMode`, `OfflineEventAttendanceMode`, `MixedEventAttendanceMode`. Online events use `VirtualLocation` (with a `url`) instead of a physical `Place`. **The best support of everything analysed.** |
| **Status** | `eventStatus`: scheduled, cancelled, rescheduled, postponed. |
| **Location** | `Place` (with `PostalAddress`/`geo`), `PostalAddress`, `Text` or `VirtualLocation`. |
| **Subtypes** | `ConferenceEvent`, `EducationEvent`, `Festival`, `MusicEvent`, `SportsEvent`, etc. |
| **CFP / speakers** | `performer` covers speakers. There is no native CFP → it would need an extension of our own. |

**OTE ↔ schema.org mapping**: essentially 1:1 for the core (including online/hybrid via `eventAttendanceMode`, which iCal lacks). It is the **reference model most aligned** with OTE. **Missing**: the CFP (an extension), and normalising social profiles (`sameAs`).

## RSS 2.0

- **Reference**: https://www.rssboard.org/rss-specification
- **Serialisation**: XML.

| Aspect | Detail |
| --- | --- |
| **Structure** | `<rss>` → one `<channel>` → several `<item>`. |
| **Required in `channel`** | `title`, `link`, `description`. |
| **`item`** | All optional: `title`, `link`, `description`, `author`, `pubDate` (RFC 822), `guid`, `category`, `enclosure` (media), `comments`. |
| **Event/date/location** | **No native support.** There are no date ranges and no location; `pubDate` is the publication date, not the event's. |
| **Extensibility** | Allows extra elements/attributes **only inside a namespace** (modules). That is the way in for structured data. |

**Role for OTE**: a **broadcast/announcement** format, not a model. One event = one `item` (title, link to the entry, description). For structured data, use a module with its own namespace or reuse an existing one, and leave the full detail at the linked URL (ideally with JSON-LD). Compatible with the RSS readers people already use.

## h-event (microformats2)

- **Reference**: http://microformats.org/wiki/h-event
- **Serialisation**: semantic classes in HTML (successor to hCalendar/hCard).

| Aspect | Detail |
| --- | --- |
| **Properties** | `p-name`, `dt-start`, `dt-end`, `dt-duration`, `p-location`, `p-summary`, `p-description` (→ `e-content`), `u-url`, `p-category`. |
| **Required** | None; all optional. |
| **Dates** | A `datetime` attribute in ISO format. |
| **Location** | Text, or enriched by nesting `h-card`/`h-adr`/`h-geo`. |
| **CFP/online** | No specific support. |

**Role for OTE**: an alternative or complement to JSON-LD for embedding the event in the HTML of the organiser's site. Less adopted than schema.org today; secondary priority, but a trivial mapping (same core fields).

## JSON Feed 1.1

- **Reference**: https://www.jsonfeed.org/version/1.1/
- **Serialisation**: JSON. A modern alternative to RSS/Atom.

| Aspect | Detail |
| --- | --- |
| **Required in the feed** | `version`, `title`, `items`. Recommended: `home_page_url`, `feed_url`. |
| **Required in an `item`** | `id`. Common ones: `url`, `title`, `content_html`/`content_text`, `summary`, `image`, `date_published`/`date_modified` (RFC 3339), `authors`, `tags`, `attachments`. |
| **Event/date/location** | **No event semantics.** Only publication/modification timestamps; no range and no location. |
| **Extensibility** | Custom fields prefixed with `_` (e.g. `_ote`) at any level; readers ignore what they don't know (forward-compatible). |

**Role for OTE**: the same as RSS but in JSON — a broadcast feed. Its advantage: a clean extension point via an `_ote` object to hang the full structured event next to the `item`, without breaking standard readers.

## Conclusions for the OTE ↔ standards mapping

1. **Reference model: schema.org/Event.** It is the most complete and the most aligned (native online/hybrid, speakers, status, offers) and it gives automatic reach via JSON-LD. OTE should be able to serialise directly to JSON-LD/Event.
2. **iCalendar for calendars.** A solid mapping of the core plus recurrence (the only source analysed with formal recurrence → key for regular meetups). Generate `UID`/`DTSTAMP`; accept the loss of the CFP and the online nuances.
3. **RSS and JSON Feed to broadcast, not to model.** One event per `item`, a link to the full entry; structured data via a namespace (RSS) or an `_ote` field (JSON Feed).
4. **h-event** as an HTML markup option; low priority.
5. **A shared gap: the CFP.** No general-purpose standard models it. OTE has to define it as a module of its own and, on export, degrade it to text/URL fields.
6. **Dates and time zones**: adopt ISO 8601 + an IANA zone (`TZID`) as the base; convertible to iCal's 3 forms and to schema.org's `startDate`/`endDate`. Support a range (start/end) and recurrence from the core.

> These conclusions are folded into those in [analysis.md](analysis.md).
