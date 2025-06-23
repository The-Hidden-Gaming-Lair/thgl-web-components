export type NitroAdOptions = any;
export type UserDataEncoding = "PLAIN" | "SHA-1" | "SHA-256";

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
  queue: ([string, any, (value: unknown) => void] | [string, any])[];
  loaded: boolean;
  siteId: number;
}

interface MyWindow extends Window {
  nitroAds: NitroAds;
}
declare let window: MyWindow;

export function getNitroAds(): NitroAds {
  return window.nitroAds;
}
