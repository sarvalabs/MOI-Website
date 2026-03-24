export function ramp(v, a, b) {
  if (v <= a) return 0;
  if (v >= b) return 1;
  return (v - a) / (b - a);
}

export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function computeTimeline(p) {
  const chainAlpha = 1 - ramp(p, 0.095, 0.11);

  const libT = ramp(p, 0.095, 0.18);
  const libVisible = p >= 0.09 && p <= 0.28;
  const crackT = smoothstep(Math.min(1, libT * 10));
  const burstT = smoothstep(ramp(libT, 0.0, 0.08));
  const sortT = smoothstep(ramp(libT, 0.04, 0.15));
  const miniFunnelT = smoothstep(ramp(libT, 0.10, 0.22));
  const libFade = p < 0.095 ? 0
    : p < 0.11 ? (p - 0.095) / 0.015
    : p > 0.23 ? Math.max(0, (0.28 - p) / 0.05)
    : 1;

  // MDAG lanes: fade in 0.24–0.27, dwell, fade out 0.44–0.48
  const laneAlpha = p < 0.24 ? 0
    : p < 0.27 ? (p - 0.24) / 0.03
    : p > 0.44 ? Math.max(0, (0.48 - p) / 0.04)
    : 1;
  const laneInterAlpha = p < 0.28 ? 0 : p < 0.31 ? (p - 0.28) / 0.03 : 1;
  const laneParallel = p < 0.32 ? 0 : p < 0.35 ? (p - 0.32) / 0.03 : 1;

  const tessStart = 0.46;
  const tessRamp = 0.06;
  const tessAlpha = p < tessStart ? 0 : Math.min(1, (p - tessStart) / tessRamp);

  return {
    p, chainAlpha,
    libT, libVisible, crackT, burstT, sortT, miniFunnelT, libFade,
    laneAlpha, laneInterAlpha, laneParallel,
    tessAlpha,
  };
}
