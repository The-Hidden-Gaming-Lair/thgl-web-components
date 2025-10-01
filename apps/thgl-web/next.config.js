/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/ads.txt",
        destination: "https://api.nitropay.com/v1/ads-1487.txt",
        permanent: true,
      },
      {
        source: "/support-me/patreon",
        destination: `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env.PATREON_CLIENT_ID}&redirect_uri=${process.env.PATREON_REDIRECT_URL}`,
        permanent: false,
      },
      {
        source: "/discord",
        destination:
          "https://discord.com/invite/the-hidden-gaming-lair-320539672663031818",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.th.gl",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  headers: async () => {
    return [
      {
        source: "/global_icons/:fileName*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
