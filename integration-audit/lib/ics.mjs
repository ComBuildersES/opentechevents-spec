export function unfoldIcs(text) {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
}

export function parseIcs(text) {
  const lines = unfoldIcs(text);
  const calendar = {};
  const events = [];
  let current = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const index = line.indexOf(":");
    if (index === -1) continue;

    const rawName = line.slice(0, index);
    const value = unescapeIcs(line.slice(index + 1));
    const [name, ...paramParts] = rawName.split(";");
    const property = { name: name.toUpperCase(), params: parseParams(paramParts), value };

    if (property.name === "BEGIN" && value.toUpperCase() === "VEVENT") {
      current = {};
      continue;
    }
    if (property.name === "END" && value.toUpperCase() === "VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    addProperty(current || calendar, property);
  }

  return { calendar, events };
}

export function serializeIcsCalendar(events) {
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenTechEvents Integration Audit//OTE Exporter//EN",
    "CALSCALE:GREGORIAN",
    ...events.flat(),
    "END:VCALENDAR"
  ];
  return `${body.join("\r\n")}\r\n`;
}

export function formatIcsDate(value, timezone, endOfAllDay = false) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = endOfAllDay ? addDays(value, 1) : value;
    return { property: endOfAllDay ? "DTEND;VALUE=DATE" : "DTSTART;VALUE=DATE", value: date.replaceAll("-", "") };
  }
  const compact = `${value.slice(0, 4)}${value.slice(5, 7)}${value.slice(8, 10)}T${value.slice(11, 13)}${value.slice(14, 16)}00`;
  return {
    property: `${endOfAllDay ? "DTEND" : "DTSTART"};TZID=${timezone}`,
    value: compact
  };
}

export function escapeIcs(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

export function foldIcsLine(line) {
  const limit = 75;
  if (line.length <= limit) return line;
  const chunks = [];
  let rest = line;
  while (rest.length > limit) {
    chunks.push(rest.slice(0, limit));
    rest = ` ${rest.slice(limit)}`;
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

export function icsLine(name, value) {
  return foldIcsLine(`${name}:${escapeIcs(value)}`);
}

export function parseIcsDate(property) {
  const value = property?.value;
  if (!value) return undefined;

  if (property.params.VALUE === "DATE") {
    return {
      value: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
      kind: "date",
      timezone: property.params.TZID
    };
  }

  const withoutZ = value.endsWith("Z") ? value.slice(0, -1) : value;
  return {
    value: `${withoutZ.slice(0, 4)}-${withoutZ.slice(4, 6)}-${withoutZ.slice(6, 8)}T${withoutZ.slice(9, 11)}:${withoutZ.slice(11, 13)}`,
    kind: "date-time",
    timezone: property.params.TZID || (value.endsWith("Z") ? "UTC" : undefined)
  };
}

export function addDays(date, days) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function addProperty(target, property) {
  const existing = target[property.name];
  if (!existing) {
    target[property.name] = property;
  } else if (Array.isArray(existing)) {
    existing.push(property);
  } else {
    target[property.name] = [existing, property];
  }
}

function parseParams(paramParts) {
  const params = {};
  for (const part of paramParts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    params[part.slice(0, index).toUpperCase()] = part.slice(index + 1);
  }
  return params;
}

function unescapeIcs(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
