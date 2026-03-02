import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Proje YKS-Panel klasöründeyse; birden fazla lockfile uyarısını gidermek için
  outputFileTracingRoot: path.join(process.cwd()),
};

export default nextConfig;
