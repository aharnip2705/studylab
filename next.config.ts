import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Proje YKS-Panel klasöründeyse; birden fazla lockfile uyarısını gidermek için
  outputFileTracingRoot: path.join(process.cwd()),

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 1. XSS Koruması
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https:",
              "media-src 'self' blob: https:",
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://*.youtube.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // 2. Clickjacking Koruması
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 3. MIME Sniffing Koruması
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 4. Referrer Policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 5. Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS (HTTPS zorunluluğu)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
