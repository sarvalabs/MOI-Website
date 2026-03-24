import {
  ALICE_COLOR, BOB_COLOR, BLOB_R, CARD_W, CARD_H, CARD_R,
  FIELD_COLORS, FIELD_KEYS, FIELD_BARS, ALICE_VALS, BOB_VALS,
  ALICE_APPS, BOB_APPS,
} from "./constants.js";
import { smoothstep } from "./timing.js";

export function drawContextObject(sctx, state, timeline, { cx, cy, W, H, mapRef }) {
  const { p, tessAlpha } = timeline;
  if (tessAlpha <= 0.01) return;

  sctx.save();
  sctx.globalAlpha = tessAlpha;
  const ease = tessAlpha * tessAlpha;
  const maxR = Math.sqrt(W * W + H * H);
  const circleR = ease * maxR;

  // Soft crossfade wipe
  const wipeX = cx;
  const wipeY = cy;
  sctx.fillStyle = "#F5F3EE";
  if (circleR < maxR * 0.8) {
    const wipeGrad = sctx.createRadialGradient(wipeX, wipeY, circleR * 0.7, wipeX, wipeY, circleR);
    wipeGrad.addColorStop(0, "#F5F3EE");
    wipeGrad.addColorStop(1, "rgba(245,243,238,0)");
    sctx.fillStyle = wipeGrad;
  }
  sctx.beginPath();
  sctx.arc(wipeX, wipeY, circleR, 0, Math.PI * 2);
  sctx.fill();

  // ctxP spans the full context object scroll range (p=0.46→1.00)
  const ctxP = Math.max(0, Math.min(1, (p - 0.46) / 0.54));
  const ctxIllusAlpha = Math.min(1, tessAlpha * 1.58 + 0.2);

  const p2Start = 0.28, p2Full = 0.38;
  const p3Start = 0.48, p3Full = 0.62;

  const blobR = BLOB_R;
  const cardW = CARD_W, cardH = CARD_H, cardR = CARD_R;

  // ── Drawing helpers ──

  function drawBlob(x, y, color, name, rad, alpha, t, showRing) {
    if (alpha <= 0.01) return;
    sctx.save();
    sctx.globalAlpha = ctxIllusAlpha * alpha;

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

  function drawAppDot(x, y, color, name, rad, alpha) {
    if (alpha <= 0.01) return;
    sctx.save();
    sctx.globalAlpha = ctxIllusAlpha * alpha;
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

  function drawCard(x, y, color, name, hash, values, alpha, highlightIdx) {
    if (alpha <= 0.01) return;
    sctx.save();
    sctx.globalAlpha = ctxIllusAlpha * alpha;

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

  // ── Computed transitions ──

  const collapseT = Math.max(0, Math.min(1, (ctxP - p2Start) / (p2Full - p2Start)));
  const collapseEase = smoothstep(collapseT);
  const zoomT = Math.max(0, Math.min(1, (ctxP - p3Start) / (p3Full - p3Start)));
  const zoomEase = smoothstep(zoomT);
  const cardAlpha = 1 - collapseEase;
  const blobAlpha = collapseEase;
  const bobEntry = Math.max(0, Math.min(1, (ctxP - p2Start) / 0.08));
  const bobEase = smoothstep(bobEntry);
  const preZoomAlpha = 1 - zoomEase;

  const spacing = 220;
  const vSpacing = 200;
  const aliceX = bobEntry > 0 ? cx - spacing * bobEase : cx;
  const aliceY = bobEntry > 0 ? cy - vSpacing * 0.5 * bobEase : cy;
  const bobX = cx + spacing * bobEase;
  const bobY = bobEntry > 0 ? cy - vSpacing * 0.5 * bobEase : cy;

  // Mark & Sally enter after Bob
  const MARK_COLOR = "#C47A2D";
  const SALLY_COLOR = "#2D7EC4";
  const MARK_APPS = [];
  const SALLY_APPS = [];
  const pairEntry = Math.max(0, Math.min(1, (ctxP - 0.40) / 0.06));
  const pairEase = smoothstep(pairEntry);
  const markX = cx - spacing * pairEase;
  const markY = cy + vSpacing * 0.5 * pairEase;
  const sallyX = cx + spacing * pairEase;
  const sallyY = cy + vSpacing * 0.5 * pairEase;

  // ── Sub-phase 1: Detailed card + app orbits ──
  if (tessAlpha > 0.054 && cardAlpha > 0.01 && preZoomAlpha > 0.01) {
    const orbitR = 230;
    const ca = cardAlpha * preZoomAlpha;
    const orbitSpin = state.time * 0.001;

    sctx.globalAlpha = ctxIllusAlpha * ca * 0.22;
    sctx.strokeStyle = ALICE_COLOR;
    sctx.lineWidth = 1.2;
    sctx.beginPath();
    sctx.arc(aliceX, aliceY, orbitR, 0, Math.PI * 2);
    sctx.stroke();

    const cycleDur = 4;
    const cycleTime = ((state.time * 0.016) % (cycleDur * ALICE_APPS.length));
    const activeIdx = Math.floor(cycleTime / cycleDur);
    const phaseFrac = (cycleTime % cycleDur) / cycleDur;
    const extending = phaseFrac < 0.2, holding = phaseFrac >= 0.2 && phaseFrac < 0.6, retracting = phaseFrac >= 0.6 && phaseFrac < 0.8;
    let reach = 0;
    if (extending) reach = phaseFrac / 0.2; else if (holding) reach = 1; else if (retracting) reach = 1 - (phaseFrac - 0.6) / 0.2;
    let highlightIdx = reach > 0.5 ? ALICE_APPS[activeIdx].fieldIdx : -1;

    for (let ai = 0; ai < ALICE_APPS.length; ai++) {
      const angle = (ai / ALICE_APPS.length) * Math.PI * 2 - Math.PI / 2 + orbitSpin;
      const ax = aliceX + Math.cos(angle) * orbitR;
      const ay = aliceY + Math.sin(angle) * orbitR;
      drawAppDot(ax, ay, ALICE_APPS[ai].color, ALICE_APPS[ai].name, 20, ca);

      if (ai === activeIdx && reach > 0) {
        const dx = aliceX - ax, dy = aliceY - ay;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist, ny = dy / dist;
        const startX = ax + nx * 22;
        const startY = ay + ny * 22;
        const cardEdgeDist = Math.min(cardW / 2 + 4, cardH / 2 + 4);
        const endX = aliceX - nx * cardEdgeDist;
        const endY = aliceY - ny * cardEdgeDist;
        const tipX = startX + (endX - startX) * reach;
        const tipY = startY + (endY - startY) * reach;

        sctx.globalAlpha = ctxIllusAlpha * ca * 0.6;
        sctx.strokeStyle = ALICE_APPS[ai].color + "aa";
        sctx.lineWidth = 1.5;
        sctx.setLineDash([3, 3]);
        sctx.beginPath(); sctx.moveTo(startX, startY); sctx.lineTo(tipX, tipY); sctx.stroke();
        sctx.setLineDash([]);

        const pp = (state.time * 0.008) % 1 * reach;
        const px = startX + (endX - startX) * pp;
        const py = startY + (endY - startY) * pp;
        sctx.globalAlpha = ctxIllusAlpha * ca * 0.75;
        sctx.fillStyle = ALICE_APPS[ai].color;
        sctx.beginPath(); sctx.arc(px, py, 2.5, 0, Math.PI * 2); sctx.fill();

        if (holding) {
          const mx = (startX + endX) / 2;
          const my = (startY + endY) / 2 - 10;
          sctx.globalAlpha = ctxIllusAlpha * ca * 0.7;
          sctx.fillStyle = ALICE_APPS[ai].color;
          sctx.font = 'bold 8px "DM Mono", monospace';
          sctx.textAlign = "center";
          sctx.fillText(ALICE_APPS[ai].name + " \u2192 " + ALICE_APPS[ai].field, mx, my);
        }
      }
    }

    drawCard(aliceX, aliceY, ALICE_COLOR, "Alice", "0x8b6c...f2", ALICE_VALS, ca, highlightIdx);
  }

  // ── Sub-phase 2: Collapsed blobs + app dots ──
  if (blobAlpha > 0.01 && preZoomAlpha > 0.01) {
    const ba = blobAlpha * preZoomAlpha;
    const appOrbit = blobR + 60;
    const appDotR = 16;

    drawBlob(aliceX, aliceY, ALICE_COLOR, "Alice", blobR, ba, state.time, true);
    sctx.globalAlpha = ctxIllusAlpha * ba * 0.55;
    sctx.fillStyle = ALICE_COLOR;
    sctx.font = '8px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText("context superstate", aliceX, aliceY + blobR + 18);

    sctx.globalAlpha = ctxIllusAlpha * ba * 0.1;
    sctx.strokeStyle = ALICE_COLOR;
    sctx.lineWidth = 0.8;
    sctx.beginPath(); sctx.arc(aliceX, aliceY, appOrbit, 0, Math.PI * 2); sctx.stroke();

    for (let ai = 0; ai < ALICE_APPS.length; ai++) {
      const angle = (ai / ALICE_APPS.length) * Math.PI * 2 - Math.PI / 2;
      const ax = aliceX + Math.cos(angle) * appOrbit;
      const ay = aliceY + Math.sin(angle) * appOrbit;
      drawAppDot(ax, ay, ALICE_APPS[ai].color, ALICE_APPS[ai].name, appDotR, ba * 0.9);
      const nx = Math.cos(angle), ny = Math.sin(angle);
      sctx.globalAlpha = ctxIllusAlpha * ba * 0.25;
      sctx.strokeStyle = ALICE_APPS[ai].color;
      sctx.lineWidth = 1;
      sctx.setLineDash([2, 3]);
      sctx.beginPath();
      sctx.moveTo(aliceX + nx * (blobR + 8), aliceY + ny * (blobR + 8));
      sctx.lineTo(ax - nx * (appDotR + 2), ay - ny * (appDotR + 2));
      sctx.stroke();
      sctx.setLineDash([]);
    }

    if (bobEntry > 0.01) {
      const bobRad = blobR * bobEase;
      drawBlob(bobX, bobY, BOB_COLOR, "Bob", bobRad, ba * bobEase, state.time, bobEase > 0.7);
      if (bobEase > 0.6) {
        sctx.globalAlpha = ctxIllusAlpha * ba * bobEase * 0.55;
        sctx.fillStyle = BOB_COLOR;
        sctx.font = '8px "DM Mono", monospace';
        sctx.textAlign = "center";
        sctx.fillText("context superstate", bobX, bobY + bobRad + 18);
      }

      if (bobEase > 0.3) {
        const a2 = Math.max(0, (bobEase - 0.3) / 0.7);
        const bobAppOrbit = bobRad + 60;
        sctx.globalAlpha = ctxIllusAlpha * ba * a2 * 0.1;
        sctx.strokeStyle = BOB_COLOR;
        sctx.lineWidth = 0.8;
        sctx.beginPath(); sctx.arc(bobX, bobY, bobAppOrbit, 0, Math.PI * 2); sctx.stroke();

        for (let ai = 0; ai < BOB_APPS.length; ai++) {
          const angle = (ai / BOB_APPS.length) * Math.PI * 2 - Math.PI / 2;
          const ax = bobX + Math.cos(angle) * bobAppOrbit;
          const ay = bobY + Math.sin(angle) * bobAppOrbit;
          drawAppDot(ax, ay, BOB_APPS[ai].color, BOB_APPS[ai].name, appDotR, ba * a2 * 0.9);
          const nx = Math.cos(angle), ny = Math.sin(angle);
          sctx.globalAlpha = ctxIllusAlpha * ba * a2 * 0.25;
          sctx.strokeStyle = BOB_APPS[ai].color;
          sctx.lineWidth = 1;
          sctx.setLineDash([2, 3]);
          sctx.beginPath();
          sctx.moveTo(bobX + nx * (bobRad + 8), bobY + ny * (bobRad + 8));
          sctx.lineTo(ax - nx * (appDotR + 2), ay - ny * (appDotR + 2));
          sctx.stroke();
          sctx.setLineDash([]);
        }
      }

      if (bobEase > 0.5) {
        const interAlpha2 = Math.min(1, (bobEase - 0.5) / 0.3);
        const aEdge = aliceX + blobR + 8;
        const bEdge = bobX - blobR * bobEase - 8;
        const arcMx = (aEdge + bEdge) / 2;
        const arcMy = aliceY - 28;

        const arcGrad = sctx.createLinearGradient(aEdge, aliceY, bEdge, bobY);
        arcGrad.addColorStop(0, ALICE_COLOR);
        arcGrad.addColorStop(1, BOB_COLOR);
        sctx.globalAlpha = ctxIllusAlpha * ba * interAlpha2 * 0.55;
        sctx.strokeStyle = arcGrad;
        sctx.lineWidth = 2;
        sctx.beginPath();
        sctx.moveTo(aEdge, aliceY);
        sctx.quadraticCurveTo(arcMx, arcMy, bEdge, bobY);
        sctx.stroke();

        for (let di = 0; di < 2; di++) {
          const dt = ((state.time * 0.004 + di * 0.5) % 1);
          const bx = (1 - dt) * (1 - dt) * aEdge + 2 * (1 - dt) * dt * arcMx + dt * dt * bEdge;
          const by = (1 - dt) * (1 - dt) * aliceY + 2 * (1 - dt) * dt * arcMy + dt * dt * bobY;
          sctx.globalAlpha = ctxIllusAlpha * ba * interAlpha2 * 0.7;
          sctx.fillStyle = "#7B5EA7";
          sctx.beginPath(); sctx.arc(bx, by, 3, 0, Math.PI * 2); sctx.fill();
        }

        sctx.globalAlpha = ctxIllusAlpha * ba * interAlpha2 * 0.65;
        sctx.fillStyle = "#5c3d7a";
        sctx.font = 'bold 9px "DM Mono", monospace';
        sctx.textAlign = "center";
        sctx.fillText("transfer 50 MOI", arcMx, arcMy - 8);
      }
    }

    // Mark & Sally — appear below Alice & Bob
    if (pairEntry > 0.01) {
      const pa = ba * pairEase;
      const markRad = blobR * pairEase;
      const sallyRad = blobR * pairEase;
      const appOrbit2 = markRad + 60;
      const appDotR2 = 16;

      // Mark blob + apps
      drawBlob(markX, markY, MARK_COLOR, "Mark", markRad, pa, state.time, pairEase > 0.7);
      if (pairEase > 0.6) {
        sctx.globalAlpha = ctxIllusAlpha * pa * 0.55;
        sctx.fillStyle = MARK_COLOR;
        sctx.font = '8px "DM Mono", monospace';
        sctx.textAlign = "center";
        sctx.fillText("context superstate", markX, markY + markRad + 18);
      }
      if (pairEase > 0.4) {
        const ma = Math.max(0, (pairEase - 0.4) / 0.6);
        sctx.globalAlpha = ctxIllusAlpha * pa * ma * 0.1;
        sctx.strokeStyle = MARK_COLOR;
        sctx.lineWidth = 0.8;
        sctx.beginPath(); sctx.arc(markX, markY, appOrbit2, 0, Math.PI * 2); sctx.stroke();
        for (let ai = 0; ai < MARK_APPS.length; ai++) {
          const angle = (ai / MARK_APPS.length) * Math.PI * 2 - Math.PI / 2;
          const ax = markX + Math.cos(angle) * appOrbit2;
          const ay = markY + Math.sin(angle) * appOrbit2;
          drawAppDot(ax, ay, MARK_APPS[ai].color, MARK_APPS[ai].name, appDotR2, pa * ma * 0.9);
          const nx = Math.cos(angle), ny = Math.sin(angle);
          sctx.globalAlpha = ctxIllusAlpha * pa * ma * 0.25;
          sctx.strokeStyle = MARK_APPS[ai].color;
          sctx.lineWidth = 1;
          sctx.setLineDash([2, 3]);
          sctx.beginPath();
          sctx.moveTo(markX + nx * (markRad + 8), markY + ny * (markRad + 8));
          sctx.lineTo(ax - nx * (appDotR2 + 2), ay - ny * (appDotR2 + 2));
          sctx.stroke();
          sctx.setLineDash([]);
        }
      }

      // Sally blob + apps
      drawBlob(sallyX, sallyY, SALLY_COLOR, "Sally", sallyRad, pa, state.time, pairEase > 0.7);
      if (pairEase > 0.6) {
        sctx.globalAlpha = ctxIllusAlpha * pa * 0.55;
        sctx.fillStyle = SALLY_COLOR;
        sctx.font = '8px "DM Mono", monospace';
        sctx.textAlign = "center";
        sctx.fillText("context superstate", sallyX, sallyY + sallyRad + 18);
      }
      if (pairEase > 0.4) {
        const sa2 = Math.max(0, (pairEase - 0.4) / 0.6);
        sctx.globalAlpha = ctxIllusAlpha * pa * sa2 * 0.1;
        sctx.strokeStyle = SALLY_COLOR;
        sctx.lineWidth = 0.8;
        sctx.beginPath(); sctx.arc(sallyX, sallyY, sallyRad + 60, 0, Math.PI * 2); sctx.stroke();
        for (let ai = 0; ai < SALLY_APPS.length; ai++) {
          const angle = (ai / SALLY_APPS.length) * Math.PI * 2 - Math.PI / 2;
          const ax = sallyX + Math.cos(angle) * (sallyRad + 60);
          const ay = sallyY + Math.sin(angle) * (sallyRad + 60);
          drawAppDot(ax, ay, SALLY_APPS[ai].color, SALLY_APPS[ai].name, appDotR2, pa * sa2 * 0.9);
          const nx = Math.cos(angle), ny = Math.sin(angle);
          sctx.globalAlpha = ctxIllusAlpha * pa * sa2 * 0.25;
          sctx.strokeStyle = SALLY_APPS[ai].color;
          sctx.lineWidth = 1;
          sctx.setLineDash([2, 3]);
          sctx.beginPath();
          sctx.moveTo(sallyX + nx * (sallyRad + 8), sallyY + ny * (sallyRad + 8));
          sctx.lineTo(ax - nx * (appDotR2 + 2), ay - ny * (appDotR2 + 2));
          sctx.stroke();
          sctx.setLineDash([]);
        }
      }

      // Alice → DEX → Mark chain
      if (pairEase > 0.6) {
        const dexAlpha = Math.min(1, (pairEase - 0.6) / 0.3);
        const dexColor = "#3A9F7E";
        const dexR = 18;

        // DEX node sits midway between Alice and Mark
        const dexX = (aliceX + markX) / 2;
        const dexY = (aliceY + blobR + 8 + markY - markRad - 8) / 2;

        // Alice edge → DEX
        const aBot = { x: aliceX, y: aliceY + blobR + 8 };
        // Mark edge → DEX
        const mTop = { x: markX, y: markY - markRad - 8 };

        // Dashed line: Alice → DEX
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * 0.35;
        sctx.strokeStyle = ALICE_COLOR;
        sctx.lineWidth = 1.5;
        sctx.setLineDash([4, 4]);
        sctx.beginPath();
        sctx.moveTo(aBot.x, aBot.y);
        sctx.lineTo(dexX, dexY - dexR - 2);
        sctx.stroke();

        // Dashed line: DEX → Mark
        sctx.strokeStyle = MARK_COLOR;
        sctx.beginPath();
        sctx.moveTo(dexX, dexY + dexR + 2);
        sctx.lineTo(mTop.x, mTop.y);
        sctx.stroke();
        sctx.setLineDash([]);

        // DEX icon node
        drawAppDot(dexX, dexY, dexColor, "DEX", dexR, ba * dexAlpha);

        // Traveling dot: Alice → DEX
        const dt1 = ((state.time * 0.006) % 1);
        const d1x = aBot.x + (dexX - aBot.x) * dt1;
        const d1y = aBot.y + (dexY - dexR - 2 - aBot.y) * dt1;
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * Math.sin(dt1 * Math.PI) * 0.7;
        sctx.fillStyle = ALICE_COLOR;
        sctx.beginPath(); sctx.arc(d1x, d1y, 2.5, 0, Math.PI * 2); sctx.fill();

        // Traveling dot: DEX → Mark
        const dt2 = ((state.time * 0.006 + 0.5) % 1);
        const d2x = dexX + (mTop.x - dexX) * dt2;
        const d2y = (dexY + dexR + 2) + (mTop.y - dexY - dexR - 2) * dt2;
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * Math.sin(dt2 * Math.PI) * 0.7;
        sctx.fillStyle = MARK_COLOR;
        sctx.beginPath(); sctx.arc(d2x, d2y, 2.5, 0, Math.PI * 2); sctx.fill();

        // Label
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * 0.5;
        sctx.fillStyle = dexColor;
        sctx.font = 'bold 8px "DM Mono", monospace';
        sctx.textAlign = "left";
        sctx.fillText("swap", dexX + dexR + 6, dexY + 3);

        // Bob → DAO → Sally chain
        const daoColor = "#D45A6A";
        const daoR = 18;

        const daoX = (bobX + sallyX) / 2;
        const daoY = (bobY + blobR + 8 + sallyY - sallyRad - 8) / 2;

        const bBot = { x: bobX, y: bobY + blobR + 8 };
        const sTop = { x: sallyX, y: sallyY - sallyRad - 8 };

        // Dashed line: Bob → DAO
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * 0.35;
        sctx.strokeStyle = BOB_COLOR;
        sctx.lineWidth = 1.5;
        sctx.setLineDash([4, 4]);
        sctx.beginPath();
        sctx.moveTo(bBot.x, bBot.y);
        sctx.lineTo(daoX, daoY - daoR - 2);
        sctx.stroke();

        // Dashed line: DAO → Sally
        sctx.strokeStyle = SALLY_COLOR;
        sctx.beginPath();
        sctx.moveTo(daoX, daoY + daoR + 2);
        sctx.lineTo(sTop.x, sTop.y);
        sctx.stroke();
        sctx.setLineDash([]);

        // DAO icon node
        drawAppDot(daoX, daoY, daoColor, "DAO", daoR, ba * dexAlpha);

        // Traveling dot: Bob → DAO
        const dt3 = ((state.time * 0.005) % 1);
        const d3x = bBot.x + (daoX - bBot.x) * dt3;
        const d3y = bBot.y + (daoY - daoR - 2 - bBot.y) * dt3;
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * Math.sin(dt3 * Math.PI) * 0.7;
        sctx.fillStyle = BOB_COLOR;
        sctx.beginPath(); sctx.arc(d3x, d3y, 2.5, 0, Math.PI * 2); sctx.fill();

        // Traveling dot: DAO → Sally
        const dt4 = ((state.time * 0.005 + 0.5) % 1);
        const d4x = daoX + (sTop.x - daoX) * dt4;
        const d4y = (daoY + daoR + 2) + (sTop.y - daoY - daoR - 2) * dt4;
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * Math.sin(dt4 * Math.PI) * 0.7;
        sctx.fillStyle = SALLY_COLOR;
        sctx.beginPath(); sctx.arc(d4x, d4y, 2.5, 0, Math.PI * 2); sctx.fill();

        // Label
        sctx.globalAlpha = ctxIllusAlpha * ba * dexAlpha * 0.5;
        sctx.fillStyle = daoColor;
        sctx.font = 'bold 8px "DM Mono", monospace';
        sctx.textAlign = "right";
        sctx.fillText("vote", daoX - daoR - 6, daoY + 3);
      }
    }
  }

  // ── Sub-phase 3: Spaced solar-system network ──
  if (zoomT > 0.01) {
    const MAP_LAYOUT_VERSION = 6;
    if (!mapRef.current || mapRef.current.W !== W || mapRef.current.H !== H || mapRef.current.version !== MAP_LAYOUT_VERSION) {
      let seed = 7;
      function srand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }

      const pColors = [
        "#A8BFD0", "#D0BFA8", "#B8A8C8", "#A8D0BF", "#C8B8A8",
        "#A8C0D0", "#D0A8A8", "#A8D0C0", "#C0B8A8", "#B0A8D0",
        "#B8D0A8", "#D0A8B8", "#A8B0D0", "#C8BFA8", "#A8C8D0",
        "#C0A8B8", "#B8C8A8", "#D0B8C0",
      ];
      const aColors = ["#90C4B0", "#D0BFA0", "#A0A8D0", "#C0A0B0", "#A0D0B8", "#C8B0A0", "#A0B8C8"];
      const names = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

      const baseR = Math.max(W, H) * 0.55;
      const bands = [
        { r: baseR * 0.24, count: 7,  sunRad: 13, appMax: 3, orbitExtra: 18 },
        { r: baseR * 0.40, count: 10, sunRad: 11, appMax: 3, orbitExtra: 16 },
        { r: baseR * 0.58, count: 14, sunRad: 10, appMax: 2, orbitExtra: 14 },
        { r: baseR * 0.78, count: 18, sunRad: 8,  appMax: 2, orbitExtra: 12 },
        { r: baseR * 0.95, count: 20, sunRad: 7,  appMax: 2, orbitExtra: 10 },
      ];

      const systems = [];
      let colorIdx = 0;
      let nameIdx = 0;
      for (let bIdx = 0; bIdx < bands.length; bIdx++) {
        const band = bands[bIdx];
        const jitter = band.r * 0.09;
        const bandOffset = srand() * Math.PI * 2;
        for (let bi = 0; bi < band.count; bi++) {
          const progress = bi / band.count;
          const baseAngle = progress * Math.PI * 2 + bIdx * 0.42 + bandOffset;
          const angle = baseAngle + (srand() - 0.5) * 0.2;
          const r = band.r + (srand() - 0.5) * jitter;
          const nApps = 1 + Math.floor(srand() * band.appMax);
          systems.push({
            x: cx + Math.cos(angle) * r * 1.2,
            y: cy + Math.sin(angle) * r * 0.74,
            color: pColors[colorIdx % pColors.length],
            name: names[nameIdx % names.length],
            rad: band.sunRad + srand() * 3,
            dist: r,
            phase: srand() * Math.PI * 2,
            appCount: nApps,
            orbitBase: band.sunRad + band.orbitExtra + srand() * 5,
          });
          colorIdx++;
          nameIdx++;
        }
      }

      const sysApps = [];
      for (let si = 0; si < systems.length; si++) {
        const s = systems[si];
        const apps = [];
        for (let ai = 0; ai < s.appCount; ai++) {
          const orbitR = s.orbitBase + ai * (8 + srand() * 6);
          apps.push({
            orbitR,
            startAngle: srand() * Math.PI * 2,
            speed: 0.0005 + srand() * 0.0008,
            color: aColors[(si * 3 + ai) % aColors.length],
            rad: 2.5 + srand() * 2,
          });
        }
        sysApps.push(apps);
      }

      const links = [];
      const linkSet = new Set();
      for (let si = 0; si < systems.length; si++) {
        const nearest = [];
        for (let sj = 0; sj < systems.length; sj++) {
          if (si === sj) continue;
          const dx = systems[si].x - systems[sj].x;
          const dy = systems[si].y - systems[sj].y;
          nearest.push({ idx: sj, d: Math.sqrt(dx * dx + dy * dy) });
        }
        nearest.sort((a, b) => a.d - b.d);
        const cnt = 1 + (srand() > 0.55 ? 1 : 0);
        for (let k = 0; k < cnt && k < nearest.length; k++) {
          if (nearest[k].d > 300) break;
          const key = Math.min(si, nearest[k].idx) + ":" + Math.max(si, nearest[k].idx);
          if (!linkSet.has(key)) { linkSet.add(key); links.push({ a: si, b: nearest[k].idx, phase: srand() * Math.PI * 2 }); }
        }
      }

      const centerLinks = [];
      const taken = new Set();
      const nearestAlice = [];
      const nearestBob = [];
      for (let si = 0; si < systems.length; si++) {
        const s = systems[si];
        nearestAlice.push({ idx: si, d: Math.hypot(s.x - aliceX, s.y - aliceY) });
        nearestBob.push({ idx: si, d: Math.hypot(s.x - bobX, s.y - bobY) });
      }
      nearestAlice.sort((a, b) => a.d - b.d);
      nearestBob.sort((a, b) => a.d - b.d);
      for (let i = 0; i < nearestAlice.length && centerLinks.length < 3; i++) {
        const n = nearestAlice[i];
        if (n.d > baseR * 0.55 || taken.has(n.idx)) continue;
        taken.add(n.idx);
        centerLinks.push({ idx: n.idx, target: "alice", dist: n.d, phase: srand() * Math.PI * 2 });
      }
      for (let i = 0; i < nearestBob.length && centerLinks.length < 6; i++) {
        const n = nearestBob[i];
        if (n.d > baseR * 0.55 || taken.has(n.idx)) continue;
        taken.add(n.idx);
        centerLinks.push({ idx: n.idx, target: "bob", dist: n.d, phase: srand() * Math.PI * 2 });
      }

      mapRef.current = { version: MAP_LAYOUT_VERSION, W, H, systems, sysApps, links, centerLinks, baseR };
    }

    const { systems, sysApps, links, centerLinks = [], baseR } = mapRef.current;
    const ze = zoomEase;
    const p3Spin = state.time * 0.0012;

    for (const lk of links) {
      const sa = systems[lk.a], sb = systems[lk.b];
      const maxD = Math.max(sa.dist, sb.dist);
      const lkDelay = (maxD / baseR) * 0.35;
      const lkAlpha = Math.max(0, Math.min(1, (ze - lkDelay) / 0.25));
      if (lkAlpha <= 0) continue;

      const grad = sctx.createLinearGradient(sa.x, sa.y, sb.x, sb.y);
      grad.addColorStop(0, sa.color + "18");
      grad.addColorStop(0.5, "#7B5EA712");
      grad.addColorStop(1, sb.color + "18");
      sctx.globalAlpha = ctxIllusAlpha * lkAlpha * 0.14;
      sctx.strokeStyle = grad;
      sctx.lineWidth = 0.6;
      sctx.beginPath(); sctx.moveTo(sa.x, sa.y); sctx.lineTo(sb.x, sb.y); sctx.stroke();

      const dotT = (state.time * 0.0015 + lk.phase) % 1;
      sctx.globalAlpha = ctxIllusAlpha * lkAlpha * Math.sin(dotT * Math.PI) * 0.18;
      sctx.fillStyle = "#8B7BA3";
      sctx.beginPath(); sctx.arc(sa.x + (sb.x - sa.x) * dotT, sa.y + (sb.y - sa.y) * dotT, 1.6, 0, Math.PI * 2); sctx.fill();
    }

    for (let si = 0; si < systems.length; si++) {
      const s = systems[si];
      const nodeDelay = (s.dist / baseR) * 0.35;
      const nodeAlpha = Math.max(0, Math.min(1, (ze - nodeDelay) / 0.2));
      if (nodeAlpha <= 0) continue;

      const apps = sysApps[si];
      for (let ai = 0; ai < apps.length; ai++) {
        sctx.globalAlpha = ctxIllusAlpha * nodeAlpha * 0.10;
        sctx.strokeStyle = s.color;
        sctx.lineWidth = 0.6;
        sctx.beginPath(); sctx.arc(s.x, s.y, apps[ai].orbitR, 0, Math.PI * 2); sctx.stroke();
      }
      for (let ai = 0; ai < apps.length; ai++) {
        const a = apps[ai];
        const angle = a.startAngle + state.time * a.speed;
        const ax = s.x + Math.cos(angle) * a.orbitR;
        const ay = s.y + Math.sin(angle) * a.orbitR;
        sctx.save();
        sctx.globalAlpha = ctxIllusAlpha * nodeAlpha * 0.45;
        sctx.fillStyle = a.color;
        sctx.beginPath(); sctx.arc(ax, ay, a.rad, 0, Math.PI * 2); sctx.fill();
        sctx.globalAlpha = ctxIllusAlpha * nodeAlpha * 0.15;
        sctx.strokeStyle = a.color;
        sctx.lineWidth = 0.5;
        sctx.beginPath(); sctx.arc(ax, ay, a.rad + 1.5, 0, Math.PI * 2); sctx.stroke();
        sctx.restore();
      }
      drawBlob(s.x, s.y, s.color, "", s.rad, nodeAlpha * 0.55, state.time, false);
    }

    for (const cl of centerLinks) {
      const s = systems[cl.idx];
      const lkDelay = (cl.dist / baseR) * 0.2;
      const lkAlpha = Math.max(0, Math.min(1, (ze - lkDelay) / 0.24));
      if (lkAlpha <= 0) continue;
      const target = cl.target === "alice"
        ? { x: aliceX, y: aliceY, color: ALICE_COLOR }
        : { x: bobX, y: bobY, color: BOB_COLOR };
      const grad = sctx.createLinearGradient(target.x, target.y, s.x, s.y);
      grad.addColorStop(0, target.color + "20");
      grad.addColorStop(1, s.color + "18");
      sctx.globalAlpha = ctxIllusAlpha * lkAlpha * 0.3;
      sctx.strokeStyle = grad;
      sctx.lineWidth = 1;
      sctx.beginPath(); sctx.moveTo(target.x, target.y); sctx.lineTo(s.x, s.y); sctx.stroke();

      const dotT = (state.time * 0.0016 + cl.phase) % 1;
      sctx.globalAlpha = ctxIllusAlpha * lkAlpha * Math.sin(dotT * Math.PI) * 0.28;
      sctx.fillStyle = target.color;
      sctx.beginPath();
      sctx.arc(target.x + (s.x - target.x) * dotT, target.y + (s.y - target.y) * dotT, 1.4, 0, Math.PI * 2);
      sctx.fill();
    }

    drawBlob(aliceX, aliceY, ALICE_COLOR, "Alice", blobR, ze, state.time, true);

    const p3AppOrbit = blobR + 60;
    const p3AppDotR = 16;
    sctx.globalAlpha = ctxIllusAlpha * ze * 0.1;
    sctx.strokeStyle = ALICE_COLOR;
    sctx.lineWidth = 0.8;
    sctx.beginPath(); sctx.arc(aliceX, aliceY, p3AppOrbit, 0, Math.PI * 2); sctx.stroke();

    for (let ai = 0; ai < ALICE_APPS.length; ai++) {
      const angle = (ai / ALICE_APPS.length) * Math.PI * 2 - Math.PI / 2 + p3Spin;
      const ax = aliceX + Math.cos(angle) * p3AppOrbit;
      const ay = aliceY + Math.sin(angle) * p3AppOrbit;
      drawAppDot(ax, ay, ALICE_APPS[ai].color, ALICE_APPS[ai].name, p3AppDotR, ze * 0.9);
      const nx = Math.cos(angle), ny = Math.sin(angle);
      sctx.globalAlpha = ctxIllusAlpha * ze * 0.25;
      sctx.strokeStyle = ALICE_APPS[ai].color;
      sctx.lineWidth = 1;
      sctx.setLineDash([2, 3]);
      sctx.beginPath();
      sctx.moveTo(aliceX + nx * (blobR + 8), aliceY + ny * (blobR + 8));
      sctx.lineTo(ax - nx * (p3AppDotR + 2), ay - ny * (p3AppDotR + 2));
      sctx.stroke();
      sctx.setLineDash([]);
    }

    drawBlob(bobX, bobY, BOB_COLOR, "Bob", blobR, ze, state.time, true);

    sctx.globalAlpha = ctxIllusAlpha * ze * 0.1;
    sctx.strokeStyle = BOB_COLOR;
    sctx.lineWidth = 0.8;
    sctx.beginPath(); sctx.arc(bobX, bobY, blobR + 60, 0, Math.PI * 2); sctx.stroke();

    for (let ai = 0; ai < BOB_APPS.length; ai++) {
      const angle = (ai / BOB_APPS.length) * Math.PI * 2 - Math.PI / 2 + p3Spin * 0.85;
      const ax = bobX + Math.cos(angle) * (blobR + 60);
      const ay = bobY + Math.sin(angle) * (blobR + 60);
      drawAppDot(ax, ay, BOB_APPS[ai].color, BOB_APPS[ai].name, p3AppDotR, ze * 0.9);
      const nx = Math.cos(angle), ny = Math.sin(angle);
      sctx.globalAlpha = ctxIllusAlpha * ze * 0.25;
      sctx.strokeStyle = BOB_APPS[ai].color;
      sctx.lineWidth = 1;
      sctx.setLineDash([2, 3]);
      sctx.beginPath();
      sctx.moveTo(bobX + nx * (blobR + 8), bobY + ny * (blobR + 8));
      sctx.lineTo(ax - nx * (p3AppDotR + 2), ay - ny * (p3AppDotR + 2));
      sctx.stroke();
      sctx.setLineDash([]);
    }

    if (ze > 0.1) {
      const interAlpha3 = Math.min(1, (ze - 0.1) / 0.3);
      const aEdge = aliceX + blobR + 8;
      const bEdge = bobX - blobR - 8;
      const arcMx = (aEdge + bEdge) / 2;
      const arcMy = aliceY - 28;
      const arcGrad = sctx.createLinearGradient(aEdge, aliceY, bEdge, bobY);
      arcGrad.addColorStop(0, ALICE_COLOR);
      arcGrad.addColorStop(1, BOB_COLOR);
      sctx.globalAlpha = ctxIllusAlpha * ze * interAlpha3 * 0.55;
      sctx.strokeStyle = arcGrad;
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(aEdge, aliceY);
      sctx.quadraticCurveTo(arcMx, arcMy, bEdge, bobY);
      sctx.stroke();
      for (let di = 0; di < 2; di++) {
        const dt = ((state.time * 0.004 + di * 0.5) % 1);
        const bx = (1 - dt) * (1 - dt) * aEdge + 2 * (1 - dt) * dt * arcMx + dt * dt * bEdge;
        const by = (1 - dt) * (1 - dt) * aliceY + 2 * (1 - dt) * dt * arcMy + dt * dt * bobY;
        sctx.globalAlpha = ctxIllusAlpha * ze * interAlpha3 * 0.7;
        sctx.fillStyle = "#7B5EA7";
        sctx.beginPath(); sctx.arc(bx, by, 3, 0, Math.PI * 2); sctx.fill();
      }
      sctx.globalAlpha = ctxIllusAlpha * ze * interAlpha3 * 0.65;
      sctx.fillStyle = "#5c3d7a";
      sctx.font = 'bold 9px "DM Mono", monospace';
      sctx.textAlign = "center";
      sctx.fillText("transfer 50 MOI", arcMx, arcMy - 8);
    }

    const counterFade = Math.max(0, Math.min(1, (ze - 0.6) / 0.25));
    if (counterFade > 0) {
      sctx.globalAlpha = ctxIllusAlpha * counterFade * 0.25;
      sctx.fillStyle = "#7B6B8A";
      sctx.font = '8px "DM Mono", monospace';
      sctx.textAlign = "center";
      sctx.letterSpacing = "4px";
      const interactionCount = links.length + centerLinks.length + 1;
      sctx.fillText((systems.length + 2) + " PARTICIPANTS  \u00B7  " + interactionCount + " INTERACTIONS  \u00B7  ALL PARALLEL", cx, H - 50);
      sctx.letterSpacing = "0px";
    }
  }

  sctx.restore();
}
