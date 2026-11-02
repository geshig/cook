import "server-only";
import { createAdminClient } from "./supabase/admin";

export type SentEmail = { to: string; subject: string; at: string; status: string | null };

/**
 * Admin → Имейли: the last emails the site sent. First from Resend itself
 * (it also knows if the email was delivered, opened or bounced); if that list
 * is not available, from our own email_log table.
 */
export async function recentEmails(limit = 100): Promise<{ source: "resend" | "log" | "none"; rows: SentEmail[] }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    try {
      const res = await fetch(`https://api.resend.com/emails?limit=${limit}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as {
          data?: { to?: string[] | string; subject?: string; created_at?: string; last_event?: string }[];
        };
        if (Array.isArray(body.data)) {
          return {
            source: "resend",
            rows: body.data.map((e) => ({
              to: Array.isArray(e.to) ? e.to.join(", ") : String(e.to ?? ""),
              subject: e.subject ?? "",
              at: e.created_at ?? "",
              status: e.last_event ?? null,
            })),
          };
        }
      }
    } catch {}
  }
  try {
    const { data, error } = await createAdminClient()
      .from("email_log")
      .select("to_email, subject, ok, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) {
      return {
        source: "log",
        rows: data.map((r) => ({
          to: r.to_email as string,
          subject: (r.subject as string) ?? "",
          at: r.created_at as string,
          status: r.ok ? "sent" : "failed",
        })),
      };
    }
  } catch {}
  return { source: "none", rows: [] };
}
