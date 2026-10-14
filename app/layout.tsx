import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Кухнята на Геша — рецепти с макроси",
  description:
    "101 високопротеинови рецепти със снимка, калории и макроси на всяка. Избираш порциите, количествата се смятат сами.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bg" className={`${playfair.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
