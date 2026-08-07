import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WHITEPAPER_URL } from "../phases/constants.js";
import Navbar from "../components/Navbar.jsx";

gsap.registerPlugin(ScrollTrigger);

/* ── Section data ── */

const SECTIONS = [
  {
    id: "intro",
    gradient: "gradient-intro",
    label: "THE PROBLEM",
    title: "When agents delegate,\ntrust breaks down",
    visual: "chain",
  },
  {
    id: "evaporation",
    gradient: "gradient-evaporation",
    label: "THE PROBLEM",
    title: "Every agent starts\nfrom zero",
    visual: "evaporation",
  },
  {
    id: "contract",
    gradient: "gradient-contract",
    label: "THE PROBLEM",
    title: "Your tokens live in\nsomeone else\u2019s contract",
    visual: "vault",
  },
  {
    id: "pivot",
    gradient: "gradient-pivot",
    title: "Three problems.\nOne root cause.",
    italic: true,
  },
  { id: "who", gradient: "gradient-who", special: "who" },
  {
    id: "solution",
    gradient: "gradient-solution",
    label: "THE SOLUTION",
    title: "Delegation is scoped\nand signed",
    visual: "delegation-card",
  },
  {
    id: "preferences",
    gradient: "gradient-preferences",
    label: "CONTEXT SUPERSTATE",
    title: "Your preferences\nfollow you",
    visual: "preferences-card",
  },
  {
    id: "assets",
    gradient: "gradient-assets",
    label: "CONTEXT SUPERSTATE",
    title: "Your assets\nlive with you",
    visual: "assets-grid",
  },
  {
    id: "permissions",
    gradient: "gradient-permissions",
    label: "CONTEXT SUPERSTATE",
    title: "You control\nwho sees what",
    visual: "permissions-card",
  },
  {
    id: "scale",
    gradient: "gradient-scale",
    label: "THE PARTICIPANT LAYER",
    title: "Independent. Parallel.\nParticipant-centric.",
    visual: "parallel",
  },
  { id: "cta", special: "cta" },
];

/* ── Visual: Delegation Chain ── */

function ChainVisual() {
  const nodes = [
    { label: "Alice", color: "#4B17E5", you: true },
    { label: "Personal Agent", color: "#4B17E5" },
    { label: "Flight Agent", color: "#3A9F7E" },
    { label: "Payment Agent", color: "#D4853A" },
    { label: "Bank Agent", color: "#C44D5A" },
  ];
  return (
    <div className="section-visual mt-10 flex items-center justify-center gap-2 flex-wrap max-w-[480px]">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[8px] font-mono font-medium tracking-wide"
              style={{ background: node.color, opacity: 1 - i * 0.15 }}
            >
              {node.you ? "YOU" : ""}
            </div>
            <span className="font-mono text-[7px] text-[#0A051A]/25 whitespace-nowrap">
              {node.label}
            </span>
          </div>
          {i < nodes.length - 1 && (
            <svg width="16" height="8" viewBox="0 0 16 8" className="text-[#0A051A]/10 shrink-0 mx-0.5">
              <line x1="0" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1" />
              <path d="M9 1l4 3-4 3" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </div>
      ))}
      <svg width="16" height="8" viewBox="0 0 16 8" className="text-[#C44D5A]/20 shrink-0 mx-0.5">
        <line x1="0" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1" />
        <path d="M9 1l4 3-4 3" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
      <div className="w-7 h-7 rounded-full border border-[#C44D5A]/30 flex items-center justify-center">
        <span className="text-[#C44D5A]/50 text-[11px] font-serif">?</span>
      </div>
    </div>
  );
}

/* ── Visual: Context Evaporation ── */

function EvaporationVisual() {
  const agents = [
    { name: "Flight Agent", status: "context lost", color: "#3A9F7E" },
    { name: "Hotel Agent", status: "context lost", color: "#D4853A" },
    { name: "Dinner Agent", status: "starting from zero", color: "#C44D5A" },
  ];
  return (
    <div className="section-visual mt-10 flex flex-col gap-3 max-w-[340px] w-full">
      {agents.map((a, i) => (
        <div
          key={i}
          className="visual-row card-surface px-5 py-4 flex items-center justify-between"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
            <span className="font-mono text-[10px] text-[#0A051A]/50">{a.name}</span>
          </div>
          <span className="font-mono text-[9px] italic text-[#C44D5A]/60">{a.status}</span>
        </div>
      ))}
      <p className="font-mono text-[9px] text-[#0A051A]/20 text-center mt-2">
        each agent re-discovers what Alice already knows
      </p>
    </div>
  );
}

/* ── Visual: Vault ── */

function VaultVisual() {
  const entries = [
    { key: "alice", val: "500", color: "#4B17E5" },
    { key: "bob", val: "890", color: "#D4853A" },
    { key: "diana", val: "1,200", color: "#2D7EC4" },
  ];
  return (
    <div className="section-visual mt-10 max-w-[300px] w-full">
      <div className="card-surface px-6 py-5 text-left">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#0A051A]/35">
            DEX Contract
          </span>
          <span className="font-mono text-[7px] text-[#C44D5A]/50 tracking-wider">VULNERABLE</span>
        </div>
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.key} className="visual-row flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#0A051A]/30">{e.key}</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 rounded-full bg-[#0A051A]/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ background: e.color, width: "70%", opacity: 0.4 }} />
                </div>
                <span className="text-[#0A051A]/40 w-10 text-right">{e.val}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-[#0A051A]/5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C44D5A]/60" />
          <span className="font-mono text-[8px] text-[#C44D5A]/50">
            anyone with the contract controls your tokens
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Visual: Delegation Card ── */

function DelegationCardVisual() {
  return (
    <div className="section-visual mt-10 card-surface px-7 py-6 max-w-[340px] w-full text-left">
      <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4B17E5] mb-5">
        Scoped Authority
      </div>
      <div className="flex flex-col gap-3">
        {[
          ["scope", "book:flights, book:hotel", "granted", "#3A8F6E"],
          ["pay:>$500", "requires approval", "denied", "#C44D5A"],
          ["read:prefs", "all preferences", "granted", "#3A8F6E"],
          ["depth", "max 2 hops", "enforced", "#2D7EC4"],
          ["signed", "ed25519", "verified", "#3A8F6E"],
          ["expires", "2024-10-15", "active", "#4B17E5"],
        ].map(([key, detail, status, color]) => (
          <div
            key={key}
            className="visual-row flex items-baseline justify-between font-mono text-[10px] gap-3"
          >
            <span className="text-[#0A051A]/30 shrink-0">{key}</span>
            <span className="text-[#0A051A]/15 text-[9px] truncate flex-1 text-right mr-3">
              {detail}
            </span>
            <span className="shrink-0 font-medium" style={{ color }}>
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Visual: Preferences Card ── */

function PreferencesCardVisual() {
  return (
    <div className="section-visual mt-10 card-surface px-7 py-6 max-w-[320px] w-full text-left">
      <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4B17E5] mb-5">
        Preferences
      </div>
      <div className="flex flex-col gap-3">
        {[
          ["shellfish allergy", "medical"],
          ["window seat", "booking history"],
          ["late check-in (9pm+)", "travel pattern"],
          ["quiet room", "hotel feedback"],
          ["budget: $200/night", "spending"],
          ["vegetarian backup", "dietary log"],
        ].map(([pref, source]) => (
          <div
            key={pref}
            className="visual-row flex items-baseline justify-between font-mono text-[10px] gap-4"
          >
            <span className="text-[#0A051A]/40">{pref}</span>
            <span className="text-[#0A051A]/12 text-[8px] shrink-0">{source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Visual: Assets Grid ── */

function AssetsGridVisual() {
  const tokens = [
    ["kMOI", "12,450", "#4B17E5"],
    ["BTC", "0.847", "#F7931A"],
    ["ETH", "4.20", "#627EEA"],
    ["SOL", "89.3", "#14F195"],
    ["USDC", "2,500", "#2775CA"],
    ["DOT", "156", "#E6007A"],
  ];
  return (
    <div className="section-visual mt-10 grid grid-cols-3 gap-3 max-w-[360px] w-full">
      {tokens.map(([name, amount, color]) => (
        <div key={name} className="visual-row card-surface px-4 py-3.5 text-center">
          <div className="font-mono text-[11px] font-medium tracking-wider mb-1" style={{ color }}>
            {name}
          </div>
          <div className="font-mono text-[9px] text-[#0A051A]/25">{amount}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Visual: Permissions Card ── */

function PermissionsCardVisual() {
  const agents = [
    ["Flight Agent", ["read", "book"], ["pay"]],
    ["Hotel Agent", ["read", "book"], ["pay", "delegate"]],
    ["Dinner Agent", ["read"], ["book", "pay"]],
    ["Bank Agent", ["read", "pay"], ["delegate"]],
  ];
  return (
    <div className="section-visual mt-10 card-surface px-7 py-6 max-w-[360px] w-full text-left">
      <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4B17E5] mb-5">
        Agent Permissions
      </div>
      <div className="flex flex-col gap-4">
        {agents.map(([name, granted, denied]) => (
          <div key={name} className="visual-row">
            <div className="font-mono text-[10px] text-[#0A051A]/40 mb-1.5">{name}</div>
            <div className="flex gap-3 font-mono text-[8px]">
              {granted.map((p) => (
                <span key={p} className="text-[#3A8F6E]">
                  <span className="opacity-60">{"\u2713"}</span> {p}
                </span>
              ))}
              {denied.map((p) => (
                <span key={p} className="text-[#C44D5A]/50">
                  <span>{"\u2717"}</span> {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Visual: Parallel Processing ── */

function ParallelVisual() {
  const participants = [
    { name: "Alice", color: "#4B17E5" },
    { name: "Bob", color: "#3A9F7E" },
    { name: "Charlie", color: "#D4853A" },
    { name: "Diana", color: "#2D7EC4" },
    { name: "Eve", color: "#C44D5A" },
  ];
  return (
    <div className="section-visual mt-10 flex flex-col gap-2.5 max-w-[400px] w-full">
      {participants.map((p) => (
        <div key={p.name} className="visual-row flex items-center gap-3">
          <span className="font-mono text-[9px] text-[#0A051A]/30 w-14 text-right shrink-0">
            {p.name}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-[#0A051A]/[0.03] overflow-hidden">
            <div
              className="h-full rounded-full parallel-bar"
              style={{ background: p.color, opacity: 0.35, width: "0%" }}
            />
          </div>
          <span className="font-mono text-[8px] text-[#3A8F6E] opacity-0 parallel-check">
            {"\u2713"}
          </span>
        </div>
      ))}
      <p className="font-mono text-[8px] text-[#0A051A]/15 text-center mt-3">
        no global ordering — each participant processes independently
      </p>
    </div>
  );
}

/* ── Visual switch ── */

function SectionVisual({ type }) {
  switch (type) {
    case "chain": return <ChainVisual />;
    case "evaporation": return <EvaporationVisual />;
    case "vault": return <VaultVisual />;
    case "delegation-card": return <DelegationCardVisual />;
    case "preferences-card": return <PreferencesCardVisual />;
    case "assets-grid": return <AssetsGridVisual />;
    case "permissions-card": return <PermissionsCardVisual />;
    case "parallel": return <ParallelVisual />;
    default: return null;
  }
}

/* ── Section components ── */

function Section({ id, gradient, label, title, subtitle, visual, italic }) {
  const lines = title.split("\n");
  return (
    <section id={`section-${id}`} className={`snap-section ${gradient}`}>
      <div className="section-content max-w-[900px] mx-auto px-6 md:px-12 flex flex-col items-center text-center">
        {label && (
          <span className="section-label font-mono text-[10px] tracking-[0.2em] uppercase text-[#4B17E5] font-medium mb-5">
            {label}
          </span>
        )}
        <h2
          className={`section-title font-serif leading-[1.1] text-[#0A051A] max-w-[700px] ${
            italic
              ? "italic text-[clamp(1.8rem,3.5vw,2.8rem)] text-[#0A051A]/60"
              : "text-[clamp(2.5rem,5vw,4.5rem)]"
          }`}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
        {subtitle && (
          <p className="section-subtitle font-mono text-[13px] text-[#0A051A]/30 mt-5 max-w-[460px]">
            {subtitle}
          </p>
        )}
        {visual && <SectionVisual type={visual} />}
      </div>
    </section>
  );
}

function SectionWho() {
  return (
    <section id="section-who" className="snap-section gradient-who">
      <div className="flex flex-col items-center text-center">
        <h2 className="section-title font-serif font-bold text-[clamp(6rem,15vw,14rem)] leading-[0.85] tracking-[-0.04em] text-[#0A051A]">
          WHO
        </h2>
        <p className="section-subtitle font-mono text-[13px] tracking-[0.1em] text-[#0A051A]/30 mt-6">
          is missing.
        </p>
      </div>
    </section>
  );
}

function SectionCTA() {
  return (
    <section id="section-cta" className="snap-section bg-hero-gradient">
      <div className="section-content flex flex-col items-center text-center px-6">
        <h2 className="section-title font-serif text-[clamp(2.2rem,5vw,4rem)] leading-[1.1] text-[#0A051A] mb-5">
          Your context. Your assets.
          <br />
          Your rules.
        </h2>
        <p className="section-subtitle font-mono text-[13px] text-[#0A051A]/30 mb-10 max-w-[460px] leading-relaxed">
          Read the whitepaper, explore the docs, or start building with Cocolang.
        </p>
        <a
          href={WHITEPAPER_URL}
          className="section-visual inline-flex items-center gap-2 rounded-full bg-[#0A051A] text-[#FCFBFF] px-9 py-3.5 font-mono text-[11px] tracking-[0.15em] uppercase hover:bg-[#4B17E5] transition-colors duration-300 no-underline"
        >
          READ WHITEPAPER →
        </a>
      </div>
    </section>
  );
}

/* ── Main page ── */

export default function HowItWorksPageV5() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = gsap.utils.toArray(".snap-section", container);

    // Set initial hidden state
    sections.forEach((section) => {
      const els = section.querySelectorAll(
        ".section-label, .section-title, .section-subtitle, .section-visual"
      );
      gsap.set(els, { opacity: 0, y: 24 });
      const rows = section.querySelectorAll(".visual-row");
      gsap.set(rows, { opacity: 0, y: 16 });
    });

    // WHO title special
    const whoTitle = container.querySelector("#section-who .section-title");
    if (whoTitle) gsap.set(whoTitle, { opacity: 0, scale: 0.5, y: 0 });

    sections.forEach((section, i) => {
      const label = section.querySelector(".section-label");
      const title = section.querySelector(".section-title");
      const subtitle = section.querySelector(".section-subtitle");
      const visual = section.querySelector(".section-visual");
      const rows = section.querySelectorAll(".visual-row");
      const bars = section.querySelectorAll(".parallel-bar");
      const checks = section.querySelectorAll(".parallel-check");

      if (i === 0) {
        const els = [label, title, subtitle, visual].filter(Boolean);
        gsap.to(els, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          delay: 0.3,
          ease: "power2.out",
        });
        if (rows.length > 0) {
          gsap.to(rows, {
            opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.8, ease: "power2.out",
          });
        }
        return;
      }

      if (section.id === "section-who") {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, scroller: container, start: "top 60%", toggleActions: "play none none none" },
        });
        if (title) tl.to(title, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "power3.out" });
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3");
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, scroller: container, start: "top 80%", toggleActions: "play none none none" },
      });

      if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.4 });
      if (title) tl.to(title, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.2");
      if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3");
      if (visual) tl.to(visual, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");

      if (rows.length > 0) {
        tl.to(rows, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" }, "-=0.1");
      }

      // Parallel bars animation
      if (bars.length > 0) {
        tl.to(bars, {
          width: () => `${65 + Math.random() * 30}%`,
          duration: 1.2,
          stagger: 0.15,
          ease: "power2.out",
        }, "-=0.3");
        tl.to(checks, { opacity: 1, duration: 0.3, stagger: 0.1 }, "-=0.4");
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <>
      <Navbar activePage="how-it-works" />
      <div ref={containerRef} className="snap-container">
        {SECTIONS.map((s) => {
          if (s.special === "who") return <SectionWho key={s.id} />;
          if (s.special === "cta") return <SectionCTA key={s.id} />;
          return <Section key={s.id} {...s} />;
        })}
      </div>
    </>
  );
}
