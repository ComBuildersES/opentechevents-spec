# Analysis — comparison, patterns and conclusions

A synthesis of the findings in [platforms.md](platforms.md), [directories.md](directories.md) and [standards.md](standards.md), aimed at the design of OTE Spec.

## Summary

We analysed popular platforms for announcing tech events (Meetup, Sessionize and Luma, plus joind.in and Papercall) and several community projects/directories (EventosWiki, Event Garden, developers.events, Confs.tech, CallingAllPapers, CFP Tracker, TechConf.Directory, dev.events and Developer Events.org). The platforms differ in how events are created and in the data they require, but they share a common core of information: event name, description, dates and times (with time zones), location, registration links and, where applicable, the opening and closing dates of the call for papers (CFP). The GitHub-based directories use YAML or JSON data structures, while the platforms offer APIs (GraphQL or REST) or web forms.

## Comparison and common patterns

1. **Essential data**. Most platforms require, at a minimum, the event name, a short description, start and end dates, a time zone and a location. joind.in additionally specifies the geographic area (`tz_continent` and `tz_place`)[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202).

2. **CFP information**. In the projects that collect CFPs (developers.events, Confs.tech, joind.in, CallingAllPapers), the key data are the call's URL, its opening date and its closing date[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202)[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta).

3. **Images and social profiles**. Some directories allow a logo, a cover image and social profiles (Twitter, Mastodon, Bluesky, etc.)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus). These fields are usually optional, but they enrich the entry.

4. **Tags and categories**. Many repositories use tags to classify conferences by topic (AI, cloud, etc.)[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the).

5. **Automation**. Some sites support APIs or feeds returning structured data (Meetup GraphQL, Sessionize JSON/iCal, Luma API, developers.events JSON, joind.in REST, CallingAllPapers API). Others rely on YAML/Markdown templates and manual review. dev.events mentions using **JSON‑LD** metadata on the event's own site to detect data automatically[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

6. **Contribution process**. Platforms such as Meetup, Luma and Papercall manage events from their own interfaces; the GitHub-based community directories (EventosWiki, developers.events, Confs.tech, TechConf.Directory) require pull requests or issues. dev.events and Developer Events have submission forms that are reviewed by hand.

7. **Aggregators**. CallingAllPapers and CFP Tracker allow no manual submission; they depend on other sources. dev.events also works as an aggregator, combining automation with manual submissions[dev.events](https://dev.events/about#:~:text=The%20project%20is%20coded%20and,organizers%2C%20tech%20community%2C%20and%20volunteers).

8. **Data licence** 🔲 _(pending across every source)_. We have not yet reviewed the terms under which each source publishes its data. This is **critical**: it determines whether tools can legally ingest and re-publish, and whether **attribution** is required. Implications for OTE: (a) the spec must allow declaring the **provenance/attribution** and **licence** of each event (see `source`/`license` in [../../spec/v0.3/README.md](../../spec/v0.3/README.md#license-and-source-what-can-be-reused-and-where-it-came-from)); (b) it is worth recommending that adopting communities pick a clear, open licence for their events.

## Conclusions for the design of a new standard

- **A modular schema**: the new standard should define a mandatory core (name, description, dates, time zone, location) and optional modules for the CFP, social profiles, tags, images and logistics. joind.in's experience shows that a handful of required fields is enough[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202), while the rest enriches the entry.

- **Compatibility with JSON and YAML**: most projects use these formats. The standard should offer both serialisations, and ideally a JSON‑LD representation to allow automatic detection by engines such as dev.events[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

- **CFP support**: include `cfp_url`, `cfp_start` and `cfp_end` fields as optional but normalised; they are key for aggregators[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202).

- **Time zones and location**: it is advisable to keep the time zone fields (`tz_continent` and `tz_place`) separate from the location, to make converting times easier and to allow online events.

- **Extensible social profiles**: a `socials` block should accept multiple platforms (Twitter, Mastodon, Bluesky, LinkedIn, etc.) with the option of including decentralised identifiers (DIDs), as techconf.directory does[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus).

- **A tagging system**: allow a normalised list of `tags`; it makes classification by topic easier and improves interoperability with search engines and aggregators[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the).

- **Licensing and privacy**: include metadata about image rights, consent to publish, and links to the code of conduct and privacy policies; several forms (Confs.tech, Developer Events) cover these.

- **Contribution channels**: plan for both manual contribution (forms or PRs) and automatic contribution via an API or JSON‑LD detection[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

- **Easy consumption**: publish a unified feed (JSON and iCal) and allow filters (by date, location, tags) similar to joind.in and developers.events[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202)[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta).

Consolidating these practices will make the new standard easier to adopt across different ecosystems and tools.

## Interoperability with existing standards

From the analysis in [standards.md](standards.md):

- **Reference model: schema.org/`Event`** (JSON-LD) — the one most aligned with OTE (native online/hybrid via `eventAttendanceMode`, speakers, status, offers) and detected automatically by search engines and aggregators such as dev.events.
- **iCalendar (`VEVENT`)** — a solid mapping of the core and the **only source with formal recurrence** (`RRULE`), key for regular meetups.
- **RSS 2.0 and JSON Feed** — no event model; used as a **broadcast format** (one event per `item`, a link to the entry), with structured data via a namespace (RSS) or an `_ote` field (JSON Feed).
- **h-event** — optional HTML markup; low priority.
- **A shared gap**: no general-purpose standard models the **CFP** → OTE has to define it as a module of its own.
