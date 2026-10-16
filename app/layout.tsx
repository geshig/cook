import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/site";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SiteFooter } from "@/components/SiteFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { Analytics } from "@/components/Analytics";

const playfair = Playfair_Display({
  weight: ["500", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Кухнята на Геша — 101 високопротеинови рецепти с калории и макроси",
  alternates: { canonical: "./" },
  keywords: [
    "високопротеинови рецепти",
    "фит рецепти",
    "рецепти с макроси",
    "протеинови рецепти",
    "meal prep рецепти",
    "храна в кутии за работа",
    "здравословни рецепти",
    "рецепти с калории",
    "Кухнята на Геша",
  ],
  authors: [{ name: "Геша", url: "https://www.instagram.com/geshapov/" }],
  creator: "Геша",
  appleWebApp: { capable: true, title: "Кухнята", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "Кухнята на Геша",
    title: "Кухнята на Геша — 101 рецепти с макросите",
    description: "Високопротеинови рецепти със снимка, калории и макроси на всяка.",
  },
  description:
    "101 високопротеинови рецепти със снимка, калории и макроси на всяка. Избираш порциите, количествата се смятат сами.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bg" className={`${playfair.variable} ${manrope.variable}`}>
      <body>
        {children}
        <SiteFooter />
        <ServiceWorker />
        <RevealOnScroll />
        <Analytics />
      </body>
    </html>
  );
}
