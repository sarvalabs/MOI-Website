import { PARTICIPANTS, P_COUNT } from "./constants.js";

const INTERACTIONS = [
  { a: 0, b: 1, label: "swap" },
  { a: 1, b: 2, label: "stake" },
  { a: 2, b: 4, label: "mint" },
  { a: 0, b: 3, label: "lend" },
];

export function drawMDAGLanes(sctx, state, timeline, { cx, cy, W, H }) {
  const { laneAlpha, laneInterAlpha, laneParallel } = timeline;
  if (laneAlpha <= 0.01) return;

  sctx.save();
  sctx.globalAlpha = laneAlpha;

  const laneSpacing = Math.min(80, (H - 120) / P_COUNT);
  const lanesTop = cy - ((P_COUNT - 1) * laneSpacing) / 2;
  const laneLeft = cx - W * 0.32;
  const laneRight = cx + W * 0.32;
  const laneW = laneRight - laneLeft;

  // Participant lanes
  for (let i = 0; i < P_COUNT; i++) {
    const color = PARTICIPANTS[i].color;
    const ly = lanesTop + i * laneSpacing;

    // Lane line
    sctx.globalAlpha = laneAlpha * 0.12;
    sctx.strokeStyle = color;
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.moveTo(laneLeft, ly);
    sctx.lineTo(laneRight, ly);
    sctx.stroke();

    // Participant dot + name
    sctx.globalAlpha = laneAlpha * 0.85;
    sctx.fillStyle = color;
    sctx.beginPath();
    sctx.arc(laneLeft - 28, ly, 8, 0, Math.PI * 2);
    sctx.fill();

    sctx.globalAlpha = laneAlpha * 0.6;
    sctx.fillStyle = color;
    sctx.font = '9px "DM Mono", monospace';
    sctx.textAlign = "right";
    sctx.fillText(PARTICIPANTS[i].name, laneLeft - 44, ly + 3);

    // Per-lane block counter
    const speeds = [1.0, 0.7, 1.3, 0.9, 1.1];
    const blockNum = 1000 + i * 137 + Math.floor(state.time * 0.008 * speeds[i]) % 100;
    const blockX = laneRight + 16;
    const blockH = laneSpacing * 0.5;
    const blockW = 48;

    sctx.globalAlpha = laneAlpha * 0.5;
    sctx.fillStyle = "rgba(26,26,26,0.03)";
    sctx.strokeStyle = color + "30";
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.roundRect(blockX, ly - blockH / 2, blockW, blockH, 4);
    sctx.fill();
    sctx.stroke();
    sctx.fillStyle = "rgba(26,26,26,0.25)";
    sctx.font = '7px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText("#" + blockNum, blockX + blockW / 2, ly + 3);

    // Flowing dots along each lane
    const dotCount = 6;
    for (let d = 0; d < dotCount; d++) {
      const phase = ((state.time * 0.006 * speeds[i] + d / dotCount + i * 0.13) % 1);
      const dx = laneLeft + phase * laneW;
      const dy = ly + Math.sin(state.time * 0.015 + d * 2.1 + i) * 3;
      const dotAlpha = Math.sin(phase * Math.PI) * 0.7 + 0.3;
      sctx.globalAlpha = laneAlpha * dotAlpha * 0.65;
      sctx.fillStyle = color;
      sctx.beginPath();
      sctx.arc(dx, dy, 3, 0, Math.PI * 2);
      sctx.fill();
    }
  }

  // Interaction bridges between lanes
  if (laneInterAlpha > 0.01) {
    for (const inter of INTERACTIONS) {
      const ay = lanesTop + inter.a * laneSpacing;
      const by = lanesTop + inter.b * laneSpacing;
      const ix = laneLeft + laneW * (0.35 + INTERACTIONS.indexOf(inter) * 0.12);

      // Soft dashed bridge line
      sctx.globalAlpha = laneAlpha * laneInterAlpha * 0.2;
      sctx.strokeStyle = "rgba(123,94,167,0.6)";
      sctx.lineWidth = 1;
      sctx.setLineDash([3, 4]);
      sctx.beginPath();
      sctx.moveTo(ix, ay);
      sctx.lineTo(ix, by);
      sctx.stroke();
      sctx.setLineDash([]);

      // Connection dots at endpoints
      sctx.globalAlpha = laneAlpha * laneInterAlpha * 0.5;
      sctx.fillStyle = PARTICIPANTS[inter.a].color;
      sctx.beginPath();
      sctx.arc(ix, ay, 3, 0, Math.PI * 2);
      sctx.fill();
      sctx.fillStyle = PARTICIPANTS[inter.b].color;
      sctx.beginPath();
      sctx.arc(ix, by, 3, 0, Math.PI * 2);
      sctx.fill();

      // Traveling dot along bridge
      const bridgeT = ((state.time * 0.005 + inter.a * 0.3) % 1);
      const bdx = ix;
      const bdy = ay + (by - ay) * bridgeT;
      sctx.globalAlpha = laneAlpha * laneInterAlpha * Math.sin(bridgeT * Math.PI) * 0.6;
      sctx.fillStyle = "#7B5EA7";
      sctx.beginPath();
      sctx.arc(bdx, bdy, 2.5, 0, Math.PI * 2);
      sctx.fill();

      // Interaction label
      const midY = (ay + by) / 2;
      sctx.globalAlpha = laneAlpha * laneInterAlpha * 0.4;
      sctx.fillStyle = "rgba(123,94,167,0.8)";
      sctx.font = '7px "DM Mono", monospace';
      sctx.textAlign = "left";
      sctx.fillText(inter.label, ix + 6, midY + 3);
    }
  }

  // Parallel finalization counter
  if (laneParallel > 0.3) {
    const finCount = Math.floor(state.time * 0.12);
    sctx.globalAlpha = laneAlpha * laneParallel * 0.3;
    sctx.fillStyle = "rgba(123,94,167,0.7)";
    sctx.font = '10px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText(
      finCount + " interactions finalized in parallel",
      cx,
      lanesTop + P_COUNT * laneSpacing + 36
    );
  }

  sctx.restore();
}
