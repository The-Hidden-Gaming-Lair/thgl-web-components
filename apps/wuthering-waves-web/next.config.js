/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/events",
        destination: "https://d4armory.io/api/events/recent",
      },
    ];
  },
};

module.exports = nextConfig;
