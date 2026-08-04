import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ activePage = "home" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // When the logo is clicked while already on "/", scroll to top
  // instead of being a no-op router link.
  const handleLogoClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const linkClass = (page) =>
    `text-[12px] tracking-[0.04em] font-semibold transition-colors duration-300 rounded-full px-[14px] py-[6px] ${
      activePage === page
        ? "text-white bg-white/10"
        : "text-white/72 hover:text-white"
    }`;

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6">
      <div
        className="mx-auto flex max-w-[1200px] items-center justify-between rounded-full px-5 h-[56px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(60, 44, 130, 0.55) 0%, rgba(34, 22, 88, 0.55) 100%)",
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
          border: "1px solid rgba(200, 191, 239, 0.28)",
          boxShadow:
            "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 14px 36px rgba(10, 5, 38, 0.32)",
        }}
      >
        {/* Logo — MOI planetoid mark */}
        <Link
          to="/"
          aria-label="MOI — home"
          onClick={handleLogoClick}
          className="nav-logo flex items-center no-underline shrink-0"
        >
          <img
            src="/brand/logos/SVG/default-light.svg"
            alt="MOI"
            className="w-auto"
            style={{ height: "36px" }}
          />
        </Link>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/why-moi" className={linkClass("why-moi")}>The Shift</Link>
          <a
            href="https://docs.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass("docs")}
          >
            Docs
          </a>
          <Link to="/manifesto" className={linkClass("manifesto")}>Manifesto</Link>
          <Link to="/papers" className={linkClass("papers")}>Papers</Link>
          <Link to="/blog" className={linkClass("blog")}>Blog</Link>
        </div>

        {/* Right CTA — desktop */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a
            href="https://voyage.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta text-[12px] tracking-[-0.005em] font-semibold text-white bg-[#4B17E5] hover:bg-[#320F99] rounded-full px-5 py-[9px] transition-colors duration-200"
            style={{ boxShadow: "0 4px 14px rgba(75, 23, 229, 0.28)" }}
          >
            Explore the network
          </a>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-[1.5px] bg-[#0A051A] transition-transform duration-300"
            style={menuOpen ? { transform: "rotate(45deg) translate(2px, 2px)" } : {}}
          />
          <span
            className="block w-5 h-[1.5px] bg-[#0A051A] transition-opacity duration-300"
            style={menuOpen ? { opacity: 0 } : {}}
          />
          <span
            className="block w-5 h-[1.5px] bg-[#0A051A] transition-transform duration-300"
            style={menuOpen ? { transform: "rotate(-45deg) translate(2px, -2px)" } : {}}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden mt-2 mx-auto max-w-[1200px] rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 12px 36px rgba(0, 0, 0, 0.28)",
          }}
        >
          <Link to="/why-moi" className={linkClass("why-moi")} onClick={() => setMenuOpen(false)}>The Shift</Link>
          <a href="https://docs.moi.technology" target="_blank" rel="noopener noreferrer" className={linkClass("docs")}>Docs</a>
          <Link to="/manifesto" className={linkClass("manifesto")} onClick={() => setMenuOpen(false)}>Manifesto</Link>
          <Link to="/papers" className={linkClass("papers")} onClick={() => setMenuOpen(false)}>Papers</Link>
          <Link to="/blog" className={linkClass("blog")} onClick={() => setMenuOpen(false)}>Blog</Link>
          <hr className="border-[#0A051A]/8" />
          <a
            href="https://voyage.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta text-[12px] font-semibold text-white bg-[#4B17E5] hover:bg-[#320F99] rounded-full px-5 py-2.5 text-center transition-colors duration-200"
            style={{ boxShadow: "0 4px 14px rgba(75, 23, 229, 0.28)" }}
            onClick={() => setMenuOpen(false)}
          >
            Explore the network
          </a>
        </div>
      )}
    </nav>
  );
}
