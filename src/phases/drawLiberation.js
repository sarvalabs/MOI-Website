import { PARTICIPANTS, P_COUNT } from "./constants.js";
import { smoothstep } from "./timing.js";

export function drawLiberation(sctx, state, timeline, { cx, cy, H, libParticles }) {
  const { libVisible, libT, libFade, crackT, miniFunnelT } = timeline;
  if (!libVisible || libT <= 0) return;

  sctx.save();
  sctx.globalAlpha = Math.max(0, libFade);

  const bottleneckX = cx + 20;
  const bottleneckY = cy;
  const originX = cx - 240;
  const neckW = 14;
  const funnelLeft = originX + 40;
  const funnelSpreadY = 100;
  const blockX = cx + 180;
  const blockW = 100;
  const blockH = 100;

  // Cracking funnel walls
  const splitY = crackT * 90;
  const funnelFade = Math.max(0, 1 - crackT * 1.8);
  if (funnelFade > 0.01) {
    sctx.globalAlpha = libFade * funnelFade;
    sctx.strokeStyle = "rgba(192,57,43,0.2)";
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(funnelLeft, bottleneckY - funnelSpreadY - splitY);
    sctx.quadraticCurveTo(bottleneckX - 40, bottleneckY - funnelSpreadY * 0.3 - splitY, bottleneckX, bottleneckY - neckW - splitY);
    sctx.lineTo(blockX - 10, bottleneckY - neckW - splitY);
    sctx.stroke();
    sctx.beginPath();
    sctx.moveTo(funnelLeft, bottleneckY + funnelSpreadY + splitY);
    sctx.quadraticCurveTo(bottleneckX - 40, bottleneckY + funnelSpreadY * 0.3 + splitY, bottleneckX, bottleneckY + neckW + splitY);
    sctx.lineTo(blockX - 10, bottleneckY + neckW + splitY);
    sctx.stroke();
    sctx.globalAlpha = libFade * funnelFade * 0.5;
    sctx.fillStyle = "rgba(26,26,26,0.03)";
    sctx.strokeStyle = "rgba(26,26,26,0.1)";
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.roundRect(blockX, cy - blockH / 2, blockW, blockH, 6);
    sctx.fill();
    sctx.stroke();
  }

  sctx.globalAlpha = libFade;

  // Liberation particles: burst → sort by color → flow into mini-funnels
  const mfSpacing = Math.min(90, (H - 80) / P_COUNT);
  const mfTop = cy - ((P_COUNT - 1) * mfSpacing) / 2;

  for (const lp of libParticles) {
    const color = PARTICIPANTS[lp.pIdx].color;
    const mfY = mfTop + lp.pIdx * mfSpacing;
    const adj = Math.max(0, (libT - lp.delay) / (1 - lp.delay));
    if (adj <= 0) continue;

    const burst = Math.min(1, adj * 2.5);
    const converge = smoothstep(Math.max(0, Math.min(1, (adj - 0.3) / 0.4)));

    if (converge < 0.95) {
      const bx = bottleneckX + lp.burstX * burst;
      const by = bottleneckY + lp.burstY * burst;
      const targetX = funnelLeft + 20 + (lp.wobblePhase / (Math.PI * 2)) * 100;
      const targetY = mfY + Math.sin(lp.wobblePhase) * 15;
      const dx = bx + (targetX - bx) * converge;
      const dy = by + (targetY - by) * converge;
      const wobble = Math.sin(state.time * 0.03 + lp.wobblePhase) * 3 * (1 - converge);
      const pa = Math.min(1, adj * 3) * (0.4 + converge * 0.4);
      const hex = Math.round(pa * 255).toString(16).padStart(2, "0");
      sctx.fillStyle = color + hex;
      sctx.beginPath();
      sctx.arc(dx + wobble, dy + wobble * 0.5, lp.size * (0.7 + converge * 0.3), 0, Math.PI * 2);
      sctx.fill();
    }
  }

  // Per-participant mini-funnels
  if (miniFunnelT > 0.01) {
    const mfBottleneckX = cx + 20;
    const mfBlockX = cx + 100 + (1 - miniFunnelT) * 80;
    const mfBlockW = 60;
    const mfBlockH = mfSpacing * 0.65;
    const mfNeckW = 9;
    const mfSpreadYLocal = mfSpacing * 0.38;

    for (let pi = 0; pi < P_COUNT; pi++) {
      const color = PARTICIPANTS[pi].color;
      const mfY = mfTop + pi * mfSpacing;

      sctx.globalAlpha = libFade * miniFunnelT;

      sctx.fillStyle = color + "90";
      sctx.font = '9px "DM Mono", monospace';
      sctx.textAlign = "right";
      sctx.fillText(PARTICIPANTS[pi].name, originX - 14, mfY + 3);
      sctx.fillStyle = color + "70";
      sctx.beginPath();
      sctx.arc(originX, mfY, 6, 0, Math.PI * 2);
      sctx.fill();

      sctx.strokeStyle = color + "35";
      sctx.lineWidth = 1.5;
      sctx.beginPath();
      sctx.moveTo(funnelLeft, mfY - mfSpreadYLocal);
      sctx.quadraticCurveTo(mfBottleneckX - 40, mfY - mfSpreadYLocal * 0.3, mfBottleneckX, mfY - mfNeckW);
      sctx.lineTo(mfBlockX - 8, mfY - mfNeckW);
      sctx.stroke();
      sctx.beginPath();
      sctx.moveTo(funnelLeft, mfY + mfSpreadYLocal);
      sctx.quadraticCurveTo(mfBottleneckX - 40, mfY + mfSpreadYLocal * 0.3, mfBottleneckX, mfY + mfNeckW);
      sctx.lineTo(mfBlockX - 8, mfY + mfNeckW);
      sctx.stroke();

      sctx.fillStyle = "rgba(26,26,26,0.03)";
      sctx.strokeStyle = "rgba(26,26,26,0.1)";
      sctx.lineWidth = 1;
      sctx.beginPath();
      sctx.roundRect(mfBlockX, mfY - mfBlockH / 2, mfBlockW, mfBlockH, 5);
      sctx.fill();
      sctx.stroke();

      const speeds = [1.0, 0.7, 1.3, 0.9, 1.1];
      const mfBlockNum = 1000 + pi * 137 + Math.floor(state.time * 0.012 * speeds[pi]) % 100;
      sctx.fillStyle = "rgba(26,26,26,0.2)";
      sctx.font = '8px "DM Mono", monospace';
      sctx.textAlign = "center";
      sctx.fillText("#" + mfBlockNum, mfBlockX + mfBlockW / 2, mfY - mfBlockH / 2 + 11);
      sctx.strokeStyle = "rgba(26,26,26,0.06)";
      sctx.beginPath();
      sctx.moveTo(mfBlockX + 6, mfY - mfBlockH / 2 + 15);
      sctx.lineTo(mfBlockX + mfBlockW - 6, mfY - mfBlockH / 2 + 15);
      sctx.stroke();

      for (let pb = 1; pb <= 2; pb++) {
        const pbx = mfBlockX + mfBlockW + 10 + (pb - 1) * 20;
        sctx.fillStyle = "rgba(26,26,26," + (0.02 / pb) + ")";
        sctx.strokeStyle = "rgba(26,26,26," + (0.06 / pb) + ")";
        sctx.beginPath();
        sctx.roundRect(pbx, mfY - mfBlockH * 0.4, mfBlockW * 0.65, mfBlockH * 0.8, 3);
        sctx.fill();
        sctx.stroke();
        sctx.strokeStyle = "rgba(26,26,26," + (0.08 / pb) + ")";
        sctx.beginPath();
        sctx.moveTo(pbx - 8, mfY);
        sctx.lineTo(pbx - 2, mfY);
        sctx.stroke();
      }

      const dotCount = 8;
      for (let d = 0; d < dotCount; d++) {
        const phase = ((state.time * 0.02 * speeds[pi] + d / dotCount + pi * 0.17) % 1);
        let ddx, ddy, ddr;
        if (phase < 0.4) {
          const t2 = phase / 0.4;
          const ease = t2 * t2;
          ddx = originX + (mfBottleneckX - 40 - originX) * ease;
          ddy = mfY + Math.sin(d * 2.1 + pi) * mfSpreadYLocal * (1 - ease);
          ddr = 3.5;
        } else if (phase < 0.7) {
          const t2 = (phase - 0.4) / 0.3;
          ddx = mfBottleneckX - 30 + t2 * (mfBlockX - mfBottleneckX + 20);
          ddy = mfY + Math.sin(state.time * 0.02 + d * 1.7) * mfNeckW * 0.7;
          ddr = 3;
        } else {
          const t2 = (phase - 0.7) / 0.3;
          ddx = mfBlockX - 8 + t2 * 30;
          ddy = mfY + (Math.sin(d * 3) * mfBlockH * 0.2) * (1 - t2);
          ddr = 2.5;
        }
        sctx.fillStyle = color + "99";
        sctx.beginPath();
        sctx.arc(ddx, ddy, ddr, 0, Math.PI * 2);
        sctx.fill();
      }
    }

    if (miniFunnelT > 0.5) {
      sctx.globalAlpha = libFade * Math.min(1, (miniFunnelT - 0.5) * 3) * 0.35;
      sctx.fillStyle = "rgba(123,94,167,0.8)";
      sctx.font = '11px "DM Mono", monospace';
      sctx.textAlign = "center";
      sctx.fillText("no global ordering — each participant processes independently", cx, mfTop + P_COUNT * mfSpacing + 36);
    }
  }

  sctx.restore();
}
