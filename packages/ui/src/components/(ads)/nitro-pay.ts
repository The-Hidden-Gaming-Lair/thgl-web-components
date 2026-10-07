import { reportAdRender } from "./ad-fill";
import { IS_DEMO_MODE } from "./constants";

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

// NitroPay's `demo` option no longer renders anything for th.gl: the site
// runs "Scalibur Full" (every unit is served from an isolated Scalibur
// iframe), and that path skips the prebid demo bids the old placeholder
// creatives came from. On localhost the slots draw their own placeholder at
// the size NitroPay would pick, so layouts stay checkable.
function renderDemoAd(id: string, options: NitroAdOptions): void {
  const holder = document.getElementById(id);
  if (!holder) return;
  if (options.mediaQuery && !window.matchMedia(options.mediaQuery).matches) {
    return;
  }
  // localStorage DEMO_ADS_NOFILL=true: every slot reports a no-fill, so the
  // house ads (house-ad.tsx) show instead.
  let noFill = false;
  try {
    noFill = localStorage.getItem("DEMO_ADS_NOFILL") === "true";
  } catch {
    // Storage blocked: draw the demo placeholder.
  }
  if (noFill) {
    holder.replaceChildren();
    reportAdRender(id, true);
    return;
  }
  const sizes = (options.sizes ?? []).map(([w, h]) => [Number(w), Number(h)]);
  // Largest size that fits the holder, like NitroPay picks among `sizes`.
  const fitting = sizes.filter(
    ([w, h]) =>
      (!holder.clientWidth || w <= holder.clientWidth) &&
      (!holder.clientHeight || h <= holder.clientHeight),
  );
  const size = (fitting.length ? fitting : sizes).sort(
    (a, b) => b[0] * b[1] - a[0] * a[1],
  )[0];
  const label = size ? `${size[0]}x${size[1]}` : (options.format ?? "ad");

  // Replaces any earlier placeholder: React StrictMode runs the createAd
  // effects twice in dev.
  holder.replaceChildren();
  const box = document.createElement("div");
  box.dataset.demoAd = id;
  Object.assign(box.style, {
    width: size ? `${size[0]}px` : "100%",
    height: size ? `${size[1]}px` : "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    border: "1px dashed #f59e0b",
    background:
      "repeating-linear-gradient(45deg, #f59e0b14 0 10px, transparent 10px 20px)",
    color: "#f59e0b",
    font: "12px/1.2 ui-monospace, monospace",
    overflow: "hidden",
  });
  const title = document.createElement("strong");
  title.textContent = `Demo ad ${label}`;
  const unit = document.createElement("span");
  unit.textContent = id;
  box.append(title, unit);
  holder.append(box);
}

const demoNitroAds = (nitroAds: NitroAds): NitroAds =>
  new Proxy(nitroAds, {
    get(target, prop, receiver) {
      if (prop !== "createAd") return Reflect.get(target, prop, receiver);
      return (id: string, options: NitroAdOptions) => {
        renderDemoAd(id, options);
        return Promise.resolve([]);
      };
    },
  });

export function getNitroAds(): NitroAds {
  const nitroAds = window.nitroAds;
  if (nitroAds && IS_DEMO_MODE) {
    return demoNitroAds(nitroAds);
  }
  // Website pages shown inside the companion app (app-surface-root.tsx) keep
  // their ad slots but report as app inventory: platform "thgl-app" (the
  // primary web/app discriminator in NitroPay reporting), view "content".
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
