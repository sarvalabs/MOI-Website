import { drawBlob } from "../drawHelpers.js";
import { ramp, smoothstep } from "../timing.js";

const NODES = [
  { name: "Alice", color: "#8B6CC1", rad: 30, isUser: true },
  { name: "Personal Agent", color: "#4B17E5", rad: 22, isUser: false },
  { name: "Flight Agent", color: "#3A9F7E", rad: 22, isUser: false },
  { name: "Payment Agent", color: "#D4853A", rad: 22, isUser: false },
  { name: "Bank Agent", color: "#2D7EC4", rad: 22, isUser: false },
];

const BADGES = [
  {
    lines: ["Plan trip to Japan", "Budget: up to $2,000", "Share travel docs", "Authorized: Alice"],
    opacity: 1.0,
    widthScale: 1.0,
    color: "#8B6CC1",
  },
  {
    lines: ["Plan trip to Japan", "Budget: up to $2,000", "Share travel docs", "Authorized: Alice"],
    opacity: 0.85,
    widthScale: 0.95,
    color: "#8B6CC1",
  },
  {
    lines: ["Book flight to Japan", "Budget: ~$800?"],
    opacity: 0.45,
    widthScale: 0.70,
    color: "#8B6CC1",
  },
  {
    lines: ["Process payment", "$800"],
    opacity: 0.20,
    widthScale: 0.45,
    color: "#999999",
  },
  {
    lines: ["Move $800", "from ???"],
    opacity: 0.08,
    widthScale: 0.30,
    color: "#BBBBBB",
  },
];

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function alphaHex(a) {
  return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
}

function drawChainNode(ctx, x, y, node, alpha, time) {
  drawBlob(ctx, x, y, node.color, "", node.rad, alpha, time, false, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  if (node.isUser) {
    ctx.font = 'bold 11px "Poppins", system-ui, sans-serif';
    ctx.fillText("Alice", x, y + 4);
  } else {
    const [first, second] = node.name.split(" ");
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.fillText(first, x, y + 1);
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText(second || "", x, y + 12);
  }
  ctx.restore();
}

function drawAuthBadge(ctx, x, y, badgeState, alpha, reveal) {
  const w = 168 * badgeState.widthScale;
  const h = 56;
  const y0 = y - h / 2;
  const r = 9;
  const a = alpha * badgeState.opacity * reveal;
  if (a <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#FDFCFA";
  ctx.shadowColor = "rgba(20,20,20,0.08)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(x, y0, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = `${badgeState.color}${alphaHex(0.35)}`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y0, w, h, r);
  ctx.stroke();

  ctx.fillStyle = badgeState.color;
  ctx.beginPath();
  ctx.roundRect(x, y0, 3, h, [r, 0, 0, r]);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "#0A051A";
  ctx.font = '9px "Poppins", system-ui, sans-serif';
  for (let i = 0; i < badgeState.lines.length; i++) {
    ctx.fillText(badgeState.lines[i], x + 10, y0 + 15 + i * 10);
  }
  ctx.restore();
}

export function drawDelegationChain(ctx, state, tl, { cx, cy }) {
  const { phase1Alpha, phase1T } = tl;
  if (phase1Alpha <= 0.01) return;

  ctx.save();
  const spacing = 92;
  const startY = cy - 2 * spacing;
  const chainX = cx - 100;
  const badgeX = chainX + 180;
  const points = [];

  for (let i = 0; i < NODES.length; i++) {
    const node = NODES[i];
    const revealStart = i * 0.18;
    const reveal = smoothstep(easeOutCubic(ramp(phase1T, revealStart, revealStart + 0.14)));
    if (reveal <= 0.001) continue;
    const nx = chainX + ((i % 2 === 0 ? -10 : 16) + i * 4);
    const ny = startY + i * spacing;
    points.push({ x: nx, y: ny, reveal, idx: i });

    drawChainNode(ctx, nx, ny, node, phase1Alpha * reveal, state.time);
    drawAuthBadge(ctx, badgeX + i * 4, ny, BADGES[i], phase1Alpha, reveal);

    ctx.save();
    ctx.globalAlpha = phase1Alpha * reveal * 0.25;
    ctx.strokeStyle = "rgba(26,26,26,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(nx + 22, ny);
    ctx.lineTo(badgeX + i * 4, ny);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const c = NODES[i - 1].color;
    const a = phase1Alpha * Math.min(prev.reveal, cur.reveal);
    ctx.save();
    ctx.globalAlpha = a * 0.45;
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y + NODES[i - 1].rad - 4);
    ctx.lineTo(cur.x, cur.y - NODES[i].rad + 4);
    ctx.stroke();

    const t = (state.time * 0.008 + i * 0.2) % 1;
    const dx = prev.x + (cur.x - prev.x) * t;
    const dy = prev.y + NODES[i - 1].rad - 4 + (cur.y - NODES[i].rad + 4 - (prev.y + NODES[i - 1].rad - 4)) * t;
    ctx.fillStyle = c;
    ctx.globalAlpha = a * 0.8;
    ctx.beginPath();
    ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cur.x - 4, cur.y - NODES[i].rad + 9);
    ctx.lineTo(cur.x + 4, cur.y - NODES[i].rad + 9);
    ctx.lineTo(cur.x, cur.y - NODES[i].rad + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const labelMap = [
    { i: 2, text: "context lost" },
    { i: 3, text: "scope unclear" },
    { i: 4, text: "authority gone" },
  ];
  for (const item of labelMap) {
    const r = smoothstep(ramp(phase1T, item.i * 0.18 + 0.05, item.i * 0.18 + 0.16));
    if (r <= 0) continue;
    const p = points[item.i];
    if (!p) continue;
    ctx.save();
    ctx.globalAlpha = phase1Alpha * r * 0.35;
    ctx.fillStyle = "#C0392B";
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText(item.text, p.x + 45, p.y + 2);
    ctx.restore();
  }

  const last = points[points.length - 1];
  if (last && last.idx === 4 && last.reveal > 0.8) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 0.04);
    ctx.save();
    const gx = last.x + 38;
    const gy = last.y - 6;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 36);
    g.addColorStop(0, "rgba(192,57,43,0.15)");
    g.addColorStop(1, "rgba(192,57,43,0.00)");
    ctx.globalAlpha = phase1Alpha * 0.8;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = phase1Alpha * (0.45 + pulse * 0.35);
    ctx.strokeStyle = "rgba(192,57,43,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gx, gy, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#C0392B";
    ctx.font = 'bold 16px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("?", gx, gy + 5);
    ctx.textAlign = "left";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.fillText("Who authorized this?", gx + 22, gy + 3);
    ctx.restore();
  }

  if (phase1T > 0.75 && points.length >= 5) {
    const a = smoothstep(ramp(phase1T, 0.75, 0.9));
    const top = points[0];
    const bottom = points[4];
    const lx = top.x - 40;
    ctx.save();
    ctx.globalAlpha = phase1Alpha * a * 0.2;
    ctx.strokeStyle = "rgba(192,57,43,0.9)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(lx, top.y);
    ctx.lineTo(lx, bottom.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 12px "Poppins", system-ui, sans-serif';
    ctx.fillStyle = "rgba(192,57,43,0.85)";
    ctx.fillText("×", lx - 4, (top.y + bottom.y) * 0.5);
    ctx.font = '9px "Poppins", system-ui, sans-serif';
    ctx.fillText("alice has no visibility", lx + 8, (top.y + bottom.y) * 0.5 + 3);
    ctx.restore();
  }

  if (phase1T > 0.88) {
    const a = smoothstep(ramp(phase1T, 0.88, 1));
    ctx.save();
    ctx.globalAlpha = phase1Alpha * a * 0.35;
    ctx.fillStyle = "#0A051A";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("authorization degrades at every hop - like a game of telephone", cx, cy + 250);
    ctx.restore();
  }

  ctx.restore();
}
