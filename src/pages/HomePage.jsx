import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import MOIChatbot from "../components/MOIChatbot";

const LITEPAPER_URL = "/MOILitePaper.pdf";
const NAV_H = 72;
const SPACING = 85;
const AMBIENT_HIGHLIGHT_MS = 2500;
const AMBIENT_GLOW_MS = 2000;
const PURPLE = { r: 123, g: 94, b: 167 };
const DEFAULT_COLOR = { r: 26, g: 26, b: 26 };

const LOADING_LINES = ["MOI:", "The Participant", "Layer"];
const CHAR_MS = 95;
const LINE_PAUSE_MS = 320;
const END_PAUSE_MS = 700;

const ACTIVITY_LABELS = {
  programming: "Programming",
  trading: "Trading",
  cooking: "Cooking",
  tennis: "Tennis",
  football: "Football",
  piano: "Piano",
  singing: "Singing",
  boxing: "Boxing",
  painting: "Painting",
  photography: "Photography",
  running: "Running",
  cycling: "Cycling",
  reading: "Reading",
  gaming: "Gaming",
  dancing: "Dancing",
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

function rand(min, max) {
  return min + Math.random() * (max - min);
}

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
  let participantIndex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const participant = participants[participantIndex++];
      const staggerOffset = (r % 2 === 0 ? -1 : 1) * SPACING * 0.22;
      const jitterX = rand(-SPACING * 0.16, SPACING * 0.16);
      const jitterY = rand(-SPACING * 0.2, SPACING * 0.2);
      const x = Math.max(30, Math.min(w - 30, offsetX + c * SPACING + staggerOffset + jitterX));
      const y = Math.max(28, Math.min(h - 24, offsetY + r * SPACING + jitterY));
      nodes.push({
        x,
        y,
        id: `MOI-${randomHex(4)}`,
        activity: participant.activity,
        context: participant.context,
        labelOpacity: 0,
      });
    }
  }
  return nodes;
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawEllipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFigure(ctx, x, y, scale, color, alpha, activity) {
  const s = scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
  ctx.lineWidth = 1.2 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const headR = 3.1 * s;
  const headY = y - 11 * s;
  const shoulderY = y - 6 * s;
  const hipY = y + 5 * s;
  const footY = y + 14 * s;

  drawCircle(ctx, x, headY, headR);

  switch (activity) {
    case "programming":
      drawLine(ctx, x, shoulderY, x + 1 * s, hipY);
      drawLine(ctx, x, shoulderY + 2 * s, x + 6 * s, y - 1 * s);
      drawLine(ctx, x, shoulderY + 1 * s, x + 7 * s, y + 1 * s);
      drawLine(ctx, x + 1 * s, hipY, x - 4 * s, y + 9 * s);
      drawLine(ctx, x - 4 * s, y + 9 * s, x - 4 * s, footY);
      drawLine(ctx, x + 1 * s, hipY, x + 2 * s, y + 9 * s);
      drawLine(ctx, x + 2 * s, y + 9 * s, x + 7 * s, y + 9 * s);
      drawLine(ctx, x + 5 * s, y - 2 * s, x + 5 * s, y + 12 * s);
      drawLine(ctx, x + 5 * s, y - 2 * s, x + 14 * s, y - 2 * s);
      drawLine(ctx, x + 7 * s, y - 5 * s, x + 12 * s, y - 2 * s);
      drawLine(ctx, x + 12 * s, y - 2 * s, x + 7 * s, y - 2 * s);
      break;

    case "trading":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 3 * s, x + 6 * s, y - 1 * s);
      drawLine(ctx, x, y - 1 * s, x - 4 * s, y + 2 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      ctx.strokeRect(x + 7 * s, y - 8 * s, 8 * s, 10 * s);
      drawLine(ctx, x + 8.5 * s, y - 2 * s, x + 10.5 * s, y - 4.5 * s);
      drawLine(ctx, x + 10.5 * s, y - 4.5 * s, x + 12.5 * s, y - 1.5 * s);
      drawLine(ctx, x + 12.5 * s, y - 1.5 * s, x + 14 * s, y - 5 * s);
      break;

    case "cooking":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x + 5 * s, y + 1 * s);
      drawLine(ctx, x, y - 1 * s, x + 10 * s, y - 3 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      drawLine(ctx, x + 5 * s, y + 5 * s, x + 16 * s, y + 5 * s);
      ctx.strokeRect(x + 8 * s, y + 1 * s, 6 * s, 4 * s);
      drawLine(ctx, x + 14 * s, y + 2 * s, x + 17 * s, y + 2 * s);
      drawLine(ctx, x + 10 * s, y - 3 * s, x + 12.5 * s, y - 7 * s);
      break;

    case "tennis":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x - 5 * s, y + 1 * s);
      drawLine(ctx, x, y - 2 * s, x + 6 * s, y - 4 * s);
      drawLine(ctx, x, hipY, x - 6 * s, footY);
      drawLine(ctx, x, hipY, x + 3 * s, y + 10 * s);
      drawLine(ctx, x + 3 * s, y + 10 * s, x + 8 * s, footY);
      drawLine(ctx, x + 6 * s, y - 4 * s, x + 11 * s, y - 7 * s);
      drawEllipse(ctx, x + 14 * s, y - 9 * s, 3 * s, 4.5 * s, 0.4);
      drawLine(ctx, x + 11 * s, y - 7 * s, x + 12.5 * s, y - 5 * s);
      break;

    case "football":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x - 6 * s, y);
      drawLine(ctx, x, y - 2 * s, x + 5 * s, y + 1 * s);
      drawLine(ctx, x, hipY, x - 3 * s, footY);
      drawLine(ctx, x, hipY, x + 7 * s, y + 10 * s);
      drawLine(ctx, x + 7 * s, y + 10 * s, x + 11 * s, y + 12 * s);
      drawCircle(ctx, x + 13 * s, y + 12 * s, 2.2 * s);
      break;

    case "piano":
      drawLine(ctx, x, shoulderY, x + 1 * s, hipY);
      drawLine(ctx, x, y - 1 * s, x + 7 * s, y + 1 * s);
      drawLine(ctx, x, y, x + 8 * s, y + 2 * s);
      drawLine(ctx, x + 1 * s, hipY, x - 4 * s, y + 9 * s);
      drawLine(ctx, x - 4 * s, y + 9 * s, x - 4 * s, footY);
      drawLine(ctx, x + 1 * s, hipY, x + 1 * s, footY - 1 * s);
      ctx.strokeRect(x + 6 * s, y - 1 * s, 11 * s, 4 * s);
      drawLine(ctx, x + 7 * s, y + 3 * s, x + 6 * s, y + 9 * s);
      drawLine(ctx, x + 16 * s, y + 3 * s, x + 17 * s, y + 9 * s);
      break;

    case "singing":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 3 * s, x - 5 * s, y - 7 * s);
      drawLine(ctx, x, y - 2 * s, x + 5 * s, y);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      drawLine(ctx, x + 8 * s, y - 7 * s, x + 8 * s, y + 13 * s);
      drawCircle(ctx, x + 8 * s, y - 8 * s, 1.3 * s);
      break;

    case "boxing":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x - 4 * s, y - 5 * s);
      drawLine(ctx, x - 4 * s, y - 5 * s, x - 6 * s, y - 2 * s);
      drawLine(ctx, x, y - 2 * s, x + 4 * s, y - 5 * s);
      drawLine(ctx, x + 4 * s, y - 5 * s, x + 6 * s, y - 2 * s);
      drawCircle(ctx, x - 6 * s, y - 2 * s, 1.5 * s);
      drawCircle(ctx, x + 6 * s, y - 2 * s, 1.5 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      break;

    case "painting":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x + 7 * s, y - 4 * s);
      drawLine(ctx, x, y - 1 * s, x - 4 * s, y + 2 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      ctx.strokeRect(x + 8 * s, y - 8 * s, 8 * s, 10 * s);
      drawLine(ctx, x + 8 * s, y + 2 * s, x + 6 * s, y + 10 * s);
      drawLine(ctx, x + 16 * s, y + 2 * s, x + 18 * s, y + 10 * s);
      drawLine(ctx, x + 7 * s, y - 4 * s, x + 9 * s, y - 6 * s);
      break;

    case "photography":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x - 3 * s, y - 5 * s);
      drawLine(ctx, x, y - 2 * s, x + 3 * s, y - 5 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      ctx.strokeRect(x - 2.5 * s, y - 6.5 * s, 5 * s, 3.5 * s);
      drawCircle(ctx, x, y - 4.75 * s, 0.9 * s);
      break;

    case "running":
      drawLine(ctx, x - 1 * s, shoulderY, x + 2 * s, hipY);
      drawLine(ctx, x - 1 * s, y - 2 * s, x - 6 * s, y + 1 * s);
      drawLine(ctx, x, y - 2 * s, x + 6 * s, y - 5 * s);
      drawLine(ctx, x + 2 * s, hipY, x - 5 * s, y + 10 * s);
      drawLine(ctx, x - 5 * s, y + 10 * s, x - 8 * s, footY);
      drawLine(ctx, x + 2 * s, hipY, x + 7 * s, y + 7 * s);
      drawLine(ctx, x + 7 * s, y + 7 * s, x + 11 * s, y + 10 * s);
      break;

    case "cycling":
      drawCircle(ctx, x - 8 * s, y + 12 * s, 4.5 * s);
      drawCircle(ctx, x + 8 * s, y + 12 * s, 4.5 * s);
      drawLine(ctx, x - 8 * s, y + 12 * s, x - 1 * s, y + 6 * s);
      drawLine(ctx, x - 1 * s, y + 6 * s, x + 3 * s, y + 12 * s);
      drawLine(ctx, x + 3 * s, y + 12 * s, x - 8 * s, y + 12 * s);
      drawLine(ctx, x - 1 * s, y + 6 * s, x + 7 * s, y + 5 * s);
      drawLine(ctx, x + 7 * s, y + 5 * s, x + 8 * s, y + 12 * s);
      drawLine(ctx, x - 1 * s, y + 6 * s, x - 1 * s, y + 2 * s);
      drawLine(ctx, x + 1 * s, y - 2 * s, x - 1 * s, y + 2 * s);
      drawLine(ctx, x + 1 * s, y - 2 * s, x + 5 * s, y + 2 * s);
      drawLine(ctx, x + 5 * s, y + 2 * s, x + 7 * s, y + 5 * s);
      break;

    case "reading":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 2 * s, x - 4 * s, y + 1 * s);
      drawLine(ctx, x, y - 2 * s, x + 4 * s, y + 1 * s);
      drawLine(ctx, x, hipY, x - 4 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, footY);
      drawLine(ctx, x - 4 * s, y + 1 * s, x, y + 3 * s);
      drawLine(ctx, x + 4 * s, y + 1 * s, x, y + 3 * s);
      drawLine(ctx, x, y + 3 * s, x, y - 1 * s);
      break;

    case "gaming":
      drawLine(ctx, x, shoulderY, x + 1 * s, hipY);
      drawLine(ctx, x, y - 1 * s, x + 5 * s, y + 1 * s);
      drawLine(ctx, x, y, x + 6 * s, y + 2 * s);
      drawLine(ctx, x + 1 * s, hipY, x - 4 * s, y + 9 * s);
      drawLine(ctx, x - 4 * s, y + 9 * s, x - 4 * s, footY);
      drawLine(ctx, x + 1 * s, hipY, x + 2 * s, y + 9 * s);
      drawLine(ctx, x + 2 * s, y + 9 * s, x + 7 * s, y + 10 * s);
      drawLine(ctx, x + 5 * s, y + 1 * s, x + 6.5 * s, y + 2.5 * s);
      drawLine(ctx, x + 6.5 * s, y + 2.5 * s, x + 8 * s, y + 1 * s);
      drawLine(ctx, x + 8 * s, y + 1 * s, x + 9.5 * s, y + 2.5 * s);
      break;

    case "dancing":
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x, y - 3 * s, x - 6 * s, y - 7 * s);
      drawLine(ctx, x, y - 2 * s, x + 7 * s, y - 5 * s);
      drawLine(ctx, x, hipY, x - 5 * s, footY);
      drawLine(ctx, x, hipY, x + 4 * s, y + 7 * s);
      drawLine(ctx, x + 4 * s, y + 7 * s, x + 8 * s, y + 4 * s);
      break;

    default:
      drawLine(ctx, x, shoulderY, x, hipY);
      drawLine(ctx, x - 6 * s, y + 1 * s, x, y - 3 * s);
      drawLine(ctx, x, y - 3 * s, x + 6 * s, y + 1 * s);
      drawLine(ctx, x - 5 * s, y + 14 * s, x, hipY);
      drawLine(ctx, x, hipY, x + 5 * s, y + 14 * s);
  }

  ctx.restore();
}

function ParticipantCanvas() {
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
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight - NAV_H;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    nodesRef.current = buildGrid(W, H);
  }, []);

  useEffect(() => {
    rebuild();
    window.addEventListener("resize", rebuild);
    return () => window.removeEventListener("resize", rebuild);
  }, [rebuild]);

  useEffect(() => {
    const triggerRandomHighlight = () => {
      const nodes = nodesRef.current;
      if (nodes.length === 0) return;

      const nextIndex = Math.floor(Math.random() * nodes.length);
      const nextNode = nodes[nextIndex];

      activeRef.current = nextIndex;
      activeUntilRef.current = Date.now() + AMBIENT_GLOW_MS;
      ripplesRef.current.push({
        x: nextNode.x,
        y: nextNode.y,
        radius: 0,
        opacity: 1,
      });
    };

    const initialTimeout = window.setTimeout(triggerRandomHighlight, 1200);
    ambientTimerRef.current = window.setInterval(
      triggerRandomHighlight,
      AMBIENT_HIGHLIGHT_MS
    );

    return () => {
      window.clearTimeout(initialTimeout);
      if (ambientTimerRef.current) window.clearInterval(ambientTimerRef.current);
    };
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
      const isHighlightActive = Date.now() < activeUntilRef.current;
      if (!isHighlightActive) activeRef.current = -1;

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

        let alpha = 0.10;
        let scale = 0.85;
        let color = DEFAULT_COLOR;

        let rippleIntensity = 0;
        for (const rip of ripples) {
          const rdx = n.x - rip.x;
          const rdy = n.y - rip.y;
          const rd = Math.sqrt(rdx * rdx + rdy * rdy);
          const ringDist = Math.abs(rd - rip.radius);
          if (ringDist < 50) {
            const t = (1 - ringDist / 50) * rip.opacity;
            rippleIntensity = Math.max(rippleIntensity, t);
          }
        }

        if (rippleIntensity > 0) {
          color = {
            r: Math.round(DEFAULT_COLOR.r + (PURPLE.r - DEFAULT_COLOR.r) * rippleIntensity),
            g: Math.round(DEFAULT_COLOR.g + (PURPLE.g - DEFAULT_COLOR.g) * rippleIntensity),
            b: Math.round(DEFAULT_COLOR.b + (PURPLE.b - DEFAULT_COLOR.b) * rippleIntensity),
          };
          alpha = Math.max(alpha, 0.10 + rippleIntensity * 0.35);
          scale = Math.max(scale, 0.85 + rippleIntensity * 0.1);
        }

        const isActive = isHighlightActive && i === activeRef.current;
        if (isActive) {
          color = PURPLE;
          alpha = 0.7;
          scale = 1.0;
        }

        drawFigure(ctx, n.x, n.y, scale, color, alpha, n.activity);

        if (isActive) {
          n.labelOpacity = Math.min(1, n.labelOpacity + 0.08);
        } else {
          n.labelOpacity = Math.max(0, n.labelOpacity - 0.06);
        }

        if (n.labelOpacity > 0.01) {
          const label = `${n.id} · ${n.context}`;
          ctx.save();
          ctx.globalAlpha = n.labelOpacity;
          ctx.font = "300 9px 'DM Mono', monospace";
          ctx.fillStyle = `rgba(${PURPLE.r},${PURPLE.g},${PURPLE.b},${n.labelOpacity})`;
          const metrics = ctx.measureText(label);
          const tw = metrics.width;
          const paddingX = 20;
          const rightX = n.x + 16;
          const leftX = n.x - 16;
          const fitsRight = rightX + tw + paddingX <= W;
          const drawRight = fitsRight || leftX - tw - paddingX < 0;
          const labelX = drawRight ? rightX : leftX;
          const labelY = n.y - 18 < 12 ? n.y + 24 : n.y - 18;
          ctx.textAlign = drawRight ? "left" : "right";
          ctx.textBaseline = "middle";
          const bgX = drawRight ? labelX - 4 : labelX - tw - 4;
          const bgW = tw + 8;
          const bgH = 14;
          ctx.fillStyle = `rgba(245,243,238,${n.labelOpacity * 0.88})`;
          ctx.beginPath();
          ctx.roundRect(bgX, labelY - bgH / 2, bgW, bgH, 3);
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
      className="fixed z-0"
      style={{ top: NAV_H, left: 0, background: "#F5F3EE" }}
    />
  );
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!isLoading) return;
    const clear = () => timersRef.current.forEach((t) => clearTimeout(t));
    const currentLine = LOADING_LINES[lineIndex];
    const isLineComplete = charIndex >= currentLine.length;
    const isLastLine = lineIndex === LOADING_LINES.length - 1;

    if (isLineComplete) {
      if (isLastLine) {
        const t = setTimeout(() => {
          setShowContent(true);
          setTimeout(() => setIsLoading(false), 900);
        }, END_PAUSE_MS);
        timersRef.current.push(t);
      } else {
        const t = setTimeout(() => {
          setLineIndex((i) => i + 1);
          setCharIndex(0);
        }, LINE_PAUSE_MS);
        timersRef.current.push(t);
      }
      return clear;
    }
    const t = setTimeout(() => setCharIndex((c) => c + 1), CHAR_MS);
    timersRef.current.push(t);
    return clear;
  }, [isLoading, lineIndex, charIndex]);

  const skipAnimation = () => {
    setShowContent(true);
    setTimeout(() => setIsLoading(false), 900);
  };

  return (
    <>
      {/* Loading overlay */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-[#F5F3EE] transition-opacity duration-[800ms] ease-out"
          style={{ opacity: showContent ? 0 : 1 }}
          onClick={skipAnimation}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && skipAnimation()}
          role="button"
          tabIndex={0}
          title="Click to skip"
        >
          <div className="text-center">
            {LOADING_LINES.slice(0, lineIndex).map((line, i) => (
              <div
                key={i}
                className="font-serif text-[clamp(3.5rem,10vw,9rem)] leading-[0.82] tracking-[-0.03em] text-[#1A1A1A]"
              >
                {line}
              </div>
            ))}
            <div className="font-serif text-[clamp(3.5rem,10vw,9rem)] leading-[0.82] tracking-[-0.03em] text-[#1A1A1A]">
              {LOADING_LINES[lineIndex]?.slice(0, charIndex)}
              {!showContent && (
                <span
                  className="cursor-caret inline-block w-[0.08em] h-[0.85em] ml-[0.02em] align-middle bg-[#1A1A1A]"
                  aria-hidden
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main page */}
      <div
        className="relative min-h-screen transition-opacity duration-[800ms] ease-out"
        style={{ opacity: showContent ? 1 : 0 }}
      >
        <ParticipantCanvas />

        {/* Navigation */}
        <nav
          className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-10 lg:px-16 h-[72px]"
          style={{ background: "#F5F3EE", borderBottom: "1px solid rgba(26,26,26,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo-moi-mark.png"
              alt="MOI logo"
              className="h-12 w-12 shrink-0"
            />
            <span className="font-mono text-xs tracking-[0.35em] uppercase font-medium text-[#1A1A1A]">
              MOI
            </span>
          </div>
          <div className="flex items-center gap-10">
            <a
              href="https://docs.moi.technology"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors duration-300"
              style={{ fontWeight: 400 }}
            >
              Docs
            </a>
            <Link
              to="/how-it-works"
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors duration-300"
              style={{ fontWeight: 400 }}
            >
              How it works
            </Link>
            <a
              href={LITEPAPER_URL}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors duration-300"
              style={{ fontWeight: 400 }}
            >
              Litepaper
            </a>
          </div>
        </nav>

        {/* Hero overlay */}
        <div
          className="fixed left-0 right-0 bottom-0 z-10 flex flex-col items-center justify-center pointer-events-none"
          style={{ top: NAV_H }}
        >
          <h1 className="font-serif text-[clamp(3.5rem,10vw,9rem)] leading-[0.82] tracking-[-0.03em] text-center text-[#1A1A1A]">
            The Participant<br />
            Layer
          </h1>

          <p className="font-mono text-[13px] tracking-[0.06em] mt-12 text-center">
            <span className="text-[#1A1A1A]/30">Powered by </span>
            <span className="text-[#1A1A1A]/70 font-medium">Contextual Compute</span>
          </p>

          <a
            href={LITEPAPER_URL}
            className="pointer-events-auto relative inline-flex items-center gap-3 mt-8 px-10 py-3 rounded-full bg-[#F5F3EE] hover:bg-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#1A1A1A] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] transition-all duration-300 group"
          >
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/85 group-hover:text-[#F5F3EE] transition-colors duration-300">
              Read Litepaper
            </span>
            <span className="text-[11px] text-[#1A1A1A]/40 group-hover:text-[#F5F3EE]/70 group-hover:translate-x-0.5 transition-all duration-300">
              →
            </span>
          </a>
        </div>

        <MOIChatbot />
      </div>
    </>
  );
}
