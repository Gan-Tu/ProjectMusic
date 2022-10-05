/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["pm-vue.projctone.com", "s3.amazonaws.com", "images.unsplash.com"]
  }
};

module.exports = nextConfig;
