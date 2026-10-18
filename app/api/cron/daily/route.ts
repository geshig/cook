import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewRecipes, sendReviewRequest } from "@/lib/email";

export const maxDuration = 300;

const DAY = 86_400_000;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs once a day (vercel.json → crons). Vercel calls it with
 * "Authorization: Bearer $CRON_SECRET"; anyone else gets 401.
 *  1) 7 days after a purchase: „Какво сготви?“ (for real testimonials).
 *  2) Mondays: last week's new recipes to people with an active bonus/subscription.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
  const now = Date.now();
  let reviews = 0;
  let news = 0;

  // 1) Bought between 8 and 7 days ago (the cron runs daily, so once each).
  const { data: buyers } = await admin
    .from("subscribers")
    .select("email, book_purchased_at")
    .eq("purchased_book", true)
    .gte("book_purchased_at", new Date(now - 8 * DAY).toISOString())
    .lt("book_purchased_at", new Date(now - 7 * DAY).toISOString());
  for (const b of buyers ?? []) {
    const email = String(b.email).toLowerCase();
    if (admins.has(email)) continue;
    if (await sendReviewRequest(email)) reviews++;
    await pause(600);
  }

  // 2) Monday (Sofia time): new recipes from the last 7 days.
  const sofiaDay = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Sofia" });
  if (sofiaDay === "Mon") {
    const { data: recent } = await admin
      .from("recipes")
      .select("id, title, kcal, protein_g")
      .gte("created_at", new Date(now - 7 * DAY).toISOString())
      .order("created_at", { ascending: true });
    if (recent && recent.length) {
      const list = recent.map((r) => ({
        id: r.id as number,
        title: r.title as string,
        kcal: (r.kcal as number | null) ?? null,
        proteinG: (r.protein_g as number | null) ?? null,
      }));
      const { data: subs } = await admin.from("subscribers").select("email").eq("subscription_status", "active");
      const weekKey = new Date(now).toISOString().slice(0, 10);
      for (const s of subs ?? []) {
        const email = String(s.email).toLowerCase();
        if (admins.has(email)) continue;
        if (await sendNewRecipes(email, list, weekKey)) news++;
        await pause(600);
      }
    }
  }

  return NextResponse.json({ ok: true, reviews, news });
}
