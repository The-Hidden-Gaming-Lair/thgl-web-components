export type UserDataEncoding = "PLAIN" | "SHA-1" | "SHA-256";

/**
 * NitroPay Ad Options
 * Based on NitroPay API documentation and observed usage patterns
 */
export interface NitroAdOptions {
  /** Custom targeting values for filtering in reporting (e.g., { game: "dune-awakening" }) */
  targeting?: Record<string, string>;
  /** Ad refresh time in seconds */
  refreshTime?: number;
  /** Only render when visible in viewport */
  renderVisibleOnly?: boolean;
  /** Ad size options as [width, height] tuples */
  sizes?: string[][];
  /** Ad format (e.g., "video-nc", "floating") */
  format?: string;
  /** Media query for responsive ads */
  mediaQuery?: string;
  /** Demo mode for testing */
  demo?: boolean;
  /** Debug level: "silent" | "info" | "debug" */
  debug?: "silent" | "info" | "debug";
  /** Report button configuration */
  report?: {
    enabled: boolean;
    icon: boolean;
    wording: string;
    position: string;
  };
  /** Video ad configuration */
  video?: {
    mobile: string;
    interval: number;
  };
  /** Outstream video behavior */
  outstream?: "never" | "always" | "auto";
  /** Bidders to skip */
  skipBidders?: string[];
}

export interface NitroAd {
  new (id: string, options: NitroAdOptions): NitroAd;
  id: string;
  options: NitroAdOptions;
  onNavigate: () => void;
  renderContainers: () => boolean;
}

export interface NitroAds {
  createAd: (
    id: string,
    options: NitroAdOptions,
  ) => NitroAd | Promise<NitroAd> | Promise<NitroAd[]>;
  stop: () => void;
  addUserToken: (email: string, encoding?: UserDataEncoding) => Promise<void>;
  clearUserTokens: () => void;
  blocklist: string[];
  queue: ([string, any, (value: unknown) => void] | [string, any])[];
  loaded: boolean;
  geo: string;
  version: string;
  siteId: number;
}

interface MyWindow extends Window {
  nitroAds: NitroAds;
}
declare let window: MyWindow;

export function getNitroAds(): NitroAds {
  // Website pages shown inside the companion app (app-surface-root.tsx) keep
  // their ad slots but report as app inventory: platform "thgl-app" (the
  // primary web/app discriminator in NitroPay reporting), view "content".
  const nitroAds = window.nitroAds;
  if (nitroAds && document.documentElement.dataset.thglSurface === "app") {
    return new Proxy(nitroAds, {
      get(target, prop, receiver) {
        if (prop !== "createAd") return Reflect.get(target, prop, receiver);
        return (id: string, options: NitroAdOptions) =>
          target.createAd(id, {
            ...options,
            targeting: {
              ...options.targeting,
              platform: "thgl-app",
              view: "content",
            },
          });
      },
    });
  }
  return nitroAds;
}
