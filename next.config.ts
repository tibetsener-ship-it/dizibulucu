import type { NextConfig } from "next";
import crypto from "crypto";

// Her istek için benzersiz nonce üretir (CSP nonce desteği)
const generateNonce = () => crypto.randomBytes(16).toString("base64");

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },

  async headers() {
    const nonce = generateNonce();
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
              "connect-src 'self' https://api.themoviedb.org",
              "img-src 'self' https://image.tmdb.org data:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;