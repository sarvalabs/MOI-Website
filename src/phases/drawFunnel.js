import { PARTICIPANTS, P_COUNT } from "./constants.js";

export function drawFunnel(sctx, state, timeline, { cx, cy, W, spawnTx }) {
  const { chainAlpha } = timeline;
  if (chainAlpha <= 0.01) return;

  const { txPool } = state;

  sctx.save();
  sctx.globalAlpha = chainAlpha;

  if (state.time % 3 === 0) spawnTx();
  if (state.time % 5 === 0) spawnTx();

  const bottleneckX = cx + 20;
  const bottleneckY = cy;
  const blockX = cx + 180;
  const blockW = 100;
  const blockH = 100;
  const originX = cx - 240;
  const neckW = 14;
  const funnelLeft = originX + 40;
  const funnelSpreadY = 100;

  for (let i = 0; i < P_COUNT; i++) {
    const oy = cy - 80 + i * 40;
    sctx.fillStyle = PARTICIPANTS[i].color + "70";
    sctx.beginPath();
    sctx.arc(originX, oy, 6, 0, Math.PI * 2);
    sctx.fill();
    sctx.fillStyle = PARTICIPANTS[i].color + "90";
    sctx.font = '9px "DM Mono", monospace';
    sctx.textAlign = "right";
    sctx.fillText(PARTICIPANTS[i].name, originX - 14, oy + 3);
  }

  sctx.strokeStyle = "rgba(192,57,43,0.2)";
  sctx.lineWidth = 2;
  sctx.beginPath();
  sctx.moveTo(funnelLeft, bottleneckY - funnelSpreadY);
  sctx.quadraticCurveTo(bottleneckX - 40, bottleneckY - funnelSpreadY * 0.3, bottleneckX, bottleneckY - neckW);
  sctx.lineTo(blockX - 10, bottleneckY - neckW);
  sctx.stroke();
  sctx.beginPath();
  sctx.moveTo(funnelLeft, bottleneckY + funnelSpreadY);
  sctx.quadraticCurveTo(bottleneckX - 40, bottleneckY + funnelSpreadY * 0.3, bottleneckX, bottleneckY + neckW);
  sctx.lineTo(blockX - 10, bottleneckY + neckW);
  sctx.stroke();

  sctx.fillStyle = "rgba(26,26,26,0.03)";
  sctx.strokeStyle = "rgba(26,26,26,0.1)";
  sctx.lineWidth = 1;
  sctx.beginPath();
  sctx.roundRect(blockX, cy - blockH / 2, blockW, blockH, 6);
  sctx.fill();
  sctx.stroke();
  sctx.fillStyle = "rgba(26,26,26,0.2)";
  sctx.font = '10px "DM Mono", monospace';
  sctx.textAlign = "center";
  const currentBlock = 1042 + (Math.floor(state.time * 0.005) % 100);
  sctx.fillText(`Block #${currentBlock}`, blockX + blockW / 2, cy - blockH / 2 + 16);
  sctx.strokeStyle = "rgba(26,26,26,0.06)";
  sctx.beginPath();
  sctx.moveTo(blockX + 10, cy - blockH / 2 + 22);
  sctx.lineTo(blockX + blockW - 10, cy - blockH / 2 + 22);
  sctx.stroke();

  const ghostCount = 6;
  const availableW = W - (blockX + blockW + 16) - 20;
  const ghostGap = Math.min(availableW / ghostCount, 70);
  const ghostW = ghostGap - 12;
  const ghostH = blockH * 0.75;
  for (let pb = 1; pb <= ghostCount; pb++) {
    const pbx = blockX + blockW + 16 + (pb - 1) * ghostGap;
    const fade = Math.max(0.25, 1 - pb * 0.12);
    sctx.fillStyle = `rgba(26,26,26,${0.035 * fade})`;
    sctx.strokeStyle = `rgba(26,26,26,${0.12 * fade})`;
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.roundRect(pbx, cy - ghostH / 2, ghostW, ghostH, 4);
    sctx.fill();
    sctx.stroke();
    sctx.strokeStyle = `rgba(26,26,26,${0.15 * fade})`;
    sctx.beginPath();
    sctx.moveTo(pbx - 12, cy);
    sctx.lineTo(pbx - 2, cy);
    sctx.stroke();
    sctx.fillStyle = `rgba(26,26,26,${0.22 * fade})`;
    sctx.font = '7px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText(`#${currentBlock + pb}`, pbx + ghostW / 2, cy - ghostH / 2 + 10);
    sctx.strokeStyle = `rgba(26,26,26,${0.05 * fade})`;
    sctx.beginPath();
    sctx.moveTo(pbx + 4, cy - ghostH / 2 + 14);
    sctx.lineTo(pbx + ghostW - 4, cy - ghostH / 2 + 14);
    sctx.stroke();
  }

  let waitCount = 0;
  for (const tx of txPool) {
    if (!tx.alive) continue;
    tx.progress += tx.speed;
    if (tx.progress > 1.1) {
      tx.alive = false;
      continue;
    }
    const color = PARTICIPANTS[tx.pA].color;
    let drawX, drawY, drawR, drawAlpha;
    if (tx.progress < 0.35) {
      const t2 = tx.progress / 0.35;
      const originY = cy - 80 + tx.pA * 40;
      const ease = t2 * t2;
      drawX = originX + (bottleneckX - 40 - originX) * ease;
      drawY = originY + (bottleneckY + (tx.lane - 0.5) * neckW * 1.5 - originY) * ease;
      drawR = 4;
      drawAlpha = 0.6;
    } else if (tx.progress < 0.7) {
      const t2 = (tx.progress - 0.35) / 0.35;
      waitCount++;
      drawX = bottleneckX - 30 + t2 * (blockX - bottleneckX + 20);
      const squeeze = Math.sin(tx.wobble + state.time * 0.02) * neckW * 0.8;
      drawY = bottleneckY + squeeze;
      drawR = 3.5;
      drawAlpha = 0.7;
      drawX += Math.sin(state.time * 0.1 + tx.wobble) * 2;
      drawY += Math.cos(state.time * 0.12 + tx.wobble * 2) * 1.5;
    } else {
      const t2 = (tx.progress - 0.7) / 0.3;
      const slot = tx.id % 20;
      const col = slot % 4;
      const row = Math.floor(slot / 4);
      const targetX = blockX + 16 + col * 20;
      const targetY = cy - blockH / 2 + 30 + row * 14;
      drawX = blockX - 10 + t2 * (targetX - blockX + 10);
      drawY = bottleneckY + (targetY - bottleneckY) * Math.min(t2 * 2, 1);
      drawR = 3;
      drawAlpha = 0.5 + t2 * 0.2;
    }
    const hex = Math.round(drawAlpha * 255).toString(16).padStart(2, "0");
    sctx.fillStyle = color + hex;
    sctx.beginPath();
    sctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
    sctx.fill();
  }

  if (state.time % 60 === 0) state.txPool = state.txPool.filter((t) => t.alive);

  const counterPulse = Math.sin(state.time * 0.05) * 0.15 + 0.85;
  sctx.fillStyle = `rgba(192,57,43,${0.55 * counterPulse})`;
  sctx.font = '12px "DM Mono", monospace';
  sctx.textAlign = "center";
  sctx.fillText(`${waitCount} transactions waiting...`, bottleneckX - 10, bottleneckY + neckW + 40);
  const congestion = Math.min(waitCount / 15, 1);
  if (congestion > 0.3) {
    sctx.fillStyle = `rgba(192,57,43,${congestion * 0.2})`;
    sctx.font = '10px "DM Mono", monospace';
    sctx.fillText(congestion > 0.7 ? "⚠ HIGH CONTENTION" : "⚠ contention building", bottleneckX - 10, bottleneckY + neckW + 58);
  }
  sctx.fillStyle = "rgba(26,26,26,0.2)";
  sctx.font = '9px "DM Mono", monospace';
  sctx.fillText("one block at a time →", blockX + blockW / 2, cy + blockH / 2 + 24);
  sctx.restore();
}
