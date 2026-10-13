// The community calls block on the home page, configured at build time from
// content/community-calls.json:
//
//   {
//     "lumaUrl": "https://lu.ma/<the MOI calendar>",
//     "nextCall": { "date": "2026-11-18T14:00:00Z", "title": "Community Call", "url": "https://..." }
//   }
//
// The block is off until lumaUrl holds a web link: with it empty, missing or
// not a link, the home page shows no community section at all. nextCall is
// optional; `date` is ISO 8601 and required inside it, `title` and `url` are
// optional. A date with no time ("2026-11-18") is shown without a time and
// counts as upcoming for that whole UTC day.
//
// A missing, empty or half-edited file never fails the build: import.meta.glob
// matches nothing when the file is absent, ?raw hands over the text unparsed,
// and anything unusable reads as "off".
const files = import.meta.glob("../../content/community-calls.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function webLink(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function parseNextCall(data) {
  if (!data || typeof data.date !== "string") return null;
  const date = data.date.trim();
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return null;
  const dateOnly = DATE_ONLY.test(date);

  return {
    start,
    // When the call stops counting as upcoming.
    endsAt: start.getTime() + (dateOnly ? DAY_MS : 0),
    dateOnly,
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Community call",
    url: webLink(data.url),
  };
}

export function parseCommunityCalls(text) {
  if (typeof text !== "string" || text.trim() === "") return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const lumaUrl = webLink(data?.lumaUrl);
  if (!lumaUrl) return null;
  return { lumaUrl, nextCall: parseNextCall(data.nextCall) };
}

// null means the block is off.
export const COMMUNITY_CALLS = parseCommunityCalls(Object.values(files)[0]);

// Assembled by hand, always in UTC: the prerendered page and the browser's
// first render have to produce the same text whatever the build server's or
// the visitor's timezone, and engines disagree on toLocale* output.
export function formatCallDate({ start, dateOnly }) {
  const day = `${WEEKDAYS[start.getUTCDay()]} ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`;
  if (dateOnly) return day;
  const h = start.getUTCHours();
  const minutes = String(start.getUTCMinutes()).padStart(2, "0");
  return `${day}, ${h % 12 || 12}:${minutes} ${h < 12 ? "AM" : "PM"} UTC`;
}
