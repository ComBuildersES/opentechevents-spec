# Integration Audit Tools

Blind integration exercise for OTE v0.3. Code lives outside `spec/v0.3/` and validates imported OTE events with Ajv against `spec/v0.3/event.schema.json`.

## Import iCalendar to OTE

```bash
node integration-audit/import-ics.mjs
```

Default input: `integration-audit/fixtures/python-events-real.ics`.

Default output: `integration-audit/out/imported/*.json`.

The fixture holds three unaltered `VEVENT` blocks copied verbatim from the real, public Python Events Calendar subscription linked by `https://www.python.org/events/python-events/` (`X-OTE-ICAL-SOURCE`): PyCon Indonesia 2026 (all-day, no `TZID`, no `URL` property), Python fwdays'20 (timed, `LOCATION:Online`, HTML in `DESCRIPTION`), and Conf42 Python 2021 (all-day, `LOCATION:Online`, HTML in `DESCRIPTION`). An earlier version of this fixture had a single fabricated `VEVENT` presented as a capture — replaced during Claude's review (see `INTEGRATION-AUDIT.log`, note above H001) after confirming the source is reachable and downloading the genuine feed (871 real `VEVENT`s).

## Export OTE to schema.org, iCalendar and RSS

```bash
node integration-audit/export-ote.mjs
```

Default inputs:

- `spec/v0.3/examples/event-conference-cfp.json`
- `spec/v0.3/examples/event-online.json`
- `spec/v0.3/examples/event-meetup.json`
- `spec/v0.3/examples/event-recurring.json`
- `spec/v0.3/examples/feed-multipart.json`

Default output: `integration-audit/out/exported/*.{schemaorg.jsonld,ics,rss.xml}`.
