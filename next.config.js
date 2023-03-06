/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "pm-vue.projctone.com",
      "s3.amazonaws.com",
      "images.unsplash.com",
      "picsum.photos",
      "i.scdn.co",
      "assets.audiomack.com"
    ]
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/albums",
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
