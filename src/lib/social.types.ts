export type SocialLink = {
  id: string;
  network: string;
  label: string;
  url: string;
  handle: string | null;
  icon_key: string;
  is_visible: boolean;
  sort_order: number;
};

export type SocialLinkInput = {
  id?: string;
  network: string;
  label: string;
  url: string;
  handle?: string | null;
  icon_key: string;
  is_visible: boolean;
  sort_order: number;
};

export const ICON_KEYS = [
  "linkedin",
  "twitter",
  "youtube",
  "instagram",
  "facebook",
  "github",
  "link",
] as const;
