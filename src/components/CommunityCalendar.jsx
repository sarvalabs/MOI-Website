import { useState, useEffect } from "react";

const CATEGORY_COLORS = {
  dev_call: { bg: "rgba(75, 23, 229, 0.15)", text: "#4B17E5", label: "Community Call" },
  twitter_ama: { bg: "rgba(45, 45, 50, 0.10)", text: "#2D2D32", label: "Twitter AMA" },
  office_hours: { bg: "rgba(184, 212, 227, 0.3)", text: "#4A8BAF", label: "Office Hours" },
  workshop: { bg: "rgba(247, 209, 186, 0.3)", text: "#B87A4F", label: "Workshop" },
  announcement: { bg: "rgba(240, 217, 160, 0.3)", text: "#9A8135", label: "Announcement" },
};

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const MAX_EVENTS = 16;
const COLLAPSED_COUNT = 4;

const SCHEDULE_YEAR = 2026;

const COMMUNITY_CALL_DATES = [
  [4, 22],
  [5, 19],
  [6, 24],
  [7, 21],
  [8, 18],
  [9, 23],
  [10, 20],
  [11, 18],
];

const TWITTER_AMA_DATES = [
  [4, 15],
  [5, 12],
  [6, 17],
  [7, 14],
  [8, 11],
  [9, 17],
  [10, 13],
  [11, 11],
];

function buildScheduledEvents() {
  const events = [];

  COMMUNITY_CALL_DATES.forEach(([m, d], i) => {
    const date = new Date(Date.UTC(SCHEDULE_YEAR, m, d, 14, 0));
    events.push({
      id: `cc-${i}`,
      title: "MOI Community Call",
      description: "Monthly sync — protocol updates, ecosystem demos, and open Q&A.",
      date: date.toISOString(),
      duration_minutes: 60,
      category: "dev_call",
      meeting_link: "",
      meeting_link_label: "Join",
    });
  });

  TWITTER_AMA_DATES.forEach(([m, d], i) => {
    const date = new Date(Date.UTC(SCHEDULE_YEAR, m, d, 16, 0));
    events.push({
      id: `ama-${i}`,
      title: "Twitter AMA",
      description: "Live AMA with the MOI team on X. Bring your questions.",
      date: date.toISOString(),
      duration_minutes: 30,
      category: "twitter_ama",
      meeting_link: "https://twitter.com/moi_tech",
      meeting_link_label: "Open on X",
    });
  });

  return events;
}

function hasUsableLink(link) {
  return typeof link === "string" && link.trim() !== "" && link.trim() !== "#";
}

const API_URL = import.meta.env.VITE_CHATBOT_API || "";

export default function CommunityCalendar({ variant = "list", limit }) {
  const [events, setEvents] = useState(buildScheduledEvents());
  const [expanded, setExpanded] = useState(false);
  const isCompact = variant === "compact";
  const collapsedCount = limit ?? (isCompact ? 3 : COLLAPSED_COUNT);

  useEffect(() => {
    fetch(`${API_URL}/api/community-calls`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { if (data.length) setEvents(data); })
      .catch(() => {});
  }, []);

  const cutoff = Date.now() - 60 * 60 * 1000;
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, MAX_EVENTS);

  // Prefer confirmed (link present) over "Link TBA" in compact mode
  const ranked = isCompact
    ? [...upcoming].sort((a, b) => {
        const aHas = hasUsableLink(a.meeting_link) ? 0 : 1;
        const bHas = hasUsableLink(b.meeting_link) ? 0 : 1;
        return aHas - bHas;
      })
    : upcoming;

  const visible = expanded ? upcoming : ranked.slice(0, collapsedCount);
  const hiddenCount = Math.max(0, upcoming.length - collapsedCount);

  return (
    <div className={`cc-wrap${isCompact ? " cc-wrap--compact" : ""}`}>
      {!isCompact && (
        <>
          <h2 className="cc-title">Community Calendar</h2>
          <p className="cc-sub">Upcoming calls, AMAs, and ecosystem events.</p>
        </>
      )}

      <div className="cc-list">
        {visible.length === 0 ? (
          <div className="cc-empty">No upcoming events scheduled. Check back soon.</div>
        ) : (
          visible.map((evt) => {
            const d = new Date(evt.date);
            const cat = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.dev_call;
            const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const linkable = hasUsableLink(evt.meeting_link);
            return (
              <div key={evt.id} className="cc-row">
                <div className="cc-date-chip">
                  <span className="cc-date-month">{MONTH_ABBR[d.getMonth()]}</span>
                  <span className="cc-date-day">{d.getDate()}</span>
                </div>

                <div className="cc-row-main">
                  <div className="cc-row-head">
                    <h3 className="cc-row-title">{evt.title}</h3>
                    <span
                      className="cc-badge"
                      style={{ backgroundColor: cat.bg, color: cat.text }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <p className="cc-row-meta">
                    {weekday} · {time} · {evt.duration_minutes} min
                  </p>
                  {evt.description && (
                    <p className="cc-row-desc">{evt.description}</p>
                  )}
                </div>

                {linkable ? (
                  <a
                    href={evt.meeting_link}
                    className="cc-join-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {evt.meeting_link_label || "Join"} →
                  </a>
                ) : (
                  <span className="cc-join-tba" aria-label="Meeting link to be announced">
                    Link TBA
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className="cc-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `View all (${upcoming.length})`}
        </button>
      )}
    </div>
  );
}
