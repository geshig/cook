/** Public site URL without trailing slash (safe to import anywhere). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Профилите в социалните мрежи. Празен линк = иконата не се показва.
 * Когато имаш YouTube, TikTok или Facebook, само попълни линка тук.
 */
export const SOCIALS: { id: "instagram" | "youtube" | "tiktok" | "facebook"; label: string; href: string }[] = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/geshapov/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@geshapov" },
  { id: "facebook", label: "Facebook", href: "" },
];

export const CONTACT_EMAIL = "hello@geshapov.com";

/**
 * Затворената общност в Skool. Описанието на лендинга се показва винаги;
 * бутонът „Влез в общността“ за купувачите излиза, когато url е попълнен.
 * Поканата при покупка идва автоматично през Zapier (Stripe → Skool).
 */
export const COMMUNITY = {
  name: "Общността в Skool",
  url: "https://www.skool.com/geshacooks-3584",
};
