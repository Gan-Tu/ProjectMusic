/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["pm-vue.projctone.com"]
  }
};

module.exports = nextConfig;
