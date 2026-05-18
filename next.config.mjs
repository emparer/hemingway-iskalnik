/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.ors.si" },
      { protocol: "https", hostname: "ors.si" },
      { protocol: "https", hostname: "api.bookinitsystem.com" },
      { protocol: "https", hostname: "iskalnik.hemingway.si" }
    ]
  }
};

export default nextConfig;
