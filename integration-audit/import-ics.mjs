#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addDays, parseIcs, parseIcsDate } from "./lib/ics.mjs";
import { validateEvent } from "./lib/ote-validation.mjs";

const input = process.argv[2] || "integration-audit/fixtures/python-events-real.ics";
const outputDir = process.argv[3] || "integration-audit/out/imported";

const text = await readFile(input, "utf8");
const { calendar, events } = parseIcs(text);
if (events.length === 0) throw new Error(`No VEVENT found in ${input}`);

await mkdir(outputDir, { recursive: true });

const sourceUrl =
  calendar["X-OTE-ICAL-SOURCE"]?.value ||
  calendar["X-OTE-SOURCE"]?.value ||
  `file://${path.resolve(input)}`;
const sourcePage = calendar["X-OTE-SOURCE"]?.value;
const sourceName = calendar["X-WR-CALNAME"]?.value || "iCalendar";
const retrievedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

for (const [index, vevent] of events.entries()) {
  const ote = eventToOte(vevent, { sourceUrl, sourcePage, sourceName, retrievedAt });
  validateEvent(ote);
  const file = path.join(outputDir, `${slug(ote.name)}.json`);
  await writeFile(file, `${JSON.stringify(ote, null, 2)}\n`);
  console.log(`wrote ${file}`);
}

function eventToOte(vevent, source) {
  const start = parseIcsDate(first(vevent.DTSTART));
  const end = parseIcsDate(first(vevent.DTEND));
  const uid = first(vevent.UID)?.value;
  const url = first(vevent.URL)?.value;
  if (!start) throw new Error("VEVENT has no DTSTART");

  const event = {
    specVersion: "0.3.0",
    id: mintId({ url, uid, sourceUrl: source.sourceUrl, sourcePage: source.sourcePage }),
    name: first(vevent.SUMMARY)?.value || "(untitled iCalendar event)",
    startDate: start.value,
    timezone: start.timezone || end?.timezone || "UTC",
    license: "CC-BY-4.0",
    source: {
      name: source.sourceName,
      url: source.sourceUrl,
      retrievedAt: source.retrievedAt
    }
  };

  if (url) event.url = url;
  if (first(vevent.DESCRIPTION)?.value) event.description = first(vevent.DESCRIPTION).value;
  if (end?.value) event.endDate = end.kind === "date" ? addDays(end.value, -1) : end.value;
  if (first(vevent.LAST_MODIFIED)?.value) event.updatedAt = instantFromIcs(first(vevent.LAST_MODIFIED).value);
  if (first(vevent.CATEGORIES)?.value) event.tags = first(vevent.CATEGORIES).value.split(",").map((tag) => tag.trim()).filter(Boolean);

  const location = first(vevent.LOCATION)?.value;
  if (location) {
    const isUrl = /^https?:\/\//i.test(location);
    const looksOnline = isUrl || /\b(online|zoom|meet|webinar)\b/i.test(location);
    if (isUrl) {
      event.location = { onlineUrl: location };
      event.attendanceMode = "online";
    } else if (looksOnline) {
      // LOCATION says "Online" (or similar) but gives no callable URL. OTE's
      // location.onlineUrl must be an https:// URL and venue means a physical
      // place, so neither can honestly hold this text — omit location and
      // keep only the signal we can stand behind.
      event.attendanceMode = "online";
    } else {
      event.location = { venue: location };
    }
  }

  const status = first(vevent.STATUS)?.value?.toUpperCase();
  if (status === "TENTATIVE") event.status = "tentative";
  if (status === "CANCELLED") event.status = "cancelled";

  return event;
}

function mintId({ url, uid, sourceUrl, sourcePage }) {
  if (url && /^https?:\/\//.test(url) && url !== sourcePage) return url;
  if (!uid) return `${sourceUrl}#event`;
  return `${sourceUrl}#${encodeURIComponent(uid)}`;
}

function instantFromIcs(value) {
  if (!/^\d{8}T\d{6}Z$/.test(value)) return undefined;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
}
