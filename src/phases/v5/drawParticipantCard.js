import { ramp, smoothstep } from "../timing.js";

const COLORS = {
  alice: "#8B6CC1",
  authority: "#3A9F7E",
  preferences: "#D4853A",
  assets: "#3A7ED4",
  permissions: "#C44D5A",
  trust: "#D45A6A",
  history: "#7A8B5A",
};

const RING_COLORS = [COLORS.alice, COLORS.authority, COLORS.preferences, COLORS.assets, COLORS.permissions, COLORS.trust];

const TOKENS = [
  { name: "kMOI",   amount: "12,500", color: "#4B17E5" },
  { name: "BTC",    amount: "0.85",   color: "#F7931A" },
  { name: "ETH",    amount: "4.2",    color: "#627EEA" },
  { name: "SOL",    amount: "120",    color: "#9945FF" },
  { name: "USDC",   amount: "2,400",  color: "#2775CA" },
  { name: "NFT-07", amount: "owned",  color: "#C44D5A" },
];

const BRANCHES = [
  { key: "authority",    color: COLORS.authority,    dir: "up",          ppStart: 0.03, ppEnd: 0.18 },
  { key: "preferences",  color: COLORS.preferences,  dir: "left",        ppStart: 0.18, ppEnd: 0.33 },
  { key: "assets",       color: COLORS.assets,       dir: "right",       ppStart: 0.33, ppEnd: 0.48 },
  { key: "permissions",  color: COLORS.permissions,  dir: "down",        ppStart: 0.48, ppEnd: 0.63 },
  { key: "trust",        color: COLORS.trust,        dir: "upper-right", ppStart: 0.63, ppEnd: 0.78 },
  { key: "history",      color: COLORS.history,      dir: "lower-right", ppStart: 0.78, ppEnd: 0.93 },
];

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spring(t) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.cos(x * Math.PI * 3.2) * Math.exp(-5 * x);
}

function clamp(min, val, max) {
  return Math.max(min, Math.min(max, val));
}

function getBranchTarget(cx, cy, dir, offset) {
  switch (dir) {
    case "up":          return { x: cx,              y: cy - offset };
    case "down":        return { x: cx,              y: cy + offset };
    case "left":        return { x: cx - offset,     y: cy };
    case "right":       return { x: cx + offset,     y: cy };
    case "upper-right": return { x: cx + offset * 0.7, y: cy - offset * 0.7 };
    case "lower-right": return { x: cx + offset * 0.7, y: cy + offset * 0.7 };
    default:            return { x: cx + offset,     y: cy };
  }
}

function getPanelAnchor(cx, cy, dir, pw, ph, W, H, gap) {
  const margin = 24;
  const g = gap || 80;
  const goLeft = dir === "left" || dir === "lower-right";
  let px, py;
  if (goLeft) {
    px = clamp(margin, cx - pw - g, W - pw - margin);
  } else {
    px = clamp(margin, cx + g, W - pw - margin);
  }
  py = clamp(margin, cy - ph / 2, H - ph - margin);
  return { x: px, y: py };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawCurvedBranch(ctx, fromX, fromY, toX, toY, color, alpha, time, growT, phaseOff) {
  if (alpha <= 0.001 || growT <= 0.001) return;
  const ex = lerp(fromX, toX, growT);
  const ey = lerp(fromY, toY, growT);
  const cpX = (fromX + ex) * 0.5 + (ey - fromY) * 0.12;
  const cpY = (fromY + ey) * 0.5 - (ex - fromX) * 0.12;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(cpX, cpY, ex, ey);
  ctx.stroke();

  const dt = (time * 0.005 + phaseOff) % 1;
  const dt2 = dt * Math.max(0.05, growT);
  const dx = (1 - dt2) * (1 - dt2) * fromX + 2 * (1 - dt2) * dt2 * cpX + dt2 * dt2 * ex;
  const dy = (1 - dt2) * (1 - dt2) * fromY + 2 * (1 - dt2) * dt2 * cpY + dt2 * dt2 * ey;
  ctx.globalAlpha = alpha * Math.sin(dt * Math.PI);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(dx, dy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPanelCard(ctx, x, y, w, h, color, alpha) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(20,20,20,0.06)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#FDFCFA";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}25`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.stroke();
  ctx.fillStyle = `${color}CC`;
  ctx.beginPath();
  ctx.roundRect(x, y, 4, h, [14, 0, 0, 14]);
  ctx.fill();
  ctx.restore();
}

function drawPanelHeader(ctx, x, y, w, color, title, subtitle, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 18, y + 18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 13px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(title, x + 30, y + 22);
  ctx.fillStyle = "rgba(26,26,26,0.42)";
  ctx.font = '8px "Poppins", system-ui, sans-serif';
  ctx.fillText(subtitle, x + 14, y + 38);
  ctx.strokeStyle = "rgba(26,26,26,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 46);
  ctx.lineTo(x + w - 10, y + 46);
  ctx.stroke();
  ctx.restore();
}

function drawTokenCard(ctx, x, y, name, amount, color, alpha, w, h) {
  if (alpha < 0.01) return;
  w = w || 90;
  h = h || 70;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = `${color}14`;
  ctx.shadowColor = "rgba(20,20,20,0.04)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}33`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 11px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(name, x + w / 2, y + h * 0.38);
  ctx.fillStyle = "#0A051A";
  ctx.font = 'bold 14px "Poppins", system-ui, sans-serif';
  ctx.fillText(amount, x + w / 2, y + h * 0.68);
  ctx.restore();
}

function drawAliceNucleus(ctx, cx, cy, nucleusIn, phase4Alpha, time) {
  if (nucleusIn <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = phase4Alpha;

  const breathe = 1 + Math.sin(time * 0.008) * 0.06;
  const r = 40 * nucleusIn;
  const glowR = (r + 22) * breathe;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
  glow.addColorStop(0, "rgba(139,108,193,0.26)");
  glow.addColorStop(1, "rgba(139,108,193,0.00)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.alice;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const ig = ctx.createRadialGradient(cx - r * 0.24, cy - r * 0.28, 0, cx, cy, r);
  ig.addColorStop(0, "rgba(255,255,255,0.30)");
  ig.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = ig;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const ringR = r + 12;
  const gap = 0.08;
  const segArc = (Math.PI * 2 - gap * 6) / 6;
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `${RING_COLORS[i]}66`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const a0 = i * (segArc + gap) - Math.PI / 2;
    ctx.arc(cx, cy, ringR, a0, a0 + segArc);
    ctx.stroke();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = 'bold 14px "Poppins", system-ui, sans-serif';
  ctx.fillText("Alice", cx, cy + 4);
  ctx.fillStyle = "rgba(26,26,26,0.25)";
  ctx.font = '8px "Poppins", system-ui, sans-serif';
  ctx.fillText("0x8b6c...f2", cx, cy + r + 16);
  ctx.fillStyle = "rgba(123,94,167,0.30)";
  ctx.fillText("context superstate", cx, cy + r + 28);
  ctx.restore();
}

function drawAuthorityContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const fields = [
    ["scope", "plan-trip-japan"],
    ["granted", "Personal Agent"],
    ["depth", "3 levels max"],
    ["signed", "ed25519 ✓"],
    ["expires", "Oct 15, 2025"],
    ["boundary", "$2,000 spend limit"],
  ];
  const contentTop = py + 54;
  const rowH = (ph - 160) / fields.length;
  const total = ppStart + 0.04;
  for (let i = 0; i < fields.length; i++) {
    const fStart = total + i * 0.018;
    const fa = contentAlpha * smoothstep(ramp(pp, fStart, fStart + 0.015));
    if (fa <= 0.001) continue;
    const ry = contentTop + i * rowH;
    ctx.save();
    ctx.globalAlpha = fa;
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(58,159,126,0.04)";
      ctx.fillRect(px + 8, ry - 6, pw - 16, rowH);
    }
    ctx.fillStyle = COLORS.authority;
    ctx.font = 'bold 10px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(fields[i][0], px + 16, ry + 4);
    ctx.fillStyle = "#0A051A";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.fillText(fields[i][1], px + 110, ry + 4);
    ctx.restore();
  }
  const chainStart = total + 0.11;
  const chainA = contentAlpha * smoothstep(ramp(pp, chainStart, chainStart + 0.02));
  if (chainA > 0.01) {
    const bx = px + 14, by = py + ph - 100;
    ctx.save();
    ctx.globalAlpha = chainA;
    ctx.fillStyle = "rgba(58,159,126,0.06)";
    ctx.beginPath();
    ctx.roundRect(bx, by, pw - 28, 60, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(58,159,126,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, pw - 28, 60, 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(26,26,26,0.65)";
    ctx.font = '9px "Poppins", system-ui, sans-serif';
    ctx.fillText("Alice -> Personal -> Flight", bx + 12, by + 16);
    ctx.fillText("       -> Payment -> Bank", bx + 12, by + 30);
    ctx.fillStyle = "#27AE60";
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.fillText("all verified ✓", bx + 12, by + 46);
    ctx.restore();
  }
  const cbA = contentAlpha * smoothstep(ramp(pp, chainStart + 0.02, chainStart + 0.04));
  if (cbA > 0.01) {
    ctx.save();
    ctx.globalAlpha = cbA * 0.45;
    ctx.fillStyle = COLORS.authority;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("-> solves delegation", px + 16, py + ph - 16);
    ctx.restore();
  }
}

function drawPreferencesContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const rows = [
    { text: "shellfish allergy", src: "source: Hotel Agent", extra: "verified: 3 interactions" },
    { text: "window seat", src: "source: Flight Agent", extra: "consistent: 5/5 bookings" },
    { text: "late check-in (9pm+)", src: "source: Flight + Hotel", extra: "pattern: evening arrivals" },
    { text: "quiet rooms, no elevator", src: "source: Hotel Agent", extra: "" },
    { text: "budget: $200/night cap", src: "source: 3 hotel bookings", extra: "" },
    { text: "group dinners: 4 people", src: "source: Dinner Agent", extra: "" },
  ];
  const contentTop = py + 54;
  const rowH = (ph - 90) / rows.length;
  const total = ppStart + 0.04;
  for (let i = 0; i < rows.length; i++) {
    const fStart = total + i * 0.022;
    const fa = contentAlpha * smoothstep(ramp(pp, fStart, fStart + 0.018));
    if (fa <= 0.001) continue;
    const ry = contentTop + i * rowH;
    ctx.save();
    ctx.globalAlpha = fa;
    ctx.fillStyle = i % 2 === 0 ? "rgba(212,133,58,0.06)" : "rgba(212,133,58,0.02)";
    ctx.beginPath();
    ctx.roundRect(px + 10, ry, pw - 20, rowH - 4, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.preferences;
    ctx.beginPath();
    ctx.arc(px + 22, ry + rowH * 0.35, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A051A";
    ctx.font = 'bold 10px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(rows[i].text, px + 32, ry + rowH * 0.35);
    ctx.fillStyle = "rgba(26,26,26,0.40)";
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText(rows[i].src, px + 32, ry + rowH * 0.65);
    if (rows[i].extra) {
      ctx.fillStyle = "rgba(26,26,26,0.30)";
      ctx.font = '7px "Poppins", system-ui, sans-serif';
      ctx.fillText(rows[i].extra, px + 32, ry + rowH * 0.88);
    }
    ctx.restore();
  }
  const cbA = contentAlpha * smoothstep(ramp(pp, total + 0.14, total + 0.16));
  if (cbA > 0.01) {
    ctx.save();
    ctx.globalAlpha = cbA * 0.45;
    ctx.fillStyle = COLORS.preferences;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("-> solves context loss", px + 16, py + ph - 16);
    ctx.restore();
  }
}

function drawAssetsContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const cols = 2, numRows = 3;
  const contentTop = py + 56;
  const gridH = ph - 110;
  const cardW = (pw - 44) / cols;
  const cardH = (gridH) / numRows - 6;
  const gapX = 8, gapY = 6;
  const gridLeft = px + 14;

  for (let i = 0; i < TOKENS.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const fStart = ppStart + 0.04 + i * 0.025;
    const fa = contentAlpha * spring(ramp(pp, fStart, fStart + 0.03));
    if (fa <= 0.001) continue;
    const cx0 = gridLeft + col * (cardW + gapX);
    const cy0 = contentTop + row * (cardH + gapY);
    drawTokenCard(ctx, cx0, cy0, TOKENS[i].name, TOKENS[i].amount, TOKENS[i].color, fa, cardW, cardH);
  }
  const txtStart = ppStart + 0.15;
  const txtA = contentAlpha * smoothstep(ramp(pp, txtStart, txtStart + 0.02));
  if (txtA > 0.01) {
    ctx.save();
    ctx.globalAlpha = txtA * 0.55;
    ctx.fillStyle = COLORS.assets;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("native objects — not ledger entries", px + pw / 2, py + ph - 40);
    ctx.restore();
  }
  const cbA = contentAlpha * smoothstep(ramp(pp, txtStart + 0.02, txtStart + 0.04));
  if (cbA > 0.01) {
    ctx.save();
    ctx.globalAlpha = cbA * 0.45;
    ctx.fillStyle = COLORS.assets;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("-> solves token safety", px + 16, py + ph - 16);
    ctx.restore();
  }
}

function drawPermissionsContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const agents = [
    { name: "Flight Agent", perms: [["read: prefs", true], ["read: assets", false], ["write: history", true]] },
    { name: "Hotel Agent", perms: [["read: prefs", true], ["read: assets", false], ["write: history", true]] },
    { name: "DEX", perms: [["read: assets", true], ["transfer: 500", true], ["transfer: all", false]] },
    { name: "Lend Protocol", perms: [["read: trust", true], ["collateral", false]], denied: "(denied by Alice)" },
  ];
  const contentTop = py + 56;
  const blockH = (ph - 100) / agents.length;
  const total = ppStart + 0.04;
  for (let ai = 0; ai < agents.length; ai++) {
    const a = agents[ai];
    const aStart = total + ai * 0.028;
    const aAlpha = contentAlpha * smoothstep(ramp(pp, aStart, aStart + 0.02));
    if (aAlpha <= 0.001) continue;
    const by = contentTop + ai * blockH;
    ctx.save();
    ctx.globalAlpha = aAlpha;
    if (ai % 2 === 0) {
      ctx.fillStyle = "rgba(196,77,90,0.04)";
      ctx.fillRect(px + 8, by, pw - 16, blockH - 4);
    }
    ctx.fillStyle = "#0A051A";
    ctx.font = 'bold 10px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(a.name, px + 16, by + 16);
    const permLineH = (blockH - 28) / a.perms.length;
    for (let pi = 0; pi < a.perms.length; pi++) {
      const [perm, allowed] = a.perms[pi];
      ctx.fillStyle = allowed ? "#27AE60" : "rgba(196,77,90,0.60)";
      ctx.font = '9px "Poppins", system-ui, sans-serif';
      ctx.fillText(`${perm} ${allowed ? "✓" : "✗"}`, px + 140, by + 30 + pi * permLineH);
    }
    if (a.denied) {
      ctx.fillStyle = "rgba(26,26,26,0.35)";
      ctx.font = '8px "Poppins", system-ui, sans-serif';
      ctx.fillText(a.denied, px + 140, by + blockH - 8);
    }
    ctx.restore();
  }
  const footA = contentAlpha * smoothstep(ramp(pp, total + 0.10, total + 0.12));
  if (footA > 0.01) {
    ctx.save();
    ctx.globalAlpha = footA * 0.50;
    ctx.fillStyle = COLORS.permissions;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("scoped, signed, revocable", px + 16, py + ph - 16);
    ctx.restore();
  }
}

function drawTrustContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const fa = contentAlpha * smoothstep(ramp(pp, ppStart + 0.01, ppStart + 0.03));
  if (fa <= 0.001) return;
  const mid = py + ph * 0.38;
  ctx.save();
  ctx.globalAlpha = fa;
  ctx.fillStyle = "#0A051A";
  ctx.font = 'bold 36px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("0.94", px + pw / 2, mid);
  ctx.fillStyle = "rgba(26,26,26,0.08)";
  ctx.beginPath();
  ctx.roundRect(px + 20, mid + 16, pw - 40, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#27AE60";
  ctx.beginPath();
  ctx.roundRect(px + 20, mid + 16, (pw - 40) * 0.94, 10, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(26,26,26,0.50)";
  ctx.font = '10px "Poppins", system-ui, sans-serif';
  ctx.fillText("47 interactions · 12 agents", px + pw / 2, mid + 48);
  ctx.fillText("0 disputes · 3 verified trips", px + pw / 2, mid + 66);
  const stats = [
    { label: "interactions", val: "47" },
    { label: "agents", val: "12" },
    { label: "disputes", val: "0" },
    { label: "trips verified", val: "3" },
  ];
  const statTop = mid + 90;
  const statW = (pw - 40) / stats.length;
  for (let i = 0; i < stats.length; i++) {
    const sx = px + 20 + i * statW + statW / 2;
    ctx.fillStyle = "#0A051A";
    ctx.font = 'bold 16px "Poppins", system-ui, sans-serif';
    ctx.fillText(stats[i].val, sx, statTop);
    ctx.fillStyle = "rgba(26,26,26,0.35)";
    ctx.font = '7px "Poppins", system-ui, sans-serif';
    ctx.fillText(stats[i].label, sx, statTop + 14);
  }
  ctx.restore();
}

function drawHistoryContent(ctx, px, py, pw, ph, contentAlpha, pp, ppStart) {
  const log = [
    { date: "Oct 1", text: "Flight SQ305 booked", color: COLORS.authority },
    { date: "Oct 1", text: "Hotel Marina Bay ✓", color: COLORS.preferences },
    { date: "Oct 1", text: "Dinner: 4 pax, Lau Pa Sat", color: COLORS.preferences },
    { date: "Oct 2", text: "DEX: swap 50 kMOI", color: COLORS.assets },
    { date: "Oct 2", text: "Lend: denied (scope)", color: COLORS.permissions },
  ];
  const contentTop = py + 56;
  const rowH = (ph - 100) / log.length;
  const total = ppStart + 0.01;
  for (let i = 0; i < log.length; i++) {
    const fStart = total + i * 0.006;
    const fa = contentAlpha * smoothstep(ramp(pp, fStart, fStart + 0.005));
    if (fa <= 0.001) continue;
    const ry = contentTop + i * rowH;
    ctx.save();
    ctx.globalAlpha = fa;
    ctx.fillStyle = i % 2 === 0 ? "rgba(122,139,90,0.06)" : "rgba(122,139,90,0.02)";
    ctx.beginPath();
    ctx.roundRect(px + 10, ry, pw - 20, rowH - 4, 8);
    ctx.fill();
    ctx.fillStyle = log[i].color;
    ctx.beginPath();
    ctx.arc(px + 22, ry + rowH * 0.4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(26,26,26,0.40)";
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(log[i].date, px + 32, ry + rowH * 0.35);
    ctx.fillStyle = "#0A051A";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.fillText(log[i].text, px + 80, ry + rowH * 0.35);
    ctx.restore();
  }
  const footA = contentAlpha * smoothstep(ramp(pp, total + 0.035, total + 0.04));
  if (footA > 0.01) {
    ctx.save();
    ctx.globalAlpha = footA * 0.40;
    ctx.fillStyle = COLORS.history;
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("47 total interactions · full graph available", px + 16, py + ph - 16);
    ctx.restore();
  }
}

const STANDARD_PANEL = { w: 300, h: 320 };

const PANEL_SUBTITLES = {
  authority:   "scoped, signed, verifiable",
  preferences: "accumulated across 47 interactions",
  assets:      "native objects, not ledger entries",
  permissions: "scoped access control",
  trust:       "interaction-based trust score",
  history:     "full interaction log",
};

const CONTENT_DRAWERS = {
  authority:   drawAuthorityContent,
  preferences: drawPreferencesContent,
  assets:      drawAssetsContent,
  permissions: drawPermissionsContent,
  trust:       drawTrustContent,
  history:     drawHistoryContent,
};

export function drawParticipantCard(ctx, state, tl, { cx, cy, W, H }) {
  const { phase4Alpha, phase4T } = tl;
  if (phase4Alpha <= 0.01) return;

  const pp = phase4T;
  const scale = Math.max(0.5, Math.min(W, H) / 900);
  const nucleusIn = spring(ramp(pp, 0.00, 0.06));
  const stubsIn = smoothstep(ramp(pp, 0.93, 1.00));
  const captionIn = smoothstep(ramp(pp, 0.93, 1.00));
  const offset = clamp(130, W * 0.16, 240) * scale;

  ctx.save();
  drawAliceNucleus(ctx, cx, cy, nucleusIn, phase4Alpha, state.time);

  for (let bi = 0; bi < BRANCHES.length; bi++) {
    const b = BRANCHES[bi];
    const dur = b.ppEnd - b.ppStart;
    const lineGrow = smoothstep(easeOutCubic(ramp(pp, b.ppStart, b.ppStart + dur * 0.18)));
    const panelOpen = smoothstep(easeOutCubic(ramp(pp, b.ppStart + dur * 0.18, b.ppStart + dur * 0.28)));
    const retractStart = b.ppEnd - dur * 0.15;
    const retract = smoothstep(ramp(pp, retractStart, b.ppEnd));
    const branchAlpha = phase4Alpha * (1 - retract);
    const contentAlpha = branchAlpha * smoothstep(ramp(panelOpen, 0.6, 1.0));

    if (branchAlpha <= 0.005) continue;

    const pw = STANDARD_PANEL.w * scale;
    const ph = STANDARD_PANEL.h * scale;
    const gap = clamp(120, W * 0.14, 220) * scale;
    const anchor = getPanelAnchor(cx, cy, b.dir, pw, ph, W, H, gap);
    const goLeft = b.dir === "left" || b.dir === "lower-right";
    const edgeX = goLeft ? anchor.x + pw : anchor.x;
    const edgeY = anchor.y + ph / 2;
    const target = { x: edgeX, y: edgeY };

    drawCurvedBranch(ctx, cx, cy, target.x, target.y, b.color, branchAlpha * 0.65, state.time, lineGrow, bi * 0.17);

    if (lineGrow > 0.9) {
      ctx.save();
      ctx.globalAlpha = branchAlpha * lineGrow;
      ctx.fillStyle = `${b.color}66`;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (panelOpen > 0.01) {
      const panelScale = 0.9 + panelOpen * 0.1;
      const panelCx = anchor.x + pw / 2;
      const panelCy = anchor.y + ph / 2;

      ctx.save();
      ctx.translate(panelCx, panelCy);
      ctx.scale(panelScale, panelScale);
      ctx.translate(-panelCx, -panelCy);
      drawPanelCard(ctx, anchor.x, anchor.y, pw, ph, b.color, branchAlpha * panelOpen);
      drawPanelHeader(ctx, anchor.x, anchor.y, pw, b.color, b.key, PANEL_SUBTITLES[b.key], branchAlpha * panelOpen);
      if (contentAlpha > 0.01) {
        const drawer = CONTENT_DRAWERS[b.key];
        if (drawer) drawer(ctx, anchor.x, anchor.y, pw, ph, contentAlpha, pp, b.ppStart);
      }
      ctx.restore();
    }
  }

  if (stubsIn > 0.01) {
    const spin = state.time * 0.0004;
    const armLen = offset * 1.1;
    for (let bi = 0; bi < BRANCHES.length; bi++) {
      const b = BRANCHES[bi];
      const angle = (bi / 6) * Math.PI * 2 - Math.PI / 2 + spin;
      const tx = cx + Math.cos(angle) * armLen;
      const ty = cy + Math.sin(angle) * armLen;

      ctx.save();
      ctx.globalAlpha = phase4Alpha * stubsIn * 0.45;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      const dt = (state.time * 0.005 + bi * 0.17) % 1;
      ctx.globalAlpha = phase4Alpha * stubsIn * Math.sin(dt * Math.PI) * 0.7;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * armLen * dt, cy + Math.sin(angle) * armLen * dt, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = phase4Alpha * stubsIn * 0.85;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(tx, ty, 14, 0, Math.PI * 2);
      ctx.fill();
      const ig = ctx.createRadialGradient(tx - 4, ty - 4, 0, tx, ty, 14);
      ig.addColorStop(0, "rgba(255,255,255,0.28)");
      ig.addColorStop(1, "rgba(0,0,0,0.06)");
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(tx, ty, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 7px "Poppins", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.key.slice(0, 4).toUpperCase(), tx, ty + 1);
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = b.color;
      ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
      const labelDist = 30;
      const lx = tx + Math.cos(angle) * labelDist;
      const ly = ty + Math.sin(angle) * labelDist;
      ctx.fillText(b.key, lx, ly + 3);
      ctx.restore();
    }
  }

  if (captionIn > 0.001) {
    ctx.save();
    ctx.globalAlpha = phase4Alpha * captionIn * 0.35;
    ctx.fillStyle = "#0A051A";
    ctx.font = '11px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("One structure. Every interaction makes it richer.", cx, H - 44);
    ctx.restore();
  }

  ctx.restore();
}
