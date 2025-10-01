export type Partner = {
  name: string;
  avatar: string; // URL to avatar
  links: {
    label: string;
    url: string;
  }[];
  bio?: string;
};

export const partners: Partner[] = [
  {
    name: "Karolinger",
    avatar: "/partners/karolinger.webp",
    links: [
      {
        label: "karolinger",
        url: "https://www.twitch.tv/karolinger",
      },
      {
        label: "@MrKarolinge",
        url: "https://www.youtube.com/@MrKarolinger",
      },
      {
        label: "@DieLoge",
        url: "https://www.youtube.com/@DieLoge",
      },
    ],
    bio: "Streams Dune Awakening & uses the maps live!",
  },
  {
    name: "Oehrchen",
    avatar: "/partners/oehrchen.webp",
    links: [
      {
        label: "oehrchen",
        url: "https://twitch.tv/oehrchen",
      },
      {
        label: "@OehrchenTV",
        url: "https://youtube.com/@OehrchenTV",
      },
    ],
    bio: "Chilled gameplay, tutorials and reviews!",
  },
];
