import { useState, useMemo } from "react";

const CATEGORY_COLORS = {
  dev_call: { bg: "rgba(123, 94, 167, 0.15)", text: "#7B5EA7", label: "Dev Call" },
  office_hours: { bg: "rgba(184, 212, 227, 0.3)", text: "#4A8BAF", label: "Office Hours" },
  workshop: { bg: "rgba(247, 209, 186, 0.3)", text: "#B87A4F", label: "Workshop" },
  announcement: { bg: "rgba(240, 217, 160, 0.3)", text: "#9A8135", label: "Announcement" },
};

function generatePlaceholderEvents() {
  const events = [];
  const start = new Date(2026, 4, 16); // May 16, 2026 (Friday)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i * 28);
    events.push({
      id: `evt-${i}`,
      title: i % 2 === 0 ? "MOI Community Call" : "MOI Office Hours",
      description: i % 2 === 0
        ? "Weekly community sync — protocol updates, ecosystem demos, and open Q&A."
        : "Drop in with questions about building on MOI. Core team available.",
      date: date.toISOString(),
      duration_minutes: 60,
      category: i % 2 === 0 ? "dev_call" : "office_hours",
      meeting_link: "#",
      meeting_link_label: "Join on Zoom",
    });
  }
  return events;
}

const EVENTS = generatePlaceholderEvents();

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

export default function CommunityCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(4); // May
  const [selectedEvent, setSelectedEvent] = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const eventsByDate = useMemo(() => {
    const map = {};
    EVENTS.forEach((evt) => {
      const d = new Date(evt.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cc-wrap">
      <h2 className="cc-title">Community Calendar</h2>
      <p className="cc-sub">Upcoming calls, office hours, and ecosystem events.</p>

      <div className="cc-container">
        <div className="cc-nav">
          <button onClick={prevMonth} className="cc-nav-btn" aria-label="Previous month">←</button>
          <span className="cc-month-label">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="cc-nav-btn" aria-label="Next month">→</button>
        </div>

        <div className="cc-grid-header">
          {DAYS.map((d) => (
            <div key={d} className="cc-day-label">{d}</div>
          ))}
        </div>

        <div className="cc-grid">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="cc-cell cc-cell-empty" />;

            const cellDate = new Date(viewYear, viewMonth, day);
            const key = `${viewYear}-${viewMonth}-${day}`;
            const dayEvents = eventsByDate[key] || [];
            const isToday = isSameDay(cellDate, today);

            return (
              <div
                key={i}
                className={`cc-cell${dayEvents.length ? " cc-cell-has-event" : ""}${isToday ? " cc-cell-today" : ""}`}
                onClick={() => dayEvents.length && setSelectedEvent(dayEvents[0])}
              >
                <span className={`cc-day-num${isToday ? " cc-today-num" : ""}`}>{day}</span>
                {dayEvents.map((evt) => {
                  const cat = CATEGORY_COLORS[evt.category];
                  return (
                    <div
                      key={evt.id}
                      className="cc-event-dot"
                      style={{ backgroundColor: cat.bg, color: cat.text }}
                    >
                      <span className="cc-event-dot-text">{evt.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <div className="cc-detail-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="cc-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="cc-detail-close" onClick={() => setSelectedEvent(null)}>×</button>
            <div className="cc-detail-cat">
              <span
                className="cc-badge"
                style={{
                  backgroundColor: CATEGORY_COLORS[selectedEvent.category].bg,
                  color: CATEGORY_COLORS[selectedEvent.category].text,
                }}
              >
                {CATEGORY_COLORS[selectedEvent.category].label}
              </span>
            </div>
            <h3 className="cc-detail-title">{selectedEvent.title}</h3>
            <p className="cc-detail-date">
              {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
              {" · "}
              {new Date(selectedEvent.date).toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit",
              })}
              {" · "}
              {selectedEvent.duration_minutes} min
            </p>
            <p className="cc-detail-desc">{selectedEvent.description}</p>
            <a href={selectedEvent.meeting_link} className="cc-join-btn" target="_blank" rel="noopener noreferrer">
              {selectedEvent.meeting_link_label} →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
