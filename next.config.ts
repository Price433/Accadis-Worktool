import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs nicht bündeln (sonst bricht der pdf.worker-Pfad unter Turbopack)
  serverExternalPackages: ["pdf-parse"],
  // Seed-Daten ins Serverless-Bundle aufnehmen, damit loadSet sie auf Vercel lesen kann
  outputFileTracingIncludes: {
    "/api/**": ["./src/data/**"],
  },
};

export default nextConfig;
