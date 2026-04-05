import { useState } from "react";
import { Link } from "react-router-dom";

import { WHITEPAPER_URL } from "../phases/constants.js";

export default function Navbar({ activePage = "home" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (page) =>
    `font-mono text-[11px] tracking-[0.12em] uppercase transition-colors duration-300 ${
      activePage === page
        ? "text-[#1A1A1A] bg-[#7B5EA7]/8 rounded-full px-[14px] py-[6px]"
        : "text-[#1A1A1A]/45 hover:text-[#1A1A1A] px-[14px] py-[6px]"
    }`;

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6">
      <div
        className="mx-auto flex max-w-[1200px] items-center justify-between rounded-full px-5 h-[56px]"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(26,26,26,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline shrink-0">
          <img src="/logo-moi-mark.png" alt="MOI" className="h-9 w-9" />
          <span className="font-mono text-xs tracking-[0.3em] uppercase font-medium text-[#1A1A1A]">
            MOI
          </span>
        </Link>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={linkClass("home")}>Home</Link>
          <Link to="/why-moi" className={linkClass("why-moi")}>Why MOI</Link>
          <a
            href="https://docs.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass("docs")}
          >
            Docs
          </a>
        </div>

        {/* Right CTAs — desktop */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a
            href={WHITEPAPER_URL}
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 rounded-full px-5 py-2 transition-all duration-300"
          >
            Whitepaper
          </a>
          <a
            href="https://voyage.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#F5F3EE] bg-[#1A1A1A] hover:bg-[#7B5EA7] rounded-full px-5 py-2 transition-all duration-300"
          >
            Get Started
          </a>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-[1.5px] bg-[#1A1A1A] transition-transform duration-300"
            style={menuOpen ? { transform: "rotate(45deg) translate(2px, 2px)" } : {}}
          />
          <span
            className="block w-5 h-[1.5px] bg-[#1A1A1A] transition-opacity duration-300"
            style={menuOpen ? { opacity: 0 } : {}}
          />
          <span
            className="block w-5 h-[1.5px] bg-[#1A1A1A] transition-transform duration-300"
            style={menuOpen ? { transform: "rotate(-45deg) translate(2px, -2px)" } : {}}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden mt-2 mx-auto max-w-[1200px] rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(26,26,26,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <Link to="/" className={linkClass("home")} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/why-moi" className={linkClass("why-moi")} onClick={() => setMenuOpen(false)}>Why MOI</Link>
          <a href="https://docs.moi.technology" target="_blank" rel="noopener noreferrer" className={linkClass("docs")}>Docs</a>
          <hr className="border-[#1A1A1A]/8" />
          <a href={WHITEPAPER_URL} className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1A1A]/60">Whitepaper</a>
          <a
            href="https://voyage.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#F5F3EE] bg-[#1A1A1A] rounded-full px-5 py-2.5 text-center"
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}
