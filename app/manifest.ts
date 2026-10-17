import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Кухнята на Геша",
    short_name: "Кухнята",
    description: "100+ високопротеинови рецепти със снимка, калории и макроси на всяка.",
    start_url: "/recipes",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#faf6ee",
    lang: "bg",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
