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
  async redirects() {
    return [
      {
        source: "/:lang/rummage-pile",
        destination: "/rummage-pile",
        permanent: true,
      },
      {
        source: "/:lang/leaderboard",
        destination: "/leaderboard",
        permanent: true,
      },
      {
        source: "/:lang/Kilima%20Valley",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:lang/Bahari%20Bay",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:lang/Fairgrounds",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:lang/Housing",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:lang/download",
        destination: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
