import { ALICE_COLOR } from "./constants.js";

const AGENT_RADIUS = 40;
const USER_RADIUS = 54;
const TRAVEL_AGENT_COLOR = "#C47A2D";
const FLIGHT_AGENT_COLOR = "#2D7EC4";

export function drawAgentsOnMOI(sctx, state, timeline, { cx, cy, W }) {
  const { moiAlpha, moiContextT, moiAgentReadT } = timeline;
  if (moiAlpha <= 0.01) return;

  sctx.save();
  sctx.globalAlpha = moiAlpha;

  const spacing = Math.min(260, W * 0.22);
  const userX = cx;
  const userY = cy;
  const agentAX = cx - spacing;
  const agentAY = cy;
  const agentBX = cx + spacing;
  const agentBY = cy;

  // Draw agent nodes (non-blob style for this opening narrative)
  const agentScale = moiAgentReadT > 0 ? 0.94 : 1;
  const agentRad = AGENT_RADIUS * agentScale;
  drawAgentNode(sctx, agentAX, agentAY, TRAVEL_AGENT_COLOR, "Travel", "planner", agentRad, moiAlpha);
  drawAgentNode(sctx, agentBX, agentBY, FLIGHT_AGENT_COLOR, "Flights", "booker", agentRad, moiAlpha);

  // Context field (distinct from superstate blob language)
  const contextFieldR = USER_RADIUS + 8;
  if (moiContextT > 0.01) {
    drawParticipantCore(sctx, userX, userY, ALICE_COLOR, contextFieldR, moiContextT, moiAlpha);
    drawContextField(sctx, state, userX, userY, contextFieldR, moiContextT, moiAlpha);
  } else {
    drawParticipantCore(sctx, userX, userY, ALICE_COLOR, contextFieldR, 1, moiAlpha);
  }

  // Connection lines: context → agents (reading from context)
  if (moiAgentReadT > 0.01) {
    drawReadLine(sctx, state, userX, userY, contextFieldR + 6, agentAX, agentAY, agentRad,
      ALICE_COLOR, TRAVEL_AGENT_COLOR, moiAgentReadT, moiAlpha, "budget, dates, prefs");
    drawReadLine(sctx, state, userX, userY, contextFieldR + 6, agentBX, agentBY, agentRad,
      ALICE_COLOR, FLIGHT_AGENT_COLOR, moiAgentReadT, moiAlpha, "budget, dates, prefs");
  }

  // "Apps log into you" emphasis at end
  if (moiAgentReadT > 0.7) {
    const emphAlpha = Math.min(1, (moiAgentReadT - 0.7) / 0.3) * (0.5 + 0.3 * Math.sin(state.time * 0.05));
    sctx.globalAlpha = moiAlpha * emphAlpha * 0.5;
    sctx.fillStyle = "#7B5EA7";
    sctx.font = 'bold 9px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText("one context \u00B7 all agents", cx, cy + contextFieldR + 50);
  }

  sctx.restore();
}

function drawAgentNode(sctx, x, y, color, name, role, rad, alpha) {
  const w = rad * 2.25;
  const h = rad * 1.35;
  const rx = x - w / 2;
  const ry = y - h / 2;

  sctx.save();
  sctx.globalAlpha = alpha;
  sctx.fillStyle = color + "1a";
  sctx.strokeStyle = color + "b0";
  sctx.lineWidth = 1.5;
  sctx.beginPath();
  sctx.roundRect(rx, ry, w, h, 10);
  sctx.fill();
  sctx.stroke();

  sctx.fillStyle = color;
  sctx.font = 'bold 10px "DM Mono", monospace';
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.fillText(name, x, y - 2);

  sctx.globalAlpha = alpha * 0.55;
  sctx.font = '8px "DM Mono", monospace';
  sctx.fillText(role, x, y + 10);
  sctx.textBaseline = "alphabetic";
  sctx.restore();
}

function drawParticipantCore(sctx, x, y, color, rad, appearT, alpha) {
  const pulse = 1 + 0.035 * Math.sin(performance.now() * 0.004);
  const r = rad * Math.min(1, appearT * 1.4) * pulse;

  sctx.save();
  sctx.globalAlpha = alpha;
  sctx.strokeStyle = color + "9a";
  sctx.lineWidth = 1.6;
  sctx.beginPath();
  sctx.arc(x, y, r, 0, Math.PI * 2);
  sctx.stroke();

  sctx.globalAlpha = alpha * 0.14;
  sctx.fillStyle = color;
  sctx.beginPath();
  sctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
  sctx.fill();

  sctx.globalAlpha = alpha * 0.9;
  sctx.fillStyle = color;
  sctx.font = 'bold 10px "DM Mono", monospace';
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.fillText("You", x, y);
  sctx.textBaseline = "alphabetic";
  sctx.restore();
}

function drawContextField(sctx, state, x, y, r, t, alpha) {
  const fieldAlpha = alpha * Math.min(1, t * 1.6);
  const labels = ["budget", "dates", "prefs", "history"];

  sctx.save();
  for (let i = 0; i < labels.length; i++) {
    const ang = -Math.PI / 2 + i * (Math.PI * 2 / labels.length) + state.time * 0.002;
    const dist = r + 24;
    const px = x + Math.cos(ang) * dist;
    const py = y + Math.sin(ang) * dist;
    const w = 38;
    const h = 14;
    sctx.globalAlpha = fieldAlpha * 0.42;
    sctx.fillStyle = "#7B5EA7";
    sctx.beginPath();
    sctx.roundRect(px - w / 2, py - h / 2, w, h, 4);
    sctx.fill();

    sctx.globalAlpha = fieldAlpha * 0.9;
    sctx.fillStyle = "#F5F3EE";
    sctx.font = '7px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText(labels[i], px, py + 0.5);
  }

  if (t > 0.45) {
    const labelAlpha = Math.min(1, (t - 0.45) / 0.25);
    sctx.globalAlpha = alpha * labelAlpha * 0.55;
    sctx.fillStyle = ALICE_COLOR;
    sctx.font = '8px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "alphabetic";
    sctx.fillText("shared context field", x, y + r + 20);
  }
  sctx.restore();
}

function drawReadLine(sctx, state, fromX, fromY, fromR, toX, toY, toR, fromColor, toColor, progress, alpha, label) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  const startX = fromX + nx * (fromR + 8);
  const startY = fromY + ny * (fromR + 8);
  const endX = toX - nx * (toR + 8);
  const endY = toY - ny * (toR + 8);

  // Control point — arc slightly upward
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 40;

  // Dashed line from context → agent
  const lineAlpha = Math.min(1, progress * 2);
  sctx.globalAlpha = alpha * lineAlpha * 0.35;
  const lineGrad = sctx.createLinearGradient(startX, startY, endX, endY);
  lineGrad.addColorStop(0, fromColor);
  lineGrad.addColorStop(1, toColor);
  sctx.strokeStyle = lineGrad;
  sctx.lineWidth = 1.5;
  sctx.setLineDash([3, 3]);
  sctx.beginPath();
  sctx.moveTo(startX, startY);
  sctx.quadraticCurveTo(midX, midY, endX, endY);
  sctx.stroke();
  sctx.setLineDash([]);

  // Traveling dots (flow FROM context TO agent)
  if (progress > 0.2) {
    const dotProg = Math.min(1, (progress - 0.2) / 0.5);
    for (let i = 0; i < 3; i++) {
      const t = ((state.time * 0.005 + i * 0.33) % 1);
      const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const py = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
      const dotAlpha = Math.sin(t * Math.PI) * dotProg;
      sctx.globalAlpha = alpha * dotAlpha * 0.7;
      sctx.fillStyle = "#27AE60";
      sctx.beginPath();
      sctx.arc(px, py, 2.5, 0, Math.PI * 2);
      sctx.fill();
    }
  }

  // Label along the connection
  if (progress > 0.4) {
    const lblAlpha = Math.min(1, (progress - 0.4) / 0.3);
    sctx.globalAlpha = alpha * lblAlpha * 0.4;
    sctx.fillStyle = "rgba(26,26,26,0.45)";
    sctx.font = '7px "DM Mono", monospace';
    sctx.textAlign = "center";
    sctx.fillText(label, midX, midY - 8);
  }
}
