import { FIELD_COLORS, FIELD_KEYS, FIELD_BARS, CARD_W, CARD_H, CARD_R } from "./constants.js";

export function drawBlob(sctx, x, y, color, name, rad, alpha, t, showRing, globalAlpha = 1) {
  if (alpha <= 0.01) return;
  sctx.save();
  sctx.globalAlpha = globalAlpha * alpha;

  if (showRing && rad >= 20) {
    const ringR = rad + 6;
    const gap = 0.06;
    const segArc = (Math.PI * 2 - gap * 6) / 6;
    for (let fi = 0; fi < 6; fi++) {
      const startA = fi * (segArc + gap) - Math.PI / 2;
      sctx.strokeStyle = FIELD_COLORS[fi] + "aa";
      sctx.lineWidth = 3.5;
      sctx.beginPath();
      sctx.arc(x, y, ringR, startA, startA + segArc);
      sctx.stroke();
    }
  }

  const glow = sctx.createRadialGradient(x, y, rad * 0.5, x, y, rad * 2.2);
  glow.addColorStop(0, color + "22");
  glow.addColorStop(0.6, color + "0a");
  glow.addColorStop(1, color + "00");
  sctx.fillStyle = glow;
  sctx.beginPath();
  sctx.arc(x, y, rad * 2.2, 0, Math.PI * 2);
  sctx.fill();

  sctx.fillStyle = color;
  sctx.beginPath();
  sctx.arc(x, y, rad, 0, Math.PI * 2);
  sctx.fill();

  const ig = sctx.createRadialGradient(x - rad * 0.22, y - rad * 0.28, 0, x, y, rad);
  ig.addColorStop(0, "rgba(255,255,255,0.32)");
  ig.addColorStop(0.6, "rgba(255,255,255,0.06)");
  ig.addColorStop(1, "rgba(0,0,0,0.08)");
  sctx.fillStyle = ig;
  sctx.beginPath();
  sctx.arc(x, y, rad, 0, Math.PI * 2);
  sctx.fill();

  if (rad >= 14 && name) {
    sctx.fillStyle = "#fff";
    const fontSize = Math.max(8, Math.min(15, rad * 0.38));
    sctx.font = 'bold ' + Math.round(fontSize) + 'px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText(name, x, y + 1);
    sctx.textBaseline = "alphabetic";
  }

  sctx.restore();
}

export function drawAppDot(sctx, x, y, color, name, rad, alpha, globalAlpha = 1) {
  if (alpha <= 0.01) return;
  sctx.save();
  sctx.globalAlpha = globalAlpha * alpha;
  sctx.fillStyle = color + "30";
  sctx.strokeStyle = color + "bb";
  sctx.lineWidth = 1.8;
  sctx.beginPath();
  sctx.arc(x, y, rad, 0, Math.PI * 2);
  sctx.fill();
  sctx.stroke();
  if (name) {
    sctx.fillStyle = color;
    sctx.font = 'bold ' + Math.max(8, Math.round(rad * 0.55)) + 'px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText(name, x, y + 1);
    sctx.textBaseline = "alphabetic";
  }
  sctx.restore();
}

export function drawCard(sctx, x, y, color, name, hash, values, alpha, highlightIdx, globalAlpha = 1) {
  if (alpha <= 0.01) return;
  const cardW = CARD_W, cardH = CARD_H, cardR = CARD_R;
  sctx.save();
  sctx.globalAlpha = globalAlpha * alpha;

  sctx.shadowColor = "rgba(20,20,20,0.14)";
  sctx.shadowBlur = 20;
  const cx0 = x - cardW / 2, cy0 = y - cardH / 2;
  sctx.fillStyle = "#FAF8F3";
  sctx.beginPath();
  sctx.roundRect(cx0, cy0, cardW, cardH, cardR);
  sctx.fill();
  sctx.shadowBlur = 0;

  sctx.strokeStyle = color + "38";
  sctx.lineWidth = 2;
  sctx.beginPath();
  sctx.roundRect(cx0, cy0, cardW, cardH, cardR);
  sctx.stroke();

  sctx.save();
  sctx.beginPath();
  sctx.roundRect(cx0, cy0, cardW, cardH, cardR);
  sctx.clip();

  sctx.fillStyle = color;
  sctx.beginPath();
  sctx.arc(cx0 + 22, cy0 + 26, 7, 0, Math.PI * 2);
  sctx.fill();
  sctx.fillStyle = "#141414";
  sctx.font = 'bold 16px "DM Mono", monospace';
  sctx.textAlign = "left";
  sctx.fillText(name, cx0 + 36, cy0 + 32);
  sctx.fillStyle = "rgba(20,20,20,0.42)";
  sctx.font = '9px "DM Mono", monospace';
  sctx.fillText(hash, cx0 + 22, cy0 + 50);
  sctx.strokeStyle = "rgba(26,26,26,0.10)";
  sctx.lineWidth = 1;
  sctx.beginPath();
  sctx.moveTo(cx0 + 14, cy0 + 60);
  sctx.lineTo(cx0 + cardW - 14, cy0 + 60);
  sctx.stroke();

  for (let fi = 0; fi < 6; fi++) {
    const fy = cy0 + 76 + fi * 28;
    const isHi = fi === highlightIdx;
    if (isHi) { sctx.fillStyle = FIELD_COLORS[fi] + "1a"; sctx.fillRect(cx0 + 6, fy - 10, cardW - 12, 24); }
    sctx.fillStyle = FIELD_COLORS[fi] + (isHi ? "ff" : "bb");
    sctx.beginPath(); sctx.arc(cx0 + 22, fy + 2, 4, 0, Math.PI * 2); sctx.fill();
    sctx.fillStyle = FIELD_COLORS[fi] + "aa";
    sctx.font = 'bold 11px "DM Mono", monospace'; sctx.textAlign = "left";
    sctx.fillText(FIELD_KEYS[fi], cx0 + 32, fy + 6);
    sctx.fillStyle = isHi ? "rgba(16,16,16,0.85)" : "rgba(16,16,16,0.58)";
    sctx.font = 'bold 11px "DM Mono", monospace'; sctx.textAlign = "right";
    sctx.fillText(values[fi], cx0 + cardW - 20, fy + 6);
    const bW = 36, bX = cx0 + cardW - 20 - bW;
    sctx.fillStyle = FIELD_COLORS[fi] + "20"; sctx.fillRect(bX, fy + 12, bW, 3);
    sctx.fillStyle = FIELD_COLORS[fi] + "68"; sctx.fillRect(bX, fy + 12, bW * FIELD_BARS[fi], 3);
  }
  sctx.restore();
  sctx.restore();
}
