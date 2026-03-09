// Litepaper URL — set to your PDF or doc link
const LITEPAPER_URL = "/MOILitePaper.pdf";

// Grid only — uniform, subtle
const GRID_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none'>",
  "<line x1='0' y1='0.25' x2='80' y2='0.25' stroke='%23d2cdc5' stroke-width='0.5'/>",
  "<line x1='0.25' y1='0' x2='0.25' y2='80' stroke='%23d2cdc5' stroke-width='0.5'/>",
  "</svg>",
].join("");

// Participant glyph only — masked to fade toward center
const GLYPH_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none'>",
  "<circle cx='40' cy='26' r='4.5' stroke='%2390887e' stroke-width='0.9'/>",
  "<line x1='40' y1='31' x2='40' y2='46' stroke='%2390887e' stroke-width='0.9'/>",
  "<line x1='40' y1='36' x2='33' y2='42' stroke='%2390887e' stroke-width='0.9'/>",
  "<line x1='40' y1='36' x2='47' y2='42' stroke='%2390887e' stroke-width='0.9'/>",
  "<line x1='40' y1='46' x2='34' y2='57' stroke='%2390887e' stroke-width='0.9'/>",
  "<line x1='40' y1='46' x2='46' y2='57' stroke='%2390887e' stroke-width='0.9'/>",
  "</svg>",
].join("");

// Hero exclusion: transparent center, glyphs stronger toward edges
const GLYPH_MASK =
  "radial-gradient(ellipse 72% 60% at 50% 47%, transparent 0%, transparent 36%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0.7) 74%, black 100%)";

export default function App() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#f5f3ef] text-[#1c1c1c] overflow-hidden selection:bg-[#1c1c1c]/10">

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-10 lg:px-16 h-[72px]">
        <div className="flex items-center gap-3">
          <img
            src="/logo-moi-mark.png"
            alt="MOI logo"
            className="h-12 w-12 shrink-0"
          />
          <span className="font-mono text-xs tracking-[0.35em] uppercase font-medium">
            MOI
          </span>
        </div>
        <div className="flex items-center gap-10">
          <a
            href="https://docs.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9a9590] hover:text-[#1c1c1c] transition-colors duration-300"
          >
            Docs
          </a>
          <a
            href={LITEPAPER_URL}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9a9590] hover:text-[#1c1c1c] transition-colors duration-300"
          >
            Litepaper
          </a>
        </div>
      </nav>

      {/* Structural separator */}
      <div className="relative z-10 w-full h-px bg-[#e2deda]" />

      {/* Background — below navbar only: grid uniform, glyphs fade to center */}
      <div className="absolute left-0 right-0 top-[73px] bottom-0 pointer-events-none">
        {/* Grid layer — subtle, full coverage */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(210,205,197,0.7) 0px, rgba(210,205,197,0.7) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(to bottom, transparent 0px, transparent 79px, rgba(210,205,197,0.7) 79px, rgba(210,205,197,0.7) 80px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Participant glyphs — fade toward hero, exclusion zone in center */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,${GLYPH_SVG}")`,
            backgroundSize: "80px 80px",
            WebkitMaskImage: GLYPH_MASK,
            maskImage: GLYPH_MASK,
          }}
        />
      </div>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 lg:px-16">
        <div className="text-center">
          <h1 className="font-serif text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] tracking-[-0.03em]">
            MOI:<br />
            The Participant<br />
            Layer
          </h1>

          <p className="font-mono text-[13px] tracking-[0.06em] text-[#918b85] mt-12">
            Powered by Contextual Compute
          </p>

          <a href={LITEPAPER_URL} className="inline-flex items-center gap-3 mt-10 group">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase pb-[3px] border-b border-[#1c1c1c]/20 group-hover:border-[#1c1c1c]/60 transition-colors duration-300">
              Read Litepaper
            </span>
            <span className="text-sm text-[#9a9590] group-hover:text-[#1c1c1c] group-hover:translate-x-0.5 transition-all duration-300">
              →
            </span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-10 lg:px-16 py-5">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#c0bab2]">
          © 2026 MOI
        </span>
      </footer>
    </div>
  );
}
