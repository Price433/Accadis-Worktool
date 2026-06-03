"use client";
import { useRef } from "react";

// Leichter 3D-Tilt: Karte neigt sich zur Maus, mit Glanz-Highlight.
export default function Tilt({ children, max = 7, className = "" }: { children: React.ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg) translateZ(8px)`;
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  }
  function leave() {
    const el = ref.current; if (!el) return;
    el.style.transform = "rotateY(0) rotateX(0) translateZ(0)";
  }

  return (
    <div className="stage">
      <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={className}
        style={{ transition: "transform .2s cubic-bezier(.2,.7,.2,1)", willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
