/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      "s3.amazonaws.com",
      "images.unsplash.com",
      "picsum.photos",
      "fastly.picsum.photos",
      "i.scdn.co",
      "assets.audiomack.com"
    ].map((hostname) => ({ protocol: "https", hostname }))
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
