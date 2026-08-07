import { ALICE_COLOR, BOB_COLOR } from "../constants.js";
import { drawBlob } from "../drawHelpers.js";
import { ramp, smoothstep } from "../timing.js";

const NODE_NAMES = [
  "Fiona", "George", "Hana", "Ivan", "Jade", "Kai", "Luna", "Marco", "Nina", "Omar",
  "Priya", "Quinn", "Ravi", "Sara", "Tomas", "Uma", "Viktor", "Wendy", "Xia", "Yuri",
  "Zara", "Amir", "Bea",
];

const COLORS = [
  "#A8BFD0", "#D0BFA8", "#B8A8C8", "#A8D0BF", "#C8B8A8", "#A8C0D0", "#D0A8A8", "#A8D0C0",
  "#C0B8A8", "#B0A8D0", "#B8D0A8", "#D0A8B8", "#A8B0D0", "#C8BFA8", "#A8C8D0", "#C0A8B8",
  "#B8C8A8", "#D0B8C0",
];

const ARC_LABELS = ["transfer 50 MOI", "delegate auth -> DEX", "split hotel 400 MOI", "mint NFT-07"];

function clamp(min, val, max) {
  return Math.max(min, Math.min(max, val));
}

function srandFactory() {
  let seed = 7;
  return function srand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function buildMap(cx, cy, W, H) {
  const srand = srandFactory();
  const baseR = Math.max(W, H) * 0.48;
  const bands = [
    { scale: 0.24, count: 4, minR: 10, maxR: 13, appsMax: 2 },
    { scale: 0.42, count: 7, minR: 8, maxR: 11, appsMax: 2 },
    { scale: 0.62, count: 10, minR: 6.5, maxR: 9.5, appsMax: 2 },
    { scale: 0.85, count: 13, minR: 5.5, maxR: 8.5, appsMax: 2 },
  ];

  const systems = [];
  let ni = 0;
  let ci = 0;
  for (const band of bands) {
    const offset = srand() * Math.PI * 2;
    for (let i = 0; i < band.count; i++) {
      const a = (i / band.count) * Math.PI * 2 + offset + (srand() - 0.5) * 0.2;
      const r = baseR * band.scale * (0.92 + srand() * 0.16);
      const x = cx + Math.cos(a) * r * 1.15;
      const y = cy + Math.sin(a) * r * 0.7;
      const rad = band.minR + srand() * (band.maxR - band.minR);
      const appCount = 1 + Math.floor(srand() * band.appsMax);
      const apps = [];
      for (let ai = 0; ai < appCount; ai++) {
        apps.push({
          orbitR: rad + 12 + srand() * 5 + ai * 7,
          speed: 0.0006 * (1 + ai * 0.3),
          start: srand() * Math.PI * 2,
          rad: 2.2,
          color: `${COLORS[(ci + ai + 4) % COLORS.length]}B3`,
        });
      }
      systems.push({
        x,
        y,
        rad,
        dist: r,
        name: NODE_NAMES[ni % NODE_NAMES.length],
        color: COLORS[ci % COLORS.length],
        apps,
      });
      ni++;
      ci++;
    }
  }

  const links = [];
  const linkSet = new Set();
  for (let i = 0; i < systems.length; i++) {
    const nearest = [];
    for (let j = 0; j < systems.length; j++) {
      if (i === j) continue;
      const dx = systems[i].x - systems[j].x;
      const dy = systems[i].y - systems[j].y;
      nearest.push({ j, d: Math.hypot(dx, dy) });
    }
    nearest.sort((a, b) => a.d - b.d);
    const cnt = 1 + (srand() > 0.45 ? 1 : 0);
    for (let k = 0; k < cnt; k++) {
      const n = nearest[k];
      if (!n || n.d > 280) continue;
      const key = `${Math.min(i, n.j)}:${Math.max(i, n.j)}`;
      if (linkSet.has(key)) continue;
      linkSet.add(key);
      links.push({ a: i, b: n.j, phase: srand() });
    }
  }
  return { systems, links, baseR };
}

export function drawNetwork(ctx, state, tl, { cx, cy, W, H, mapRef }) {
  const { phase6Alpha, phase6T } = tl;
  if (phase6Alpha <= 0.01) return;

  if (!mapRef.current || mapRef.current.W !== W || mapRef.current.H !== H) {
    mapRef.current = { ...buildMap(cx, cy, W, H), W, H };
  }

  const { systems, links, baseR } = mapRef.current;
  const aliceX = cx - 100;
  const bobX = cx + 100;
  const bobY = cy;
  const aliceY = cy;

  ctx.save();
  for (const link of links) {
    const a = systems[link.a];
    const b = systems[link.b];
    const d = Math.max(a.dist, b.dist);
    const linkA = clamp(0, (phase6T - (d / baseR) * 0.35) / 0.2, 1);
    if (linkA <= 0) continue;
    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    grad.addColorStop(0, `${a.color}20`);
    grad.addColorStop(1, `${b.color}20`);
    ctx.globalAlpha = phase6Alpha * linkA * 0.18;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const t = (state.time * 0.0015 + link.phase) % 1;
    ctx.fillStyle = "#8B7BA3";
    ctx.globalAlpha = phase6Alpha * linkA * 0.45;
    ctx.beginPath();
    ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < systems.length; i++) {
    const s = systems[i];
    const nodeAlpha = clamp(0, (phase6T - (s.dist / baseR) * 0.35) / 0.2, 1);
    if (nodeAlpha <= 0) continue;
    for (let ai = 0; ai < s.apps.length; ai++) {
      const app = s.apps[ai];
      const a = app.start + state.time * app.speed;
      const x = s.x + Math.cos(a) * app.orbitR;
      const y = s.y + Math.sin(a) * app.orbitR;
      ctx.globalAlpha = phase6Alpha * nodeAlpha * 0.7;
      ctx.fillStyle = app.color;
      ctx.beginPath();
      ctx.arc(x, y, app.rad, 0, Math.PI * 2);
      ctx.fill();
    }
    drawBlob(ctx, s.x, s.y, s.color, "", s.rad, phase6Alpha * nodeAlpha, state.time, false, 1);
  }

  drawBlob(ctx, aliceX, aliceY, ALICE_COLOR, "Alice", 34, phase6Alpha, state.time, true, 1);
  drawBlob(ctx, bobX, bobY, BOB_COLOR, "Bob", 34, phase6Alpha, state.time, true, 1);

  const arcA = smoothstep(ramp(phase6T, 0.12, 0.38));
  if (arcA > 0) {
    const ax = aliceX + 40;
    const bx = bobX - 40;
    const mx = (ax + bx) * 0.5;
    const my = cy - 72;
    const grad = ctx.createLinearGradient(ax, cy, bx, cy);
    grad.addColorStop(0, ALICE_COLOR);
    grad.addColorStop(1, BOB_COLOR);
    ctx.globalAlpha = phase6Alpha * arcA * 0.7;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, cy);
    ctx.quadraticCurveTo(mx, my, bx, cy);
    ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const t = (state.time * 0.004 + i * 0.5) % 1;
      const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx;
      const py = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * my + t * t * cy;
      ctx.fillStyle = "#4B17E5";
      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(26,26,26,0.5)";
    ctx.font = '9px "Poppins", system-ui, sans-serif';
    const label = ARC_LABELS[Math.floor(state.time * 0.003) % ARC_LABELS.length];
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy - 90);
  }

  if (phase6T > 0.7) {
    ctx.globalAlpha = phase6Alpha * smoothstep(ramp(phase6T, 0.7, 0.9)) * 0.18;
    ctx.fillStyle = "#7B6B8A";
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(`36 PARTICIPANTS · ${links.length} INTERACTIONS · ALL PARALLEL`, cx, H - 36);
  }
  ctx.restore();
}
