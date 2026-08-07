import { PARTICIPANTS } from "../constants.js";
import { ramp, smoothstep } from "../timing.js";

const SPEEDS = [1.0, 0.7, 1.3, 0.9, 1.1];

function clamp(min, val, max) {
  return Math.max(min, Math.min(max, val));
}

function drawMiniFunnel(ctx, x, y, spacing, color, name, pi, time, alpha) {
  const blockW = 55;
  const blockH = spacing * 0.5;
  const neckX = x + 110;
  const neckY = y;
  const leftTopY = y - spacing * 0.28;
  const leftBottomY = y + spacing * 0.28;
  const blockX = x + 168;
  const blockY = y - blockH * 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0A051A";
  ctx.font = '8px "Poppins", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(name, x + 14, y + 3);
  ctx.fillStyle = "rgba(26,26,26,0.3)";
  ctx.fillText("context superstate", x + 14, y + 14);

  ctx.strokeStyle = `${color}55`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 70, leftTopY);
  ctx.quadraticCurveTo(x + 92, y - spacing * 0.15, neckX, neckY - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 70, leftBottomY);
  ctx.quadraticCurveTo(x + 92, y + spacing * 0.15, neckX, neckY + 5);
  ctx.stroke();

  ctx.fillStyle = "#FDFCFA";
  ctx.strokeStyle = "rgba(26,26,26,0.2)";
  ctx.beginPath();
  ctx.roundRect(blockX, blockY, blockW, blockH, 5);
  ctx.fill();
  ctx.stroke();

  const n = 1000 + pi * 137 + (Math.floor(time * 0.005 * SPEEDS[pi]) % 100);
  ctx.fillStyle = "#0A051A";
  ctx.font = '9px "Poppins", system-ui, sans-serif';
  ctx.fillText(String(n), blockX + 11, y + 3);

  for (let d = 0; d < 6; d++) {
    const t = (time * 0.006 * SPEEDS[pi] + d * 0.14) % 1;
    let px = 0;
    let py = 0;
    if (t < 0.6) {
      const rt = t / 0.6;
      px = x + 70 + rt * 42;
      py = y + (Math.sin(rt * Math.PI * 2 + d) * spacing * 0.14);
    } else if (t < 0.8) {
      const rt = (t - 0.6) / 0.2;
      px = neckX + rt * 36;
      py = y + (Math.sin(rt * Math.PI + d) * 4);
    } else {
      const rt = (t - 0.8) / 0.2;
      px = blockX + 8 + rt * (blockW - 16);
      py = y;
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.9;
    ctx.beginPath();
    ctx.arc(px, py, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawParallelLanes(ctx, state, tl, { W, H }) {
  const { phase5Alpha, phase5T } = tl;
  if (phase5Alpha <= 0.01) return;

  const subA = smoothstep(ramp(phase5T, 0.00, 0.33));
  const subB = smoothstep(ramp(phase5T, 0.33, 0.66));
  const subC = smoothstep(ramp(phase5T, 0.66, 1.00));
  const spacing = clamp(80, H * 0.14, 95);
  const top = H * 0.5 - ((PARTICIPANTS.length - 1) * spacing) * 0.5;

  ctx.save();
  if (phase5T < 0.40) {
    for (let i = 0; i < PARTICIPANTS.length; i++) {
      const p = PARTICIPANTS[i];
      const enter = smoothstep(ramp(phase5T, i * 0.05, i * 0.05 + 0.18));
      const collapse = smoothstep(ramp(phase5T, 0.16, 0.33));
      const y = top + i * spacing;
      const x = 160 + i * 10;
      const w = 150 * (1 - collapse) + 18 * collapse;
      const h = 56 * (1 - collapse) + 18 * collapse;
      ctx.globalAlpha = phase5Alpha * enter;
      ctx.fillStyle = "#FDFCFA";
      ctx.strokeStyle = `${p.color}40`;
      ctx.beginPath();
      ctx.roundRect(x, y - h * 0.5, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x + 14, y, 5 + collapse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0A051A";
      ctx.font = '9px "Poppins", system-ui, sans-serif';
      ctx.fillText(p.name, x + 24, y + 3);
      ctx.fillStyle = "rgba(26,26,26,0.28)";
      ctx.font = '7px "Poppins", system-ui, sans-serif';
      ctx.fillText("context superstate", x + 24, y + 14);
    }
  }

  if (subB > 0.01) {
    for (let i = 0; i < PARTICIPANTS.length; i++) {
      const p = PARTICIPANTS[i];
      const y = top + i * spacing;
      drawMiniFunnel(ctx, 120, y, spacing, p.color, p.name, i, state.time, phase5Alpha * subB);
    }
    ctx.save();
    ctx.globalAlpha = phase5Alpha * subB * 0.35;
    ctx.fillStyle = "#0A051A";
    ctx.textAlign = "center";
    ctx.font = '10px "Poppins", system-ui, sans-serif';
    ctx.fillText("no global ordering - each participant processes independently", W * 0.5, H - 44);
    ctx.restore();
  }

  if (subC > 0.01) {
    const laneLeft = 140;
    const laneRight = W - 40;
    const laneW = laneRight - laneLeft;
    for (let i = 0; i < PARTICIPANTS.length; i++) {
      const p = PARTICIPANTS[i];
      const y = top + i * spacing;
      ctx.save();
      ctx.globalAlpha = phase5Alpha * subC * 0.35;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(laneLeft, y);
      ctx.lineTo(laneRight, y);
      ctx.stroke();

      for (let d = 0; d < 10; d++) {
        const dx = (state.time * 0.7 + d * (laneW / 10) + i * 31) % (laneW + 30) - 15;
        const x = laneLeft + dx;
        const grad = ctx.createLinearGradient(x - 16, y, x + 2, y);
        grad.addColorStop(0, `${p.color}00`);
        grad.addColorStop(1, `${p.color}8C`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#27AE60";
      ctx.font = '12px "Poppins", system-ui, sans-serif';
      ctx.fillText("✓", laneRight + 8, y + 4);
      ctx.restore();
    }
  }

  ctx.restore();
}
