import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_CHATBOT_API || "";
const CATEGORIES = ["dev_call", "office_hours", "workshop", "announcement"];
const CATEGORY_LABELS = {
  dev_call: "Community Call",
  office_hours: "Office Hours",
  workshop: "Workshop",
  announcement: "Announcement",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  time: "18:00",
  duration_minutes: 60,
  timezone: "UTC",
  meeting_link: "",
  meeting_link_label: "Join on Zoom",
  category: "dev_call",
  max_attendees: "",
};

export default function AdminCalendarPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem("moi-admin-key") || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function headers() {
    return { "Content-Type": "application/json", "x-admin-key": adminKey };
  }

  async function fetchEvents() {
    try {
      const res = await fetch(`${API_URL}/api/community-calls`);
      if (res.ok) setEvents(await res.json());
    } catch {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/community-calls`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ title: "__ping__", date: new Date().toISOString() }),
    });
    if (res.status === 401) {
      setError("Invalid admin key");
      return;
    }
    if (res.ok) {
      const created = await res.json();
      await fetch(`${API_URL}/api/community-calls/${created.id}`, {
        method: "DELETE",
        headers: headers(),
      });
    }
    localStorage.setItem("moi-admin-key", adminKey);
    setAuthenticated(true);
    setError("");
    fetchEvents();
  }

  useEffect(() => {
    if (authenticated) fetchEvents();
  }, [authenticated]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const dateTime = new Date(`${form.date}T${form.time}:00Z`).toISOString();
    const body = {
      title: form.title,
      description: form.description,
      date: dateTime,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      timezone: form.timezone,
      meeting_link: form.meeting_link,
      meeting_link_label: form.meeting_link_label,
      category: form.category,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
    };

    try {
      const url = editingId
        ? `${API_URL}/api/community-calls/${editingId}`
        : `${API_URL}/api/community-calls`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this event?")) return;
    try {
      await fetch(`${API_URL}/api/community-calls/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      fetchEvents();
    } catch {}
  }

  function handleEdit(evt) {
    const d = new Date(evt.date);
    setForm({
      title: evt.title || "",
      description: evt.description || "",
      date: d.toISOString().split("T")[0],
      time: d.toISOString().split("T")[1].slice(0, 5),
      duration_minutes: evt.duration_minutes || 60,
      timezone: evt.timezone || "UTC",
      meeting_link: evt.meeting_link || "",
      meeting_link_label: evt.meeting_link_label || "Join on Zoom",
      category: evt.category || "dev_call",
      max_attendees: evt.max_attendees || "",
    });
    setEditingId(evt.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authenticated) {
    return (
      <div className="admin-page">
        <Navbar />
        <div className="admin-login">
          <h1 className="admin-title">Admin Login</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              className="admin-input"
            />
            <button type="submit" className="admin-btn-primary">Sign in</button>
            {error && <p className="admin-error">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-content">
        <h1 className="admin-title">{editingId ? "Edit Event" : "Add Event"}</h1>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-row">
            <label className="admin-label">
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="admin-input"
                required
              />
            </label>
            <label className="admin-label">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="admin-input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-label">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="admin-input admin-textarea"
              rows={3}
            />
          </label>

          <div className="admin-form-row">
            <label className="admin-label">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="admin-input"
                required
              />
            </label>
            <label className="admin-label">
              Time (UTC)
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="admin-label">
              Duration (min)
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="admin-input"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label className="admin-label">
              Meeting Link
              <input
                type="url"
                value={form.meeting_link}
                onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                className="admin-input"
                placeholder="https://zoom.us/j/..."
              />
            </label>
            <label className="admin-label">
              Link Label
              <input
                type="text"
                value={form.meeting_link_label}
                onChange={(e) => setForm({ ...form, meeting_link_label: e.target.value })}
                className="admin-input"
              />
            </label>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Event" : "Add Event"}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h2 className="admin-section-title">All Events</h2>
        <div className="admin-events-list">
          {events.map((evt) => (
            <div key={evt.id} className="admin-event-row">
              <div className="admin-event-info">
                <span className="admin-event-title">{evt.title}</span>
                <span className="admin-event-date">
                  {new Date(evt.date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                  {" · "}
                  {CATEGORY_LABELS[evt.category] || evt.category}
                </span>
              </div>
              <div className="admin-event-actions">
                <button onClick={() => handleEdit(evt)} className="admin-btn-sm">Edit</button>
                <button onClick={() => handleDelete(evt.id)} className="admin-btn-sm admin-btn-danger">Delete</button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="admin-empty">No events yet.</p>}
        </div>
      </div>
    </div>
  );
}
