/** Simple line icons for the footer (24×24, currentColor). */
export function SocialIcon({ id }: { id: "instagram" | "youtube" | "tiktok" | "facebook" | "email" }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (id) {
    case "instagram":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...p}>
          <rect x="2.5" y="5" width="19" height="14" rx="4" />
          <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...p}>
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...p}>
          <path d="M14.5 8H17V4.5h-2.5A3.5 3.5 0 0 0 11 8v2.5H8.5V14H11v7h3.5v-7H17l.5-3.5h-3V8.6c0-.3.2-.6.5-.6z" />
        </svg>
      );
    case "email":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
  }
}
