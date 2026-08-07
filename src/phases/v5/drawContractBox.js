import { drawBlob } from "../drawHelpers.js";
import { ramp, smoothstep } from "../timing.js";

const ENTRIES = [
  { key: "alice", value: 500, color: "#8B6CC1", delay: 0.00 },
  { key: "mark", value: 230, color: "#3A9F7E", delay: 0.06 },
  { key: "bob", value: 890, color: "#C47A2D", delay: 0.12 },
  { key: "diana", value: 1200, color: "#2D7EC4", delay: 0.18 },
  { key: "eve", value: 445, color: "#C44D5A", delay: 0.24 },
  { key: "frank", value: 78, color: "#7A8B5A", delay: 0.30 },
];

// Default module-level state (used when no external particleState is passed)
let _leakParticles = [];
let _lastPhase3T = 0;

function getState(particleState) {
  if (particleState) {
    if (!particleState.leakParticles) {
      particleState.leakParticles = [];
      particleState.lastPhase3T = 0;
    }
    return particleState;
  }
  return {
    get leakParticles() { return _leakParticles; },
    set leakParticles(v) { _leakParticles = v; },
    get lastPhase3T() { return _lastPhase3T; },
    set lastPhase3T(v) { _lastPhase3T = v; },
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function spawnLeakParticles(ps, leakX, leakY, vaultH) {
  ps.leakParticles.push({
    x: leakX + (Math.random() - 0.5) * 10,
    y: leakY + Math.random() * vaultH * 0.7,
    vx: 0.4 + Math.random() * 0.9,
    vy: (Math.random() - 0.5) * 0.4,
    life: 1.0,
    decay: 0.012 + Math.random() * 0.012,
    size: 1 + Math.random() * 1.5,
  });
}

function updateAndDrawLeakParticles(ctx, phase3Alpha, ps) {
  for (let i = ps.leakParticles.length - 1; i >= 0; i--) {
    const lp = ps.leakParticles[i];
    lp.x += lp.vx;
    lp.y += lp.vy;
    lp.life -= lp.decay;
    if (lp.life <= 0) {
      ps.leakParticles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = phase3Alpha * lp.life * 0.4;
    ctx.fillStyle = "rgba(192,57,43,0.5)";
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, lp.size * lp.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawContractBox(ctx, state, tl, { cx, cy, W }, particleState) {
  const { phase3Alpha, phase3T } = tl;
  if (phase3Alpha <= 0.01) return;

  const ps = getState(particleState);

  if (phase3T < ps.lastPhase3T - 0.05) ps.leakParticles = [];
  ps.lastPhase3T = phase3T;

  const pp = phase3T;
  const setupT = smoothstep(ramp(pp, 0.00, 0.15));
  const bugT = smoothstep(ramp(pp, 0.45, 0.58));
  const leakT = smoothstep(ramp(pp, 0.58, 0.90));
  const aftermathT = smoothstep(ramp(pp, 0.90, 1.00));

  const aliceX = W * 0.25;
  const aliceY = cy;
  const vaultW = 280;
  const vaultH = 220;
  const vaultX = W * 0.60;
  const vaultY = cy - vaultH * 0.5;
  const vaultLeft = vaultX;
  const leakPortX = vaultX + vaultW - 8;
  const leakPortY = vaultY + 62;
  const contentY = vaultY + 40;
  const contentH = vaultH - 52;

  ctx.save();
  drawBlob(ctx, aliceX, aliceY, "#8B6CC1", "Alice", 26, phase3Alpha * setupT, state.time, false, 1);

  const lineColorT = leakT;
  const lineAlpha = phase3Alpha * setupT * (1 - aftermathT);
  ctx.save();
  ctx.globalAlpha = lineAlpha;
  ctx.strokeStyle = lineColorT > 0.01 ? "rgba(192,57,43,0.30)" : "rgba(26,26,26,0.35)";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([4, 4]);
  const lineStartX = aliceX + 32;
  const lineEndX = vaultLeft - 2;
  const drawT = smoothstep(ramp(pp, 0.02, 0.13));
  const currentX = lerp(lineStartX, lineEndX, drawT);
  ctx.beginPath();
  ctx.moveTo(lineStartX, aliceY);
  ctx.lineTo(currentX, aliceY);
  ctx.stroke();
  ctx.setLineDash([]);
  if (drawT > 0.8 && aftermathT < 0.95) {
    const bal = Math.round(3343 * (1 - leakT));
    ctx.fillStyle = "rgba(26,26,26,0.45)";
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText(`balances[alice]: ${bal}`, (lineStartX + lineEndX) * 0.5 - 42, aliceY - 7);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = phase3Alpha * setupT;
  ctx.shadowColor = "rgba(20,20,20,0.08)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "rgba(26,26,26,0.04)";
  ctx.beginPath();
  ctx.roundRect(vaultX, vaultY, vaultW, vaultH, 16);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(26,26,26,0.20)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(vaultX, vaultY, vaultW, vaultH, 16);
  ctx.stroke();
  ctx.strokeStyle = "rgba(26,26,26,0.28)";
  ctx.lineWidth = 4.3;
  ctx.beginPath();
  ctx.moveTo(vaultLeft, vaultY + 14);
  ctx.lineTo(vaultLeft, vaultY + vaultH - 14);
  ctx.stroke();

  ctx.fillStyle = "rgba(26,26,26,0.05)";
  ctx.fillRect(vaultX + 1, vaultY + 1, vaultW - 2, 30);
  ctx.strokeStyle = "rgba(26,26,26,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vaultX, vaultY + 30);
  ctx.lineTo(vaultX + vaultW, vaultY + 30);
  ctx.stroke();

  ctx.fillStyle = "rgba(26,26,26,0.55)";
  ctx.font = '10px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("DEX Contract", vaultX + 12, vaultY + 19);

  for (let gy = contentY + 16; gy < vaultY + vaultH - 10; gy += 24) {
    ctx.strokeStyle = "rgba(26,26,26,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vaultX + 10, gy);
    ctx.lineTo(vaultX + vaultW - 10, gy);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = phase3Alpha * setupT;
  ctx.fillStyle = "rgba(26,26,26,0.50)";
  ctx.font = '8px "Poppins", system-ui, sans-serif';
  ctx.fillText("mapping(address => uint256) balances", vaultX + 12, vaultY + 42);
  ctx.fillStyle = "rgba(26,26,26,0.40)";
  ctx.fillText("{", vaultX + 12, vaultY + 58);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(vaultX + 4, contentY + 12, vaultW - 8, contentH - 16, 10);
  ctx.clip();

  for (let i = 0; i < ENTRIES.length; i++) {
    const entry = ENTRIES[i];
    const rowY = vaultY + 74 + i * 22;
    const leakLocal = smoothstep(ramp(leakT, entry.delay, entry.delay + 0.35));
    const driftX = leakLocal * (vaultW * 0.48);
    const fade = 1 - leakLocal * 0.96;
    const val = Math.max(0, Math.round(entry.value * (1 - leakLocal)));
    ctx.save();
    ctx.globalAlpha = phase3Alpha * setupT * fade;
    if (entry.key === "alice") {
      ctx.fillStyle = "rgba(123,94,167,0.10)";
      ctx.fillRect(vaultX + 20 + driftX, rowY - 10, 156, 15);
    }
    ctx.fillStyle = entry.color;
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText(`"${entry.key}" => ${val}`, vaultX + 24 + driftX, rowY);
    ctx.fillStyle = "rgba(26,26,26,0.14)";
    ctx.fillRect(vaultX + 156 + driftX, rowY - 6, 88 * (1 - leakLocal), 3);
    ctx.restore();
  }
  ctx.restore();

  if (pp >= 0.58 && pp <= 0.98 && leakT > 0.06 && state.time % 3 === 0) {
    spawnLeakParticles(ps, leakPortX, leakPortY, vaultH - 50);
  }
  updateAndDrawLeakParticles(ctx, phase3Alpha * setupT, ps);

  if (bugT > 0.001 || leakT > 0.001) {
    ctx.save();
    ctx.globalAlpha = phase3Alpha * setupT;
    ctx.strokeStyle = "rgba(192,57,43,0.55)";
    ctx.lineWidth = 1.6 + leakT * 1.2;
    ctx.beginPath();
    ctx.moveTo(leakPortX, leakPortY + 2);
    ctx.lineTo(leakPortX + 20, leakPortY + 2);
    ctx.stroke();

    ctx.globalAlpha = phase3Alpha * bugT * 0.7;
    ctx.fillStyle = "rgba(192,57,43,0.9)";
    ctx.font = 'bold 9px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("SMART CONTRACT BUG", vaultX + 12, vaultY + vaultH + 16);
    ctx.fillStyle = "rgba(192,57,43,0.7)";
    ctx.font = '8px "Poppins", system-ui, sans-serif';
    ctx.fillText("drainBalances()", vaultX + 166, vaultY + vaultH + 16);
    ctx.restore();
  }

  if (aftermathT > 0.001) {
    ctx.save();
    ctx.globalAlpha = phase3Alpha * aftermathT * 0.45;
    ctx.fillStyle = "rgba(192,57,43,0.6)";
    ctx.font = '11px "Poppins", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Smart contract bug: all tokens leaked.", cx, cy + 170);
    ctx.restore();
  }

  ctx.restore();
}
