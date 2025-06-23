/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "data.th.gl",
      },
    ],
  },
};

module.exports = nextConfig;
