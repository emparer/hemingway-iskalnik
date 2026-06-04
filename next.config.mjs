/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.ors.si" },
      { protocol: "https", hostname: "ors.si" },
      { protocol: "https", hostname: "api.bookinitsystem.com" },
      { protocol: "https", hostname: "iskalnik.hemingway.si" }
    ]
  },
  async headers() {
    const frameAncestors =
      process.env.EMBED_FRAME_ANCESTORS?.split(/[\s,]+/)
        .map(entry => entry.trim())
        .filter(Boolean)
        .join(" ") || "*";

    return [
      {
        source: "/embed/search",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
