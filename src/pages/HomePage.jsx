import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/Navbar";
import LandingFooter from "../components/LandingFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";

const LITEPAPER_URL = "/MOILitePaper.pdf";
const API_URL = import.meta.env.VITE_CHATBOT_API || "http://localhost:3001";
const RENDER_INTERVAL_MS = 150;

/* ────────────────────────────────────────────────
   Participant Grid Canvas
   ──────────────────────────────────────────────── */

const SPACING = 85;
const AMBIENT_HIGHLIGHT_MS = 2500;
const AMBIENT_GLOW_MS = 2000;
const PURPLE = { r: 123, g: 94, b: 167 };
const DEFAULT_COLOR = { r: 26, g: 26, b: 26 };

const ACTIVITY_LABELS = {
  programming: "Programming", trading: "Trading", cooking: "Cooking",
  tennis: "Tennis", football: "Football", piano: "Piano", singing: "Singing",
  boxing: "Boxing", painting: "Painting", photography: "Photography",
  running: "Running", cycling: "Cycling", reading: "Reading",
  gaming: "Gaming", dancing: "Dancing",
};
const ACTIVITY_TYPES = Object.keys(ACTIVITY_LABELS);

function randomHex(n) {
  return [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function rand(min, max) { return min + Math.random() * (max - min); }

function buildParticipantPool(total) {
  const participants = [];
  while (participants.length < total) {
    for (const activity of shuffle(ACTIVITY_TYPES)) {
      participants.push({ activity, context: ACTIVITY_LABELS[activity] });
      if (participants.length >= total) return participants;
    }
  }
  return participants;
}

function buildGrid(w, h) {
  const cols = Math.ceil(w / SPACING) + 1;
  const rows = Math.ceil(h / SPACING) + 1;
  const offsetX = (w - (cols - 1) * SPACING) / 2;
  const offsetY = (h - (rows - 1) * SPACING) / 2;
  const total = cols * rows;
  const participants = buildParticipantPool(total);
  const nodes = [];
  let pi = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = participants[pi++];
      const stagger = (r % 2 === 0 ? -1 : 1) * SPACING * 0.22;
      const jx = rand(-SPACING * 0.16, SPACING * 0.16);
      const jy = rand(-SPACING * 0.2, SPACING * 0.2);
      nodes.push({
        x: Math.max(30, Math.min(w - 30, offsetX + c * SPACING + stagger + jx)),
        y: Math.max(28, Math.min(h - 24, offsetY + r * SPACING + jy)),
        id: `MOI-${randomHex(4)}`,
        activity: p.activity,
        context: p.context,
        labelOpacity: 0,
      });
    }
  }
  return nodes;
}

function drawLine(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function drawCircle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
function drawEllipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.stroke(); }

function drawFigure(ctx, x, y, scale, color, alpha, activity) {
  const s = scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
  ctx.lineWidth = 1.2 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const headR = 3.1 * s, headY = y - 11 * s, shoulderY = y - 6 * s, hipY = y + 5 * s, footY = y + 14 * s;
  drawCircle(ctx, x, headY, headR);
  switch (activity) {
    case "programming":
      drawLine(ctx,x,shoulderY,x+1*s,hipY);drawLine(ctx,x,shoulderY+2*s,x+6*s,y-1*s);drawLine(ctx,x,shoulderY+1*s,x+7*s,y+1*s);
      drawLine(ctx,x+1*s,hipY,x-4*s,y+9*s);drawLine(ctx,x-4*s,y+9*s,x-4*s,footY);drawLine(ctx,x+1*s,hipY,x+2*s,y+9*s);
      drawLine(ctx,x+2*s,y+9*s,x+7*s,y+9*s);drawLine(ctx,x+5*s,y-2*s,x+5*s,y+12*s);drawLine(ctx,x+5*s,y-2*s,x+14*s,y-2*s);
      drawLine(ctx,x+7*s,y-5*s,x+12*s,y-2*s);drawLine(ctx,x+12*s,y-2*s,x+7*s,y-2*s);break;
    case "trading":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-3*s,x+6*s,y-1*s);drawLine(ctx,x,y-1*s,x-4*s,y+2*s);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);ctx.strokeRect(x+7*s,y-8*s,8*s,10*s);
      drawLine(ctx,x+8.5*s,y-2*s,x+10.5*s,y-4.5*s);drawLine(ctx,x+10.5*s,y-4.5*s,x+12.5*s,y-1.5*s);
      drawLine(ctx,x+12.5*s,y-1.5*s,x+14*s,y-5*s);break;
    case "cooking":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x+5*s,y+1*s);drawLine(ctx,x,y-1*s,x+10*s,y-3*s);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);drawLine(ctx,x+5*s,y+5*s,x+16*s,y+5*s);
      ctx.strokeRect(x+8*s,y+1*s,6*s,4*s);drawLine(ctx,x+14*s,y+2*s,x+17*s,y+2*s);drawLine(ctx,x+10*s,y-3*s,x+12.5*s,y-7*s);break;
    case "tennis":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x-5*s,y+1*s);drawLine(ctx,x,y-2*s,x+6*s,y-4*s);
      drawLine(ctx,x,hipY,x-6*s,footY);drawLine(ctx,x,hipY,x+3*s,y+10*s);drawLine(ctx,x+3*s,y+10*s,x+8*s,footY);
      drawLine(ctx,x+6*s,y-4*s,x+11*s,y-7*s);drawEllipse(ctx,x+14*s,y-9*s,3*s,4.5*s,0.4);
      drawLine(ctx,x+11*s,y-7*s,x+12.5*s,y-5*s);break;
    case "football":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x-6*s,y);drawLine(ctx,x,y-2*s,x+5*s,y+1*s);
      drawLine(ctx,x,hipY,x-3*s,footY);drawLine(ctx,x,hipY,x+7*s,y+10*s);drawLine(ctx,x+7*s,y+10*s,x+11*s,y+12*s);
      drawCircle(ctx,x+13*s,y+12*s,2.2*s);break;
    case "piano":
      drawLine(ctx,x,shoulderY,x+1*s,hipY);drawLine(ctx,x,y-1*s,x+7*s,y+1*s);drawLine(ctx,x,y,x+8*s,y+2*s);
      drawLine(ctx,x+1*s,hipY,x-4*s,y+9*s);drawLine(ctx,x-4*s,y+9*s,x-4*s,footY);drawLine(ctx,x+1*s,hipY,x+1*s,footY-1*s);
      ctx.strokeRect(x+6*s,y-1*s,11*s,4*s);drawLine(ctx,x+7*s,y+3*s,x+6*s,y+9*s);drawLine(ctx,x+16*s,y+3*s,x+17*s,y+9*s);break;
    case "singing":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-3*s,x-5*s,y-7*s);drawLine(ctx,x,y-2*s,x+5*s,y);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);drawLine(ctx,x+8*s,y-7*s,x+8*s,y+13*s);
      drawCircle(ctx,x+8*s,y-8*s,1.3*s);break;
    case "boxing":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x-4*s,y-5*s);drawLine(ctx,x-4*s,y-5*s,x-6*s,y-2*s);
      drawLine(ctx,x,y-2*s,x+4*s,y-5*s);drawLine(ctx,x+4*s,y-5*s,x+6*s,y-2*s);drawCircle(ctx,x-6*s,y-2*s,1.5*s);
      drawCircle(ctx,x+6*s,y-2*s,1.5*s);drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);break;
    case "painting":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x+7*s,y-4*s);drawLine(ctx,x,y-1*s,x-4*s,y+2*s);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);ctx.strokeRect(x+8*s,y-8*s,8*s,10*s);
      drawLine(ctx,x+8*s,y+2*s,x+6*s,y+10*s);drawLine(ctx,x+16*s,y+2*s,x+18*s,y+10*s);drawLine(ctx,x+7*s,y-4*s,x+9*s,y-6*s);break;
    case "photography":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x-3*s,y-5*s);drawLine(ctx,x,y-2*s,x+3*s,y-5*s);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);ctx.strokeRect(x-2.5*s,y-6.5*s,5*s,3.5*s);
      drawCircle(ctx,x,y-4.75*s,0.9*s);break;
    case "running":
      drawLine(ctx,x-1*s,shoulderY,x+2*s,hipY);drawLine(ctx,x-1*s,y-2*s,x-6*s,y+1*s);drawLine(ctx,x,y-2*s,x+6*s,y-5*s);
      drawLine(ctx,x+2*s,hipY,x-5*s,y+10*s);drawLine(ctx,x-5*s,y+10*s,x-8*s,footY);drawLine(ctx,x+2*s,hipY,x+7*s,y+7*s);
      drawLine(ctx,x+7*s,y+7*s,x+11*s,y+10*s);break;
    case "cycling":
      drawCircle(ctx,x-8*s,y+12*s,4.5*s);drawCircle(ctx,x+8*s,y+12*s,4.5*s);drawLine(ctx,x-8*s,y+12*s,x-1*s,y+6*s);
      drawLine(ctx,x-1*s,y+6*s,x+3*s,y+12*s);drawLine(ctx,x+3*s,y+12*s,x-8*s,y+12*s);drawLine(ctx,x-1*s,y+6*s,x+7*s,y+5*s);
      drawLine(ctx,x+7*s,y+5*s,x+8*s,y+12*s);drawLine(ctx,x-1*s,y+6*s,x-1*s,y+2*s);drawLine(ctx,x+1*s,y-2*s,x-1*s,y+2*s);
      drawLine(ctx,x+1*s,y-2*s,x+5*s,y+2*s);drawLine(ctx,x+5*s,y+2*s,x+7*s,y+5*s);break;
    case "reading":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-2*s,x-4*s,y+1*s);drawLine(ctx,x,y-2*s,x+4*s,y+1*s);
      drawLine(ctx,x,hipY,x-4*s,footY);drawLine(ctx,x,hipY,x+4*s,footY);drawLine(ctx,x-4*s,y+1*s,x,y+3*s);
      drawLine(ctx,x+4*s,y+1*s,x,y+3*s);drawLine(ctx,x,y+3*s,x,y-1*s);break;
    case "gaming":
      drawLine(ctx,x,shoulderY,x+1*s,hipY);drawLine(ctx,x,y-1*s,x+5*s,y+1*s);drawLine(ctx,x,y,x+6*s,y+2*s);
      drawLine(ctx,x+1*s,hipY,x-4*s,y+9*s);drawLine(ctx,x-4*s,y+9*s,x-4*s,footY);drawLine(ctx,x+1*s,hipY,x+2*s,y+9*s);
      drawLine(ctx,x+2*s,y+9*s,x+7*s,y+10*s);drawLine(ctx,x+5*s,y+1*s,x+6.5*s,y+2.5*s);
      drawLine(ctx,x+6.5*s,y+2.5*s,x+8*s,y+1*s);drawLine(ctx,x+8*s,y+1*s,x+9.5*s,y+2.5*s);break;
    case "dancing":
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x,y-3*s,x-6*s,y-7*s);drawLine(ctx,x,y-2*s,x+7*s,y-5*s);
      drawLine(ctx,x,hipY,x-5*s,footY);drawLine(ctx,x,hipY,x+4*s,y+7*s);drawLine(ctx,x+4*s,y+7*s,x+8*s,y+4*s);break;
    default:
      drawLine(ctx,x,shoulderY,x,hipY);drawLine(ctx,x-6*s,y+1*s,x,y-3*s);drawLine(ctx,x,y-3*s,x+6*s,y+1*s);
      drawLine(ctx,x-5*s,y+14*s,x,hipY);drawLine(ctx,x,hipY,x+5*s,y+14*s);
  }
  ctx.restore();
}

function ParticipantCanvas({ parentRef }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const activeRef = useRef(-1);
  const activeUntilRef = useRef(0);
  const ripplesRef = useRef([]);
  const rafRef = useRef(null);
  const ambientTimerRef = useRef(null);

  const rebuild = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    if (!canvas || !parent) return;
    const dpr = window.devicePixelRatio || 1;
    const W = parent.offsetWidth;
    const H = parent.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    nodesRef.current = buildGrid(W, H);
  }, [parentRef]);

  useEffect(() => {
    rebuild();
    window.addEventListener("resize", rebuild);
    return () => window.removeEventListener("resize", rebuild);
  }, [rebuild]);

  useEffect(() => {
    const trigger = () => {
      const nodes = nodesRef.current;
      if (nodes.length === 0) return;
      const idx = Math.floor(Math.random() * nodes.length);
      const n = nodes[idx];
      activeRef.current = idx;
      activeUntilRef.current = Date.now() + AMBIENT_GLOW_MS;
      ripplesRef.current.push({ x: n.x, y: n.y, radius: 0, opacity: 1 });
    };
    const t = setTimeout(trigger, 1200);
    ambientTimerRef.current = setInterval(trigger, AMBIENT_HIGHLIGHT_MS);
    return () => { clearTimeout(t); if (ambientTimerRef.current) clearInterval(ambientTimerRef.current); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!ctxRef.current) ctxRef.current = canvas.getContext("2d");
    const ctx = ctxRef.current;
    const dpr = window.devicePixelRatio || 1;

    const loop = () => {
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const nodes = nodesRef.current;
      const ripples = ripplesRef.current;
      const isActive = Date.now() < activeUntilRef.current;
      if (!isActive) activeRef.current = -1;

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].radius += 8;
        ripples[i].opacity -= 0.02;
        if (ripples[i].opacity <= 0) ripples.splice(i, 1);
      }
      for (const rip of ripples) {
        ctx.save();
        ctx.strokeStyle = `rgba(${PURPLE.r},${PURPLE.g},${PURPLE.b},${rip.opacity * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        let alpha = 0.10, scale = 0.85, color = DEFAULT_COLOR;
        let ripI = 0;
        for (const rip of ripples) {
          const dx = n.x - rip.x, dy = n.y - rip.y;
          const rd = Math.sqrt(dx * dx + dy * dy);
          const ringDist = Math.abs(rd - rip.radius);
          if (ringDist < 50) ripI = Math.max(ripI, (1 - ringDist / 50) * rip.opacity);
        }
        if (ripI > 0) {
          color = {
            r: Math.round(DEFAULT_COLOR.r + (PURPLE.r - DEFAULT_COLOR.r) * ripI),
            g: Math.round(DEFAULT_COLOR.g + (PURPLE.g - DEFAULT_COLOR.g) * ripI),
            b: Math.round(DEFAULT_COLOR.b + (PURPLE.b - DEFAULT_COLOR.b) * ripI),
          };
          alpha = Math.max(alpha, 0.10 + ripI * 0.35);
          scale = Math.max(scale, 0.85 + ripI * 0.1);
        }
        const act = isActive && i === activeRef.current;
        if (act) { color = PURPLE; alpha = 0.7; scale = 1.0; }
        drawFigure(ctx, n.x, n.y, scale, color, alpha, n.activity);
        n.labelOpacity = act
          ? Math.min(1, n.labelOpacity + 0.08)
          : Math.max(0, n.labelOpacity - 0.06);
        if (n.labelOpacity > 0.01) {
          const label = `${n.id} · ${n.context}`;
          ctx.save();
          ctx.globalAlpha = n.labelOpacity;
          ctx.font = "300 9px 'DM Mono', monospace";
          const tw = ctx.measureText(label).width;
          const px = 20, rX = n.x + 16, lX = n.x - 16;
          const fitsR = rX + tw + px <= W;
          const drawR = fitsR || lX - tw - px < 0;
          const labelX = drawR ? rX : lX;
          const labelY = n.y - 18 < 12 ? n.y + 24 : n.y - 18;
          ctx.textAlign = drawR ? "left" : "right";
          ctx.textBaseline = "middle";
          const bgX = drawR ? labelX - 4 : labelX - tw - 4;
          ctx.fillStyle = `rgba(255,255,255,${n.labelOpacity * 0.88})`;
          ctx.beginPath();
          ctx.roundRect(bgX, labelY - 7, tw + 8, 14, 3);
          ctx.fill();
          ctx.fillStyle = `rgba(${PURPLE.r},${PURPLE.g},${PURPLE.b},${n.labelOpacity})`;
          ctx.fillText(label, labelX, labelY);
          ctx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="participant-grid-canvas"
    />
  );
}

/* ────────────────────────────────────────────────
   Ask Chat — ChatGPT-style
   ──────────────────────────────────────────────── */

const ASK_SUGGESTIONS = [
  { label: "Contextual Compute", q: "What is Contextual Compute?" },
  { label: "Context Superstate", q: "What is the Context Superstate?" },
  { label: "KRAMA consensus", q: "How does KRAMA achieve finality?" },
  { label: "MOI vs other L1s", q: "How is MOI different from other L1s?" },
];

function AskChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPills, setShowPills] = useState(true);
  const inputRef = useRef(null);
  const accRef = useRef("");
  const timerRef = useRef(null);

  const commitText = useCallback(() => {
    const text = accRef.current;
    if (!text) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.content !== text) {
        return [...prev.slice(0, -1), { ...last, content: text }];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const sendMessage = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;

    setShowPills(false);
    const userMsg = { role: "user", content: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    accRef.current = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    timerRef.current = setInterval(commitText, RENDER_INTERVAL_MS);

    try {
      const history = [...messages, userMsg].slice(-10);
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t, history }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "text") accRef.current += payload.text || "";
          } catch { /* skip */ }
        }
      }
    } catch {
      accRef.current = "";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { ...last, content: "Something went wrong. Try again." }];
        }
        return prev;
      });
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      commitText();
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <div className="ask-bar">
        <input
          ref={inputRef}
          type="text"
          className="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="Ask anything about MOI..."
          autoComplete="off"
        />
        <button className="ask-send" onClick={() => sendMessage()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {showPills && (
        <div className="ask-pills">
          {ASK_SUGGESTIONS.map((s) => (
            <button key={s.q} className="ask-pill" onClick={() => sendMessage(s.q)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="ask-resp">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="ask-resp-user">{msg.content}</div>
            ) : (
              <div key={i} className="ask-resp-bot">
                <span className="ask-resp-psi">ψ</span>
                {msg.content ? (
                  loading && i === messages.length - 1 ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: "0 0 8px", lineHeight: 1.8 }}>{children}</p>,
                        strong: ({ children }) => <strong style={{ fontWeight: 600, color: "#1A1A1A" }}>{children}</strong>,
                        ul: ({ children }) => <ul style={{ margin: "8px 0", paddingLeft: 18 }}>{children}</ul>,
                        li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.7 }}>{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )
                ) : loading && i === messages.length - 1 ? (
                  <span className="ask-typing"><span /><span /><span /></span>
                ) : null}
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────
   Home Page
   ──────────────────────────────────────────────── */

export default function HomePage() {
  const heroSectionRef = useRef(null);
  const heroRef = useScrollReveal();
  const askRef = useScrollReveal();

  return (
    <>
      <Navbar activePage="home" />

      <div className="home-page">
        {/* Hero */}
        <section className="home-hero" ref={heroSectionRef}>
          <ParticipantCanvas parentRef={heroSectionRef} />
          <div ref={heroRef} className="home-hero-inner fade-slide-up">
            <p className="home-hero-tag">Powered by the Participant Layer</p>
            <h1 className="home-hero-hl">
              The context infrastructure
              <br />
              for the AI economy
            </h1>
            <p className="home-hero-sub">
              MOI gives every participant — human or agent — persistent, portable
              existence in computation.
            </p>
            <div className="home-hero-ctas">
              <a href={LITEPAPER_URL} className="btn-primary">
                Read the Litepaper →
              </a>
              <Link to="/how-it-works" className="btn-ghost">
                See How It Works →
              </Link>
            </div>
          </div>
        </section>

        {/* Ask chatbot */}
        <section className="s-ask">
          <div ref={askRef} className="ask-center fade-slide-up">
            <h2 className="ask-hl">What can MOI help with?</h2>
            <AskChat />
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  );
}
