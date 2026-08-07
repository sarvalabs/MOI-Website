import { drawBlob } from "../drawHelpers.js";
import { ramp, smoothstep } from "../timing.js";

const AGENTS = [
  {
    name: "Flight Agent",
    color: "#3A9F7E",
    lines: ["9pm arrival - SQ305", "window seat confirmed", "shellfish allergy noted", "budget: $740 spent"],
    start: 0.00,
    appearEnd: 0.04,
    fillEnd: 0.20,
    dwellEnd: 0.26,
    evapEnd: 0.36,
  },
  {
    name: "Hotel Agent",
    color: "#D4853A",
    lines: ["late check-in needed", "quiet room, no elevator", "shellfish allergy (breakfast)", "budget: $200/night"],
    start: 0.32,
    appearEnd: 0.36,
    fillEnd: 0.50,
    dwellEnd: 0.56,
    evapEnd: 0.66,
  },
  {
    name: "Dinner Agent",
    color: "#C44D5A",
    lines: ["Singapore, Oct 1 evening", "4 people, near venue", "no shellfish - allergy", "budget: $50/person"],
    start: 0.68,
    appearEnd: 0.72,
    fillEnd: 0.88,
    dwellEnd: 1.00,
    evapEnd: 1.00,
  },
];

// Default module-level state (used when no external particleState is passed)
let _evaporatingParticles = [];
let _phase2LastT = 0;
const _spawned = [false, false, false];

function getState(particleState) {
  if (particleState) {
    if (!particleState.evaporatingParticles) {
      particleState.evaporatingParticles = [];
      particleState.phase2LastT = 0;
      particleState.spawned = [false, false, false];
    }
    return particleState;
  }
  return {
    get evaporatingParticles() { return _evaporatingParticles; },
    set evaporatingParticles(v) { _evaporatingParticles = v; },
    get phase2LastT() { return _phase2LastT; },
    set phase2LastT(v) { _phase2LastT = v; },
    spawned: _spawned,
  };
}

function spawnEvaporation(ps, bx, by, bw, bh, color) {
  for (let i = 0; i < 36; i++) {
    ps.evaporatingParticles.push({
      x: bx + Math.random() * bw,
      y: by + 36 + Math.random() * (bh - 44),
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.3 + Math.random() * 0.6),
      life: 1.0,
      decay: 0.006 + Math.random() * 0.006,
      size: 1.5 + Math.random() * 2,
      color,
    });
  }
}

function updateAndDrawParticles(ctx, alpha, ps) {
  for (let i = ps.evaporatingParticles.length - 1; i >= 0; i--) {
    const p = ps.evaporatingParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.003;
    p.life -= p.decay;
    if (p.life <= 0) {
      ps.evaporatingParticles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = alpha * p.life * 0.5;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawArrow(ctx, x1, y1, x2, y2, active, color, time, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * (active ? 0.3 : 0.08);
  ctx.strokeStyle = active ? color : "#8D8D8D";
  ctx.lineWidth = 1.2;
  if (!active) ctx.setLineDash([4, 5]);
  ctx.beginPath();
  const cx = (x1 + x2) * 0.5 + 40;
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, (y1 + y2) * 0.5, x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (active) {
    const t = (time * 0.008) % 1;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (y1 + y2) * 0.5 + t * t * y2;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = "#8B6CC1";
    ctx.beginPath();
    ctx.arc(bx, by, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAgentBubble(ctx, x, y, agent, fillProgress, evapProgress, alpha) {
  const w = 230;
  const h = 145;
  const r = 14;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#FDFCFA";
  ctx.shadowColor = "rgba(20,20,20,0.06)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = `${agent.color}${evapProgress > 0 ? "15" : "35"}`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();

  ctx.fillStyle = `${agent.color}20`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 32, [r, r, 0, 0]);
  ctx.fill();

  ctx.fillStyle = agent.color;
  ctx.beginPath();
  ctx.arc(x + 14, y + 16, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = evapProgress > 0 ? "#BBBBBB" : "#27AE60";
  ctx.beginPath();
  ctx.arc(x + w - 14, y + 16, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0A051A";
  ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(agent.name, x + 24, y + 19);

  const visibleLines = Math.floor(fillProgress * agent.lines.length);
  const partial = (fillProgress * agent.lines.length) % 1;
  for (let i = 0; i < agent.lines.length; i++) {
    const ly = y + 50 + i * 21;
    ctx.fillStyle = agent.color;
    ctx.beginPath();
    ctx.arc(x + 14, ly - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    let text = "";
    if (i < visibleLines) text = agent.lines[i];
    else if (i === visibleLines) text = agent.lines[i].slice(0, Math.floor(partial * agent.lines[i].length));
    if (!text) continue;
    const lineAlpha = Math.max(0, 1 - evapProgress * 2);
    ctx.globalAlpha = alpha * lineAlpha;
    ctx.fillStyle = "#0A051A";
    ctx.font = '9px "Poppins", system-ui, sans-serif';
    ctx.fillText(text, x + 22, ly);
  }

  if (evapProgress > 0.15) {
    ctx.globalAlpha = alpha * evapProgress * 0.8;
    ctx.fillStyle = "#C0392B";
    ctx.font = 'italic 10px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("context lost", x + w * 0.5, y + h * 0.58);
  }

  ctx.restore();
  return { w, h };
}

export function drawContextEvaporation(ctx, state, tl, { cy, W }, particleState) {
  const { phase2Alpha, phase2T } = tl;
  if (phase2Alpha <= 0.01) return;

  const ps = getState(particleState);

  if (phase2T < ps.phase2LastT - 0.05) {
    ps.evaporatingParticles = [];
    ps.spawned[0] = false;
    ps.spawned[1] = false;
    ps.spawned[2] = false;
  }
  ps.phase2LastT = phase2T;

  const aliceX = Math.max(72, W * 0.12);
  const aliceY = cy;
  const bubbleX = W * 0.56;
  const ys = [cy - 170, cy, cy + 170];

  ctx.save();
  drawBlob(ctx, aliceX, aliceY, "#8B6CC1", "Alice", 30, phase2Alpha, state.time, false, 1);

  ctx.save();
  ctx.globalAlpha = phase2Alpha * 0.2;
  ctx.strokeStyle = "#4B17E5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(aliceX - 44, cy - 200);
  ctx.lineTo(aliceX - 44, cy + 210);
  ctx.stroke();
  const ty = cy - 200 + phase2T * 410;
  ctx.globalAlpha = phase2Alpha * 0.75;
  ctx.fillStyle = "#4B17E5";
  ctx.beginPath();
  ctx.arc(aliceX - 44, ty, 4, 0, Math.PI * 2);
  ctx.fill();
  ["Flight", "Hotel", "Dinner"].forEach((name, i) => {
    const y = cy - 120 + i * 120;
    const active = (i === 0 && phase2T < 0.36) || (i === 1 && phase2T >= 0.32 && phase2T < 0.66) || (i === 2 && phase2T >= 0.68);
    ctx.globalAlpha = phase2Alpha * (active ? 0.35 : 0.1);
    ctx.fillStyle = AGENTS[i].color;
    ctx.font = '7px "Poppins", system-ui, sans-serif';
    ctx.fillText(name, aliceX - 36, y);
  });
  ctx.restore();

  for (let i = 0; i < AGENTS.length; i++) {
    const a = AGENTS[i];
    const appear = smoothstep(ramp(phase2T, a.start, a.appearEnd));
    const fill = smoothstep(ramp(phase2T, a.appearEnd, a.fillEnd));
    const evap = a.evapEnd > a.dwellEnd ? smoothstep(ramp(phase2T, a.dwellEnd, a.evapEnd)) : 0;
    if (appear <= 0.01) continue;

    const b = drawAgentBubble(ctx, bubbleX, ys[i] - 72, a, fill, evap, phase2Alpha * appear);
    const active = phase2T >= a.appearEnd && phase2T < a.fillEnd;
    drawArrow(ctx, aliceX + 32, aliceY, bubbleX - 18, ys[i], active, a.color, state.time + i * 17, phase2Alpha * appear);

    if (a.evapEnd > a.dwellEnd) {
      if (phase2T < a.dwellEnd - 0.02) ps.spawned[i] = false;
      if (phase2T >= a.dwellEnd && !ps.spawned[i]) {
        spawnEvaporation(ps, bubbleX, ys[i] - 72, b.w, b.h, a.color);
        ps.spawned[i] = true;
      }
    }

    if (i > 0 && phase2T >= a.start && phase2T < a.appearEnd + 0.06) {
      ctx.save();
      ctx.globalAlpha = phase2Alpha * 0.35 * smoothstep(ramp(phase2T, a.start, a.appearEnd + 0.05));
      ctx.fillStyle = "#C0392B";
      ctx.font = '9px "Poppins", system-ui, sans-serif';
      ctx.fillText("starting from zero again...", bubbleX + 8, ys[i] - 88);
      ctx.restore();
    }

    if (i === 1 && phase2T > 0.42 && phase2T < 0.55) {
      ctx.save();
      ctx.globalAlpha = phase2Alpha * 0.22;
      ctx.fillStyle = "#C0392B";
      ctx.font = '8px "Poppins", system-ui, sans-serif';
      ctx.fillText("<- already known by Flight Agent", bubbleX + 130, ys[i] + 20);
      ctx.restore();
    }
  }

  updateAndDrawParticles(ctx, phase2Alpha, ps);

  if (phase2T > 0.82) {
    ctx.save();
    ctx.globalAlpha = phase2Alpha * smoothstep(ramp(phase2T, 0.82, 0.98)) * 0.35;
    ctx.fillStyle = "#0A051A";
    ctx.textAlign = "center";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.fillText("valuable context evaporates after every interaction - nothing persists", W * 0.5, cy + 280);
    ctx.restore();
  }

  ctx.restore();
}
