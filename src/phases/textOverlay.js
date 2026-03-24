const BEATS = [
  { end: 0.035, label: "TODAY'S NETWORKS",       title: "Every transaction waits<br>in a single global queue" },
  { end: 0.07,  label: "TODAY'S NETWORKS",       title: "One bottleneck.<br>Total congestion." },
  { end: 0.10,  label: "TODAY'S NETWORKS",       title: "Networks built around contracts<br>can't scale around people" },
  { end: 0.15,  label: "MOI",                    title: "A coordination layer<br>built around participants" },
  { end: 0.24,  label: "MOI",                    title: "Each participant gets<br>their own execution pipeline" },
  { end: 0.30,  label: "MDAG ARCHITECTURE",      title: "Interactions bridge between<br>participant contexts — in parallel" },
  { end: 0.38,  label: "TRUE PARALLELISM",       title: "Unrelated interactions finalize<br>simultaneously. No global ordering." },
  { end: 0.46,  label: "TRUE PARALLELISM",       title: "Throughput scales with<br>the number of participants" },
  { end: 0.54,  label: "CONTEXT SUPERSTATES",    title: "Every participant owns<br>their identity, assets, and trust" },
  { end: 0.60,  label: "CONTEXT SUPERSTATES",    title: "State lives with the participant —<br>not inside a contract you don't control" },
  { end: 0.66,  label: "CONTEXT SUPERSTATES",    title: "Apps read and write context<br>only with participant consent" },
  { end: 0.72,  label: "PARTICIPANT-CENTRIC",    title: "Participants interact directly —<br>each carrying their full context" },
  { end: 0.78,  label: "PARTICIPANT-CENTRIC",    title: "Transfer, swap, vote —<br>all in parallel, all sovereign" },
  { end: 0.86,  label: "THE NETWORK",            title: "The participant-centric network<br>for digital interaction" },
  { end: 0.94,  label: "THE NETWORK",            title: "Every node is independent.<br>Every interaction is parallel." },
  { end: 1.01,  label: "THE NETWORK",            title: "MOI models the network<br>around people, not contracts" },
];

function ease(t) { return t * t * (3 - 2 * t); }

const FADE = 0.012;

export function updateTextOverlay(p, tessAlpha, cLabelRef, cTitleRef) {
  if (!cLabelRef.current || !cTitleRef.current) return;

  cLabelRef.current.classList.add("visible");
  cTitleRef.current.classList.add("visible");

  let beatIdx = 0;
  for (let i = 0; i < BEATS.length; i++) {
    if (p < BEATS[i].end) { beatIdx = i; break; }
    if (i === BEATS.length - 1) beatIdx = i;
  }

  const beat = BEATS[beatIdx];
  const beatStart = beatIdx === 0 ? 0 : BEATS[beatIdx - 1].end;
  const beatEnd = beat.end;
  const span = beatEnd - beatStart;
  const fw = Math.min(FADE, span * 0.18);

  // Eased fade-in at start, eased fade-out at end — first beat skips fade-in
  const fadeIn = beatIdx === 0 ? 1 : ease(Math.min(1, (p - beatStart) / fw));
  const fadeOut = ease(Math.min(1, (beatEnd - p) / fw));
  const beatFade = Math.min(fadeIn, fadeOut);

  const overlayFade = tessAlpha > 0
    ? (tessAlpha > 0.15 ? Math.min(1, (tessAlpha - 0.15) / 0.15) : Math.max(0, 1 - tessAlpha * 6))
    : 1;
  const finalOpacity = overlayFade * beatFade;
  cLabelRef.current.style.opacity = finalOpacity;
  cTitleRef.current.style.opacity = finalOpacity;

  // Swap text only when faded low enough to hide the pop
  if (beatFade > 0.15) {
    cLabelRef.current.textContent = beat.label;
    cTitleRef.current.innerHTML = beat.title;
  }

  // Cycle text position: bottom-left → top-right → top-left
  const textGroup = cLabelRef.current.parentElement;
  const overlay = textGroup?.parentElement;
  if (overlay) {
    const corner = beatIdx % 3;
    if (corner === 0) {
      overlay.style.justifyContent = "flex-end";
      overlay.style.alignItems = "flex-start";
      cTitleRef.current.style.textAlign = "left";
    } else if (corner === 1) {
      overlay.style.justifyContent = "flex-start";
      overlay.style.alignItems = "flex-end";
      cTitleRef.current.style.textAlign = "right";
    } else {
      overlay.style.justifyContent = "flex-start";
      overlay.style.alignItems = "flex-start";
      cTitleRef.current.style.textAlign = "left";
    }
  }

  // Show CTAs during the final network beats (p >= 0.82)
  const ctaRow = textGroup?.querySelector(".canvas-cta-row");
  if (ctaRow) {
    if (p >= 0.82) {
      ctaRow.classList.add("visible");
    } else {
      ctaRow.classList.remove("visible");
    }
  }
}
