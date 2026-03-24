import { ALICE_COLOR, FIELD_COLORS } from "./constants.js";
import { drawBlob } from "./drawHelpers.js";

const AGENT_RADIUS = 40;
const USER_RADIUS = 54;
const TRAVEL_AGENT_COLOR = "#C47A2D";
const FLIGHT_AGENT_COLOR = "#2D7EC4";
const DATA_LABELS = ["budget", "dates", "prefs", "history"];

export function drawTodaysAgents(sctx, state, timeline, { cx, cy, W, H }) {
  const { todayAlpha, todayRepeatT } = timeline;
  if (todayAlpha <= 0.01) return;

  sctx.save();
  sctx.globalAlpha = todayAlpha;

  const spacing = Math.min(260, W * 0.22);
  const userX = cx;
  const userY = cy;
  const agentAX = cx - spacing;
  const agentAY = cy;
  const agentBX = cx + spacing;
  const agentBY = cy;

  // Draw agent blobs
  drawBlob(sctx, agentAX, agentAY, TRAVEL_AGENT_COLOR, "Travel", AGENT_RADIUS, 1, state.time, false, todayAlpha);
  drawBlob(sctx, agentBX, agentBY, FLIGHT_AGENT_COLOR, "Flights", AGENT_RADIUS, 1, state.time, false, todayAlpha);

  // Agent sub-labels
  sctx.globalAlpha = todayAlpha * 0.45;
  sctx.fillStyle = TRAVEL_AGENT_COLOR;
  sctx.font = '8px "DM Mono", monospace';
  sctx.textAlign = "center";
  sctx.fillText("travel planner", agentAX, agentAY + AGENT_RADIUS + 18);
  sctx.fillStyle = FLIGHT_AGENT_COLOR;
  sctx.fillText("flight booker", agentBX, agentBY + AGENT_RADIUS + 18);

  // Draw user blob (on top)
  drawBlob(sctx, userX, userY, ALICE_COLOR, "You", USER_RADIUS, 1, state.time, false, todayAlpha);

  // Data packet animation — user → Agent A (always active)
  drawDataFlow(sctx, state, userX, userY, USER_RADIUS, agentAX, agentAY, AGENT_RADIUS,
    ALICE_COLOR, TRAVEL_AGENT_COLOR, DATA_LABELS, 1, todayAlpha, false);

  // Data packet animation — user → Agent B (starts at todayRepeatT > 0)
  if (todayRepeatT > 0.01) {
    drawDataFlow(sctx, state, userX, userY, USER_RADIUS, agentBX, agentBY, AGENT_RADIUS,
      ALICE_COLOR, FLIGHT_AGENT_COLOR, DATA_LABELS, todayRepeatT, todayAlpha, true);
  }

  // "Repeated context" warning pulse when second flow is active
  if (todayRepeatT > 0.5) {
    const warnAlpha = Math.min(1, (todayRepeatT - 0.5) * 2) * (0.5 + 0.3 * Math.sin(state.time * 0.06));
    sctx.globalAlpha = todayAlpha * warnAlpha * 0.6;
    sctx.fillStyle = "#C0392B";
    sctx.font = 'bold 9px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText("same context, repeated", cx, cy + USER_RADIUS + 40);
  }

  sctx.restore();
}

function drawDataFlow(sctx, state, fromX, fromY, fromR, toX, toY, toR, fromColor, toColor, labels, progress, alpha, isRepeat) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  const startX = fromX + nx * (fromR + 8);
  const startY = fromY + ny * (fromR + 8);
  const endX = toX - nx * (toR + 8);
  const endY = toY - ny * (toR + 8);

  // Control point for bezier curve (arc upward)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 50;

  // Dashed connection line
  const lineAlpha = Math.min(1, progress * 3);
  sctx.globalAlpha = alpha * lineAlpha * 0.25;
  const lineGrad = sctx.createLinearGradient(startX, startY, endX, endY);
  lineGrad.addColorStop(0, fromColor);
  lineGrad.addColorStop(1, toColor);
  sctx.strokeStyle = lineGrad;
  sctx.lineWidth = 1.5;
  sctx.setLineDash([4, 4]);
  sctx.beginPath();
  sctx.moveTo(startX, startY);
  sctx.quadraticCurveTo(midX, midY, endX, endY);
  sctx.stroke();
  sctx.setLineDash([]);

  // Traveling data packets
  if (progress > 0.1) {
    const packetAlpha = Math.min(1, (progress - 0.1) / 0.3);
    for (let i = 0; i < labels.length; i++) {
      const baseT = ((state.time * 0.004 + i * 0.25) % 1);
      const t = baseT;
      const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const py = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

      const dotAlpha = Math.sin(t * Math.PI) * packetAlpha;
      sctx.globalAlpha = alpha * dotAlpha * 0.8;

      // Packet dot
      const dotColor = isRepeat ? "#C0392B" : fromColor;
      sctx.fillStyle = dotColor;
      sctx.beginPath();
      sctx.arc(px, py, 3, 0, Math.PI * 2);
      sctx.fill();

      // Label next to dot
      if (dotAlpha > 0.3) {
        sctx.globalAlpha = alpha * dotAlpha * 0.55;
        sctx.fillStyle = isRepeat ? "#C0392B" : "rgba(26,26,26,0.5)";
        sctx.font = '7px "DM Mono", monospace';
        sctx.textAlign = "left";
        sctx.fillText(labels[i], px + 6, py + 3);
      }
    }
  }
}
