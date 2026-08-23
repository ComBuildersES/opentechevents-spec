# Research

This folder collects the research done before designing the **OpenTechEvents (OTE Spec)** specification (working name).

## Goal

Before designing the standard we need to know **what data is in use today** across tech event platforms, directories and standards: which fields they require, which are optional, how you contribute data, and in which formats it can be consumed. The standard has to be able to cover all of their needs and be easy to convert into the formats they already use.

The findings in this folder feed directly into the design of the spec (data model, core fields vs. optional modules, compatibility rules).

## What we extract from each source

A common template applied to every platform/project analysed, so they can be compared:

- **What it supports**: events, call for papers/speakers (CFP), speakers, etc.
- **Data and types**: which fields each supported format handles, and of what type.
- **Required vs. optional**: what it demands and what it leaves optional.
- **Ways to contribute**: manual (form, issue, PR) or automatable (API).
- **Standard consumption**: whether it already exposes the data in some standard format (JSON, iCal, RSS, JSON-LD…).
- **Data licence** 🔲: under which licence/terms the source publishes its data and what that allows (reuse, redistribution, required attribution). **Critical**: it determines whether ecosystem tools can legally **ingest and re-publish** those events. Still to be reviewed across every source.
- **Is it an aggregator?**: whether it in turn collects data from other sources (and which).
- **Relevant URLs**: where the information was taken from (verifiable), where data is submitted (form/endpoint), etc.

For existing **standards** (iCal, RSS, schema.org…) the angle changes: what matters is their data model, their fields and how to map to and from them — not "how to submit an event".

## Inventory of sources

### Platforms — [findings/platforms.md](findings/platforms.md)

| Source | URL | Status |
| --- | --- | --- |
| Meetup | https://www.meetup.com/ | ✅ |
| Sessionize | https://sessionize.com/ | ✅ |
| Luma | https://luma.com/ | ✅ |
| joind.in | https://joind.in/ | ✅ |
| Papercall.io | https://www.papercall.io/ | ✅ |
| Guild | https://guild.host/ | 🔲 |
| Saraos.tech | https://saraos.tech/ | 🔲 |
| LinkedIn events | https://www.linkedin.com/help/linkedin/answer/a552496 | 🔲 |

### Directories and aggregators — [findings/directories.md](findings/directories.md)

| Source | URL | Status |
| --- | --- | --- |
| EventosWiki | https://github.com/achamorro-dev/eventoswiki | ✅ |
| Event Garden | https://eventgarden.io/ | ✅ |
| developers.events (Developers-Conferences-Agenda) | https://github.com/scraly/developers-conferences-agenda | ✅ |
| Confs.tech | https://github.com/tech-conferences/confs.tech | ✅ |
| CallingAllPapers | https://callingallpapers.com/ | ✅ |
| CFP Tracker (bendechrai/cfps) | https://github.com/bendechrai/cfps | ✅ |
| TechConf.Directory | https://github.com/DeclanChidlow/techconf.directory | ✅ |
| dev.events | https://dev.events/ | ✅ |
| Developer Events.org | https://www.developerevents.org/ | ✅ |
| Sesamers | https://sesamers.com/ | 🔲 |
| Vendelux | https://www.vendelux.com/ | 🔲 |
| LegalTechConference.com | https://www.legaltechnologyconference.com/ | 🔲 |
| iotevents.org / marketing-events.net (TechForge) | — | 🔲 |

### Standards — [findings/standards.md](findings/standards.md)

| Standard | Reference | Status |
| --- | --- | --- |
| iCalendar | RFC 5545 | ✅ |
| RSS 2.0 | https://www.rssboard.org/rss-specification | ✅ |
| schema.org / `Event` (JSON-LD) | https://schema.org/Event | ✅ |
| hCalendar / microformats | http://microformats.org/wiki/h-event | ✅ |
| JSON Feed | https://www.jsonfeed.org/ | ✅ |

## Analysis and conclusions

- [findings/analysis.md](findings/analysis.md) — comparison, common patterns and conclusions for the design of the standard.

## Public version

This folder is the raw evidence. The editorial reading of it — what each standard already solves, what OTE reuses from each, which neighbouring projects exist and **what we cannot claim yet** — is published at [opentechevents.org/prior-art/](https://opentechevents.org/prior-art/), in English and Spanish, so that the people maintaining those projects can correct us.

Two things live only there, because this research never covered them: **ActivityPub / FEP-8a8e** (event federation) and the **IndieWeb** conventions beyond `h-event` markup.

## File index

- [findings/platforms.md](findings/platforms.md) — platforms that create/manage events.
- [findings/directories.md](findings/directories.md) — directories and aggregators that list events.
- [findings/standards.md](findings/standards.md) — existing standards and how to map to and from them.
- [findings/analysis.md](findings/analysis.md) — comparison, patterns and conclusions.
