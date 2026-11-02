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
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61594416230071" },
];

export const CONTACT_EMAIL = "hello@geshapov.com";

/**
 * Затворената група във Facebook за хората с книгата (замени Skool).
 * Линкът излиза в имейла за достъп, в профила и в /recipes.
 * Докато url е празен, бутоните са скрити.
 */
export const COMMUNITY = {
  name: "Групата във Facebook",
  url: "https://www.facebook.com/groups/3758671370957707/",
};
