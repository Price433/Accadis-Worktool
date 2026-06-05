"use client";
import { useEffect, useState } from "react";

// Count-up-Animation für KPI-Zahlen (re-animiert bei Wertänderung, respektiert reduced-motion).
export default function CountUp({ to, dur = 1100, suffix = "" }: { to: number; dur?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setVal(to); return; }
    let raf = 0;
    const from = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + eased * (to - from)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setVal(to), dur + 400); // Endwert garantieren
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [to, dur]);
  return <>{val}{suffix}</>;
}
