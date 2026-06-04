"use client";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Torus, Icosahedron } from "@react-three/drei";
import { Suspense } from "react";

// Minimalistischer, monochromer 3D-Akzent in accadis-Blau.
function Scene() {
  return (
    <group>
      <Float speed={1.1} rotationIntensity={0.5} floatIntensity={0.9}>
        {/* Kern: ruhige, leicht verzerrte Kugel in accadis-Blau */}
        <mesh>
          <sphereGeometry args={[1.2, 96, 96]} />
          <MeshDistortMaterial color="#004c93" roughness={0.35} metalness={0.4} distort={0.22} speed={1.2} />
        </mesh>
        {/* feines Drahtgitter darüber = „smart/tech“ */}
        <Icosahedron args={[1.55, 2]}>
          <meshBasicMaterial color="#7d9fce" wireframe transparent opacity={0.22} />
        </Icosahedron>
      </Float>

      {/* ein einzelner, dezenter Ring */}
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.3}>
        <Torus args={[2.25, 0.008, 16, 140]} rotation={[Math.PI / 2.3, 0.25, 0]}>
          <meshBasicMaterial color="#004c93" transparent opacity={0.5} />
        </Torus>
      </Float>

      <Sparkles count={36} scale={6} size={1.6} speed={0.3} color="#5b82bb" opacity={0.5} />
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0, 6], fov: 42 }} gl={{ antialias: true, alpha: true }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <pointLight position={[-4, -2, -3]} intensity={1.4} color="#3a6fb0" />
      <Suspense fallback={null}><Scene /></Suspense>
    </Canvas>
  );
}
