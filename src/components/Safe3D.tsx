"use client";
import React from "react";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false, loading: () => null });

// Fängt ChunkLoad-/WebGL-Fehler ab → zeigt einen dezenten Glow statt Crash.
class Boundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function Safe3D() {
  const fallback = (
    <div style={{ width: "100%", height: "100%", borderRadius: "50%",
      background: "radial-gradient(circle at 60% 40%, #2b7fff 0%, #004c93 55%, transparent 72%)",
      filter: "blur(2px)", opacity: 0.85 }} />
  );
  return <Boundary fallback={fallback}><Hero3D /></Boundary>;
}
