import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,

  // Trailing slashes off keeps URLs matching the old .html routes' canonical form.
  trailingSlash: false,

  images: {
    // Template photography is all local (public/images), so no remotePatterns needed.
    // AVIF first, WebP fallback — meaningful on an image-heavy barbershop site.
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Template fonts are content-hashed by filename and never change.
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
