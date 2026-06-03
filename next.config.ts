import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs nicht bündeln (sonst bricht der pdf.worker-Pfad unter Turbopack)
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
