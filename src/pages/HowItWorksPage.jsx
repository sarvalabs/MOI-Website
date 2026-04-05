import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { WHITEPAPER_URL, NAV_H, PARTICIPANTS, P_COUNT } from "../phases/constants.js";
import { computeTimeline } from "../phases/timing.js";
import { drawFunnel } from "../phases/drawFunnel.js";
import { drawLiberation } from "../phases/drawLiberation.js";
import { drawMDAGLanes } from "../phases/drawMDAGLanes.js";
import { drawContextObject } from "../phases/drawContextObject.js";
import { updateTextOverlay } from "../phases/textOverlay.js";

export default function HowItWorksPage() {
  const sectionRef = useRef(null);
  const sceneRef = useRef(null);
  const cLabelRef = useRef(null);
  const cTitleRef = useRef(null);
  const ctxVisRef = useRef(null);
  const kramaVisRef = useRef(null);
  const pisaVisRef = useRef(null);
  const compOldRef = useRef(null);
  const compNewRef = useRef(null);
  const comparisonRef = useRef(null);
  const oldTpsRef = useRef(null);
  const newTpsRef = useRef(null);
  const panelRefs = useRef([]);
  const stateRef = useRef({
    W: 0,
    H: 0,
    dpr: 1,
    txPool: [],
    txIdCounter: 0,
    time: 0,
    oldC: 0,
    newC: 0,
  });
  const mapRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const section = sectionRef.current;
    if (!scene || !section) return;

    const sctx = scene.getContext("2d");
    const state = stateRef.current;

    const moiLogo = new Image();
    moiLogo.src = "/logo-moi-mark.png";

    function resize() {
      state.dpr = window.devicePixelRatio || 1;
      state.W = window.innerWidth;
      state.H = window.innerHeight - NAV_H;
      scene.width = state.W * state.dpr;
      scene.height = state.H * state.dpr;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.scale(state.dpr, state.dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function getProgress() {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      return Math.max(0, Math.min(1, (-rect.top + NAV_H) / total));
    }

    function spawnTx() {
      const p = Math.floor(Math.random() * P_COUNT);
      const angle = Math.random() * Math.PI * 2;
      const spawnR = 220 + Math.random() * 60;
      state.txPool.push({
        id: state.txIdCounter++,
        pA: p,
        x: Math.cos(angle) * spawnR,
        y: Math.sin(angle) * spawnR * 0.5,
        progress: 0,
        speed: 0.005 + Math.random() * 0.004,
        wobble: Math.random() * Math.PI * 2,
        lane: Math.random(),
        alive: true,
      });
    }

    for (let i = 0; i < 40; i++) {
      spawnTx();
      state.txPool[state.txPool.length - 1].progress = Math.random() * 0.7;
    }

    // Liberation particles — burst from bottleneck then sort into mini-funnels
    const libParticles = [];
    for (let i = 0; i < 60; i++) {
      const pIdx = i % P_COUNT;
      const angle = Math.random() * Math.PI * 2;
      const burstR = 40 + Math.random() * 100;
      libParticles.push({
        pIdx,
        burstX: Math.cos(angle) * burstR,
        burstY: Math.sin(angle) * burstR * 0.6,
        wobblePhase: Math.random() * Math.PI * 2,
        size: 3 + Math.random() * 2,
        delay: Math.random() * 0.25,
      });
    }

    let rafId;
    function draw() {
      state.time++;
      const { W, H } = state;
      sctx.clearRect(0, 0, W, H);
      const p = getProgress();

      const cx = W / 2;
      const cy = H / 2;

      const timeline = computeTimeline(p);

      drawFunnel(sctx, state, timeline, { cx, cy, W, spawnTx });

      drawLiberation(sctx, state, timeline, { cx, cy, H, libParticles });
      drawMDAGLanes(sctx, state, timeline, { cx, cy, W, H });
      drawContextObject(sctx, state, timeline, { cx, cy, W, H, mapRef });
      updateTextOverlay(timeline.p, timeline.tessAlpha, cLabelRef, cTitleRef);

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const c = ctxVisRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;
      const boxes = [
        { x: cx - 80, y: cy, name: "Alice", color: "#7B5EA7", fields: ["identity", "assets: 500 MOI", "trust: 0.94", "auth: scoped"] },
        { x: cx + 80, y: cy, name: "Bob", color: "#3A8F6E", fields: ["identity", "assets: 120 MOI", "trust: 0.87", "auth: scoped"] },
      ];
      for (const b of boxes) {
        ctx.strokeStyle = b.color + "60";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(b.x - 55, b.y - 58, 110, 116, 8);
        ctx.stroke();
        ctx.fillStyle = b.color + "15";
        ctx.beginPath();
        ctx.roundRect(b.x - 55, b.y - 58, 110, 116, 8);
        ctx.fill();
        ctx.fillStyle = b.color;
        ctx.font = '10px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(b.name, b.x, b.y - 40);
        ctx.fillStyle = "rgba(26,26,26,0.3)";
        ctx.font = '8px "DM Mono", monospace';
        b.fields.forEach((f, i) => ctx.fillText(f, b.x, b.y - 18 + i * 17));
      }
      const pulse = Math.sin(t * 2.5) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(123,94,167,${0.3 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(123,94,167,${0.2 * pulse})`;
      ctx.strokeStyle = `rgba(123,94,167,${0.5 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 8, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const c = kramaVisRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    const pA = { x: cx - 90, y: cy };
    const pB = { x: cx + 90, y: cy };
    const wCount = 5, wRadius = 65;
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;
      for (let i = 0; i < wCount; i++) {
        const a = (i / wCount) * Math.PI * 2 + t * 0.4;
        const wx = cx + Math.cos(a) * wRadius;
        const wy = cy + Math.sin(a) * wRadius * 0.7;
        ctx.strokeStyle = "rgba(123,94,167,0.12)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(wx, wy);
        ctx.stroke();
        const pulse = Math.sin(t * 3 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(123,94,167,${0.25 * pulse})`;
        ctx.strokeStyle = `rgba(123,94,167,${0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(26,26,26,0.18)";
        ctx.font = '7px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(`W${i + 1}`, wx, wy - 10);
      }
      for (const pp of [pA, pB]) {
        ctx.fillStyle = "rgba(26,26,26,0.6)";
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(26,26,26,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pA.x + 8, pA.y); ctx.lineTo(pB.x - 8, pB.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(26,26,26,0.4)";
      ctx.font = '9px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("Alice", pA.x, pA.y + 20);
      ctx.fillText("Bob", pB.x, pB.y + 20);
      const phase = Math.floor(t * 0.8) % 3;
      const labels = ["forming cluster...", "witnessing...", "\u2713 finalized"];
      const colors = ["rgba(26,26,26,0.3)", "rgba(123,94,167,0.5)", "rgba(39,174,96,0.6)"];
      ctx.fillStyle = colors[phase];
      ctx.fillText(labels[phase], cx, cy + wRadius * 0.7 + 28);
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const c = pisaVisRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    const objs = [
      { x: cx - 100, y: cy, label: "NFT-01", shape: "diamond" },
      { x: cx, y: cy, label: "500 MOI", shape: "circle" },
      { x: cx + 100, y: cy, label: "AUTH-K", shape: "hex" },
    ];
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;
      for (const o of objs) {
        const pulse = Math.sin(t * 2 + o.x * 0.05) * 0.15 + 0.85;
        ctx.strokeStyle = `rgba(123,94,167,${0.5 * pulse})`;
        ctx.fillStyle = `rgba(123,94,167,${0.06 * pulse})`;
        ctx.lineWidth = 1.5;
        if (o.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(o.x, o.y - 22); ctx.lineTo(o.x + 18, o.y);
          ctx.lineTo(o.x, o.y + 22); ctx.lineTo(o.x - 18, o.y);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (o.shape === "circle") {
          ctx.beginPath(); ctx.arc(o.x, o.y, 20, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = o.x + Math.cos(a) * 18, py = o.y + Math.sin(a) * 18;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = `rgba(123,94,167,${0.7 * pulse})`;
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(o.label, o.x, o.y + 36);
        ctx.fillStyle = "rgba(39,174,96,0.4)";
        ctx.font = '7px "DM Mono", monospace';
        ctx.fillText("linear \u2713", o.x, o.y + 48);
      }
      ctx.fillStyle = "rgba(26,26,26,0.15)";
      ctx.font = '8px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("Network Objects \u2014 native, owned, conserved", cx, cy - 50);
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const comp = comparisonRef.current;
    const oldEl = oldTpsRef.current;
    const newEl = newTpsRef.current;
    if (!comp || !oldEl || !newEl) return;
    const state = stateRef.current;
    let rafId;
    function tick() {
      const r = comp.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        state.oldC += 0.15;
        state.newC += 2.4;
        oldEl.textContent = Math.floor(state.oldC) + " tx/s";
        newEl.textContent = Math.floor(state.newC) + " tx/s";
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const c = compOldRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const cx2 = c.width / 2, cy2 = c.height / 2;
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < 6; i++) {
        const y = cy2 - 80 + i * 32;
        ctx.fillStyle = "rgba(192,57,43,0.05)";
        ctx.strokeStyle = "rgba(192,57,43,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx2 - 22, y - 10, 44, 20, 3);
        ctx.fill();
        ctx.stroke();
        if (i > 0) {
          ctx.strokeStyle = "rgba(192,57,43,0.1)";
          ctx.beginPath();
          ctx.moveTo(cx2, y - 32 + 10);
          ctx.lineTo(cx2, y - 10);
          ctx.stroke();
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const c = compNewRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const lanes = 4, sp = 48, sx = c.width / 2 - (lanes - 1) * sp / 2;
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      const t = Date.now() * 0.001;
      for (let l = 0; l < lanes; l++) {
        const lx = sx + l * sp;
        for (let i = 0; i < 4; i++) {
          const ny = 30 + i * 44;
          const pulse = Math.sin(t * 3 + l + i) > 0.3;
          ctx.fillStyle = pulse ? "rgba(123,94,167,0.25)" : "rgba(123,94,167,0.07)";
          ctx.strokeStyle = "rgba(123,94,167,0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(lx, ny, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (i > 0) {
            ctx.strokeStyle = "rgba(123,94,167,0.08)";
            ctx.beginPath();
            ctx.moveTo(lx, ny - 44 + 7);
            ctx.lineTo(lx, ny - 7);
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const panels = panelRefs.current.filter(Boolean);
    if (!panels.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".panel-text, .panel-vis").forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.15 }
    );
    panels.forEach((p) => obs.observe(p));
    return () => obs.disconnect();
  }, []);


  return (
    <>
      <style>{`
        
        .how-canvas-section { position: relative; height: 2000vh; margin-top: 72px; }
        .how-canvas-sticky { position: sticky; top: 72px; width: 100%; height: calc(100vh - 72px); background: #F5F3EE; }
        .how-canvas-overlay { position: sticky; top: 72px; height: calc(100vh - 72px); width: 100%;
          display: flex; flex-direction: column; padding: 48px;
          pointer-events: none; z-index: 2; margin-top: calc(-100vh + 72px);
          transition: justify-content 0.4s, align-items 0.4s; }
        .canvas-label { font-size: 10px; letter-spacing: 0.15em; color: #7B5EA7; text-transform: uppercase; margin-bottom: 10px; }
        .canvas-title { font-family: 'Instrument Serif', serif; font-size: clamp(24px, 3.5vw, 44px); line-height: 1.15; max-width: 520px;
          text-shadow: 0 0 30px #F5F3EE, 0 0 60px #F5F3EE, 0 0 90px #F5F3EE; }
        .canvas-cta-row { display: flex; gap: 16px; margin-top: 28px; opacity: 0; transition: opacity 0.6s; pointer-events: none; }
        .canvas-cta-row.visible { opacity: 1; pointer-events: auto; }
        .canvas-cta-primary { display: inline-flex; align-items: center; padding: 13px 32px;
          background: #1A1A1A; color: #F5F3EE; border-radius: 100px;
          font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          text-decoration: none; transition: background 0.3s, transform 0.2s; }
        .canvas-cta-primary:hover { background: #7B5EA7; transform: translateY(-1px); }
        .canvas-cta-secondary { display: inline-flex; align-items: center; padding: 13px 32px;
          background: transparent; color: #1A1A1A; border: 1px solid rgba(26,26,26,0.2); border-radius: 100px;
          font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          text-decoration: none; transition: all 0.3s; }
        .canvas-cta-secondary:hover { border-color: #7B5EA7; color: #7B5EA7; }
        .how-panel { min-height: 100vh; display: flex; align-items: center; padding: 120px 60px; position: relative; background: #F5F3EE; }
        .how-panel:nth-child(even) { background: rgba(26,26,26,0.02); }
        .how-panel-inner { max-width: 1100px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .panel-text, .panel-vis { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .panel-vis { transform: translateY(30px); transition-delay: 0.15s; }
        .panel-text.visible, .panel-vis.visible { opacity: 1; transform: translateY(0); }
        .panel-label { font-size: 10px; letter-spacing: 0.15em; color: #7B5EA7; text-transform: uppercase; margin-bottom: 16px; }
        .panel-title { font-family: 'Instrument Serif', serif; font-size: clamp(26px, 3vw, 40px); line-height: 1.15; margin-bottom: 24px; }
        .panel-body { font-size: 13px; line-height: 1.8; color: rgba(26,26,26,0.35); max-width: 420px; }
        .panel-body strong { color: #1A1A1A; font-weight: 400; }
        .vis-box { background: #F5F3EE; border: 1px solid rgba(26,26,26,0.06); border-radius: 16px; padding: 32px; min-height: 340px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .how-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(26,26,26,0.06); }
        .comp-side { background: #F5F3EE; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .comp-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
        .comp-label.old { color: #C0392B; }
        .comp-label.new { color: #7B5EA7; }
        .comp-title { font-family: 'Instrument Serif', serif; font-size: 26px; margin-bottom: 16px; }
        .comp-stat { font-size: 44px; font-family: 'Instrument Serif', serif; margin-bottom: 8px; }
        .comp-stat.old { color: #C0392B; }
        .comp-stat.new { color: #7B5EA7; }
        .comp-desc { font-size: 12px; color: rgba(26,26,26,0.35); line-height: 1.6; max-width: 280px; }
        .how-cta { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px 40px; background: #F5F3EE; }
        .how-cta h2 { font-family: 'Instrument Serif', serif; font-size: clamp(32px, 4.5vw, 56px); margin-bottom: 20px; }
        .how-cta p { font-size: 13px; color: rgba(26,26,26,0.35); margin-bottom: 32px; max-width: 380px; line-height: 1.7; }
        .cta-btn { border: 1px solid rgba(26,26,26,0.2); border-radius: 100px; padding: 14px 36px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.15em; color: #1A1A1A; background: transparent; cursor: pointer; transition: all 0.4s; text-decoration: none; }
        .cta-btn:hover { background: #1A1A1A; color: #F5F3EE; }
        @media (max-width: 768px) { .how-panel-inner { grid-template-columns: 1fr; gap: 40px; } .how-panel { padding: 80px 24px; } .how-comparison { grid-template-columns: 1fr; } }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-10 lg:px-16 h-[72px]"
        style={{ background: "#F5F3EE", borderBottom: "1px solid rgba(26,26,26,0.12)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-moi-mark.png" alt="MOI logo" className="h-12 w-12 shrink-0" />
          <span className="font-mono text-xs tracking-[0.35em] uppercase font-medium text-[#1A1A1A]">MOI</span>
        </Link>
        <div className="flex items-center gap-12">
          <a
            href="https://docs.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors duration-300"
            style={{ fontWeight: 500 }}
          >
            Docs
          </a>
          <span
            className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A] transition-colors duration-300"
            style={{ fontWeight: 500 }}
          >
            Why MOI?
          </span>
          <a
            href={WHITEPAPER_URL}
            className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors duration-300"
            style={{ fontWeight: 500 }}
          >
            Whitepaper
          </a>
        </div>
      </nav>

      <div ref={sectionRef} className="how-canvas-section" style={{ background: "#F5F3EE" }}>
        <canvas ref={sceneRef} id="scene" className="how-canvas-sticky" />
        <div className="how-canvas-overlay">
          <div>
            <div ref={cLabelRef} className="canvas-label" />
            <div ref={cTitleRef} className="canvas-title" />
            <div className="canvas-cta-row">
              <a href="https://docs.moi.technology" target="_blank" rel="noopener noreferrer" className="canvas-cta-primary">Explore the network</a>
              <a href="/MOILitePaper.pdf" className="canvas-cta-secondary">Read the whitepaper</a>
            </div>
          </div>
        </div>
      </div>

      <div ref={(el) => (panelRefs.current[0] = el)} className="how-panel" id="p-context">
        <div className="how-panel-inner">
          <div className="panel-text">
            <div className="panel-label">Context Superstates</div>
            <div className="panel-title">State lives with<br />the participant</div>
            <div className="panel-body">
              In traditional blockchains, your state is a number in a contract you don't control.
              <br /><br />
              In MOI, each participant owns a <strong>Context Superstate</strong> — their identity, assets, trust, and interaction history. Interactions commit only if both participants' contexts permit it.
              <br /><br />
              <strong>Your state. Your rules. Your context.</strong>
            </div>
          </div>
          <div className="panel-vis">
            <div className="vis-box">
              <canvas ref={ctxVisRef} width={400} height={300} />
            </div>
          </div>
        </div>
      </div>

      <div ref={(el) => (panelRefs.current[1] = el)} className="how-panel" id="p-krama">
        <div className="how-panel-inner">
          <div className="panel-vis">
            <div className="vis-box">
              <canvas ref={kramaVisRef} width={400} height={300} />
            </div>
          </div>
          <div className="panel-text">
            <div className="panel-label">KRAMA Consensus</div>
            <div className="panel-title">Agreement is local,<br />finality is immediate</div>
            <div className="panel-body">
              Traditional consensus asks every validator to agree on everything. That's like asking the entire city to approve your coffee purchase.
              <br /><br />
              <strong>KRAMA</strong> forms a small ephemeral witness cluster for each interaction. They verify, certify, and dissolve. Independent interactions finalize in parallel.
              <br /><br />
              <strong>We don't replicate and reconcile. We witness and certify.</strong>
            </div>
          </div>
        </div>
      </div>

      <div ref={(el) => (panelRefs.current[2] = el)} className="how-panel" id="p-pisa">
        <div className="how-panel-inner">
          <div className="panel-text">
            <div className="panel-label">PISA + COCO</div>
            <div className="panel-title">Assets are objects,<br />not data in contracts</div>
            <div className="panel-body">
              On other chains, your tokens are just a number in someone else's smart contract.
              <br /><br />
              MOI introduces <strong>Network Objects</strong> — native assets within participant contexts with protocol-guaranteed conservation. <strong>COCO</strong> enforces linearity at the language level. Re-entrancy isn't prevented — it's <strong>undefined</strong>.
              <br /><br />
              If it compiles, it's safe.
            </div>
          </div>
          <div className="panel-vis">
            <div className="vis-box">
              <canvas ref={pisaVisRef} width={400} height={300} />
            </div>
          </div>
        </div>
      </div>

      <div ref={comparisonRef} className="how-comparison" id="comparison">
        <div className="comp-side">
          <canvas ref={compOldRef} width={260} height={220} />
          <div className="comp-label old">TRADITIONAL BLOCKCHAIN</div>
          <div className="comp-title">Global Ordering</div>
          <div ref={oldTpsRef} className="comp-stat old">0 tx/s</div>
          <div className="comp-desc">Every transaction waits in a single global queue. Finality takes minutes.</div>
        </div>
        <div className="comp-side">
          <canvas ref={compNewRef} width={260} height={220} />
          <div className="comp-label new">MOI PARTICIPANT LAYER</div>
          <div className="comp-title">Participant Context</div>
          <div ref={newTpsRef} className="comp-stat new">0 tx/s</div>
          <div className="comp-desc">Interactions finalize independently in parallel. Immediate finality.</div>
        </div>
      </div>

      <div className="how-cta">
        <h2>Ready to build on<br />the Participant Layer?</h2>
        <p>Read the whitepaper, explore the docs, or start building with Cocolang.</p>
        <a href={WHITEPAPER_URL} className="cta-btn">READ WHITEPAPER &rarr;</a>
      </div>
    </>
  );
}
