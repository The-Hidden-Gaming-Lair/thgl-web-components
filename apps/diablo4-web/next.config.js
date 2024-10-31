/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => {
    return [
      {
        source: "/nodes/:mapName",
        headers: [
          {
            key: "Content-Encoding",
            value: "br",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/events",
        destination: "https://d4armory.io/api/events.json",
      },
    ];
  },
};

module.exports = nextConfig;
