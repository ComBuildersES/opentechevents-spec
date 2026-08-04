#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { escapeIcs, formatIcsDate, icsLine, serializeIcsCalendar } from "./lib/ics.mjs";
import { isFeed, validateEvent, validateFeed } from "./lib/ote-validation.mjs";

const defaultInputs = [
  "spec/v0.3/examples/event-conference-cfp.json",
  "spec/v0.3/examples/event-online.json",
  "spec/v0.3/examples/event-meetup.json",
  "spec/v0.3/examples/event-recurring.json",
  "spec/v0.3/examples/feed-multipart.json"
];

const inputs = process.argv.slice(2);
const files = inputs.length > 0 ? inputs : defaultInputs;
const outputDir = "integration-audit/out/exported";
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  const raw = JSON.parse(await readFile(file, "utf8"));
  const events = isFeed(raw) ? eventsFromFeed(raw) : [raw];
  if (isFeed(raw)) validateFeed(raw);

  for (const event of events) {
    validateEvent(ensureStandalone(event));
    const base = `${path.basename(file, ".json")}__${slug(event.id)}`;
    const jsonLd = toSchemaOrg(event);
    const vevent = toVevent(event);
    const rss = toRssItem(event);

    JSON.parse(JSON.stringify(jsonLd));
    assertVevent(vevent);

    await writeFile(path.join(outputDir, `${base}.schemaorg.jsonld`), `${JSON.stringify(jsonLd, null, 2)}\n`);
    await writeFile(path.join(outputDir, `${base}.ics`), serializeIcsCalendar([vevent]));
    await writeFile(path.join(outputDir, `${base}.rss.xml`), `${rss}\n`);
    console.log(`exported ${base}`);
  }
}

function eventsFromFeed(feed) {
  return feed.events.map((event) => ({
    specVersion: feed.specVersion,
    license: feed.license,
    organizers: feed.organizers,
    textLanguage: feed.textLanguage,
    ...event
  }));
}

function ensureStandalone(event) {
  return {
    specVersion: "0.3.0",
    license: event.license || "CC-BY-4.0",
    ...event
  };
}

function toSchemaOrg(event) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": event.id,
    url: event.url,
    name: event.name,
    description: richDescription(event),
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: schemaStatus(event.status),
    eventAttendanceMode: schemaAttendanceMode(event.attendanceMode),
    inLanguage: event.languages,
    keywords: event.tags?.join(", "),
    image: event.image?.map(imageUrl),
    organizer: event.organizers?.map((organizer) => ({
      "@type": organizer.type === "person" ? "Person" : "Organization",
      name: organizer.name,
      url: organizer.url,
      email: organizer.email
    })),
    location: schemaLocation(event),
    offers: event.offers?.map(schemaOffer),
    superEvent: schemaSuperEvent(event.partOf)
  };
  return prune(json);
}

function toVevent(event) {
  const start = formatIcsDate(event.startDate, event.timezone, false);
  const end = event.endDate ? formatIcsDate(event.endDate, event.timezone, true) : undefined;
  const lines = [
    "BEGIN:VEVENT",
    icsLine("UID", event.id),
    icsLine("SUMMARY", statusTitle(event)),
    icsLine(start.property, start.value)
  ];

  if (end) lines.push(icsLine(end.property, end.value));
  if (event.updatedAt) lines.push(icsLine("LAST-MODIFIED", instantToIcs(event.updatedAt)));
  lines.push(icsLine("DTSTAMP", instantToIcs(event.updatedAt || new Date().toISOString())));
  if (event.url) lines.push(icsLine("URL", event.url));
  if (event.description || event.offers || event.cfp || event.eligibility) lines.push(icsLine("DESCRIPTION", richDescription(event)));
  if (event.location) lines.push(icsLine("LOCATION", icalLocation(event.location)));
  if (event.location?.geo) lines.push(icsLine("GEO", `${event.location.geo.lat};${event.location.geo.lon}`));
  if (event.tags?.length) lines.push(icsLine("CATEGORIES", event.tags.join(",")));
  lines.push(icsLine("STATUS", icalStatus(event.status)));
  if (event.partOf) lines.push(icsLine("RELATED-TO;RELTYPE=PARENT", event.partOf.id));
  if (event.eligibility) lines.push(icsLine("X-OTE-ELIGIBILITY", event.eligibility.type));
  for (const organizer of event.organizers || []) {
    if (organizer.email) lines.push(icsLine(`ORGANIZER;CN=${escapeIcs(organizer.name)}`, `mailto:${organizer.email}`));
  }
  lines.push("END:VEVENT");
  return lines;
}

function toRssItem(event) {
  const lines = [
    "<item>",
    xmlElement("title", statusTitle(event)),
    event.url ? xmlElement("link", event.url) : "",
    `<guid isPermaLink="false">${escapeXml(event.id)}</guid>`,
    xmlElement("description", richDescription(event)),
    event.updatedAt ? xmlElement("pubDate", new Date(event.updatedAt).toUTCString()) : "",
    ...(event.tags || []).map((tag) => xmlElement("category", tag)),
    imageUrl(event.image?.[0]) ? `<enclosure url="${escapeXml(imageUrl(event.image[0]))}" type="image/*" />` : "",
    "</item>"
  ];
  return lines.filter(Boolean).join("\n");
}

function schemaLocation(event) {
  const loc = event.location;
  if (!loc) return undefined;
  if (event.attendanceMode === "online" && loc.onlineUrl && !loc.venue) {
    return { "@type": "VirtualLocation", url: loc.onlineUrl };
  }
  const places = [];
  if (loc.venue) {
    places.push(prune({
      "@type": "Place",
      name: loc.venue,
      address: loc.address ? prune({
        "@type": "PostalAddress",
        streetAddress: loc.address.street,
        addressLocality: loc.address.locality,
        addressRegion: loc.address.region,
        postalCode: loc.address.postalCode,
        addressCountry: loc.address.country
      }) : loc.venue,
      geo: loc.geo ? { "@type": "GeoCoordinates", latitude: loc.geo.lat, longitude: loc.geo.lon } : undefined
    }));
  }
  if (loc.onlineUrl) places.push({ "@type": "VirtualLocation", url: loc.onlineUrl });
  return places.length === 1 ? places[0] : places;
}

function schemaOffer(offer) {
  return prune({
    "@type": "Offer",
    name: offer.name,
    price: offer.price,
    priceCurrency: offer.currency,
    url: offer.url,
    availability: offer.availability === "sold-out" ? "https://schema.org/SoldOut" : offer.availability === "in-stock" ? "https://schema.org/InStock" : undefined,
    validFrom: offer.opensAt,
    validThrough: offer.closesAt,
    description: offer.waitlistUrl ? `Waitlist: ${offer.waitlistUrl}` : undefined
  });
}

function schemaSuperEvent(partOf) {
  if (!partOf) return undefined;
  return prune({
    "@type": partOf.type === "multipart" ? "Event" : "EventSeries",
    "@id": partOf.id,
    name: partOf.name,
    url: partOf.url
  });
}

function richDescription(event) {
  const parts = [];
  if (event.description) parts.push(event.description);
  if (event.eligibility) parts.push(`Eligibility: ${event.eligibility.note || event.eligibility.type}${event.eligibility.url ? ` (${event.eligibility.url})` : ""}`);
  if (event.offers?.length) parts.push(`Offers:\n${event.offers.map(formatOffer).join("\n")}`);
  if (event.cfp) parts.push(`CFP: ${event.cfp.url}${event.cfp.closesAt ? ` closes ${event.cfp.closesAt}` : ""}`);
  if (event.partOf) parts.push(`Part of: ${event.partOf.name || event.partOf.id}`);
  return parts.join("\n\n");
}

function formatOffer(offer) {
  const bits = [];
  if (offer.name) bits.push(offer.name);
  if (typeof offer.price === "number") bits.push(offer.price === 0 ? "free" : `${offer.price} ${offer.currency || ""}`.trim());
  if (offer.availability) bits.push(offer.availability);
  if (offer.url) bits.push(offer.url);
  if (offer.waitlistUrl) bits.push(`waitlist ${offer.waitlistUrl}`);
  return `- ${bits.join(" | ")}`;
}

function statusTitle(event) {
  const prefixes = {
    cancelled: "[CANCELLED]",
    postponed: "[POSTPONED]",
    "moved-online": "[MOVED ONLINE]",
    tentative: "[TENTATIVE]"
  };
  return [prefixes[event.status], event.name].filter(Boolean).join(" ");
}

function icalLocation(location) {
  if (location.onlineUrl && !location.venue) return location.onlineUrl;
  if (location.venue && location.onlineUrl) return `${location.venue} / Online: ${location.onlineUrl}`;
  return location.venue || location.onlineUrl || "";
}

function imageUrl(image) {
  return typeof image === "string" ? image : image?.url;
}

function schemaStatus(status = "scheduled") {
  const map = {
    scheduled: "https://schema.org/EventScheduled",
    tentative: "https://schema.org/EventScheduled",
    cancelled: "https://schema.org/EventCancelled",
    postponed: "https://schema.org/EventPostponed",
    rescheduled: "https://schema.org/EventRescheduled",
    "moved-online": "https://schema.org/EventMovedOnline"
  };
  return map[status];
}

function schemaAttendanceMode(mode) {
  const map = {
    "in-person": "https://schema.org/OfflineEventAttendanceMode",
    online: "https://schema.org/OnlineEventAttendanceMode",
    hybrid: "https://schema.org/MixedEventAttendanceMode"
  };
  return map[mode];
}

function icalStatus(status = "scheduled") {
  if (status === "cancelled") return "CANCELLED";
  if (status === "tentative" || status === "postponed") return "TENTATIVE";
  return "CONFIRMED";
}

function instantToIcs(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function assertVevent(lines) {
  const text = lines.join("\n");
  for (const required of ["BEGIN:VEVENT", "END:VEVENT", "UID:", "SUMMARY:", "DTSTART"]) {
    if (!text.includes(required)) throw new Error(`Invalid VEVENT: missing ${required}`);
  }
}

function xmlElement(name, value) {
  return value === undefined ? "" : `<${name}>${escapeXml(value)}</${name}>`;
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function prune(value) {
  if (Array.isArray(value)) return value.map(prune).filter((item) => item !== undefined);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, val]) => [key, prune(val)])
      .filter(([, val]) => val !== undefined && !(Array.isArray(val) && val.length === 0))
  );
}

function slug(value) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
