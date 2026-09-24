const { IMAGE_HOSTS } = require("./lib/imageHosts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Parallel dev servers (e.g. `NEXT_DIST_DIR=.next-crm next dev -p 3002`) need
  // separate build folders.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Other hosts (admin-pasted URLs) render unoptimized via components/ui/SmartImage.js.
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname }))
  },
  async redirects() {
    return [
      {
        source: "/musics/:slug",
        destination: "/albums/:slug",
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
