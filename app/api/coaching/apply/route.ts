import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVITY, CONTACT_APPS, GOALS, HEALTH, HEALTH_DOCTOR, TRAIN_WHERE } from "@/lib/coaching";
import { sendCoachingApplied, sendCoachingNotify } from "@/lib/email";

/** /treniray form: saves the application and emails Gesha and the applicant. */

const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { n: 1, reset: now + 3600_000 });
    return false;
  }
  return ++h.n > 5;
}

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown, lo: number, hi: number) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};
const oneOf = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : null);

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Honeypot: bots fill every field.
  if (str(b.website)) return NextResponse.json({ ok: true });
  if (limited(ip)) return NextResponse.json({ error: "Твърде много опити. Пиши ми на hello@geshapov.com." }, { status: 429 });

  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const phone = str(b.phone, 40);
  if (name.length < 2) return NextResponse.json({ error: "Напиши името си." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Провери имейла." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "Напиши телефон, за да ти пиша." }, { status: 400 });
  if (b.agree !== true) return NextResponse.json({ error: "Отметни, че си прочел/а бележката за здравето." }, { status: 400 });

  const health = Array.isArray(b.health) ? b.health.filter((h): h is string => typeof h === "string" && HEALTH.includes(h)) : [];
  const row = {
    name,
    email,
    phone,
    // Discord: keep the username with it ("Discord (ime)").
    contact_app:
      oneOf(b.contact_app, CONTACT_APPS) === "Discord" && str(b.discord, 40)
        ? `Discord (${str(b.discord, 40)})`
        : oneOf(b.contact_app, CONTACT_APPS),
    goal: oneOf(b.goal, GOALS),
    sex: oneOf(b.sex, ["Жена", "Мъж"]),
    age: num(b.age, 16, 90),
    height_cm: num(b.height_cm, 130, 220),
    weight_kg: num(b.weight_kg, 35, 250),
    activity: oneOf(b.activity, ACTIVITY),
    train_where: oneOf(b.train_where, TRAIN_WHERE),
    train_days: num(b.train_days, 0, 7),
    dislikes: str(b.dislikes, 600) || null,
    tried: str(b.tried, 1000) || null,
    health,
    health_note: str(b.health_note, 600) || null,
    plan: oneOf(b.plan, ["month", "three"]),
  };

  const admin = createAdminClient();
  // Same email applied in the last day: keep one application.
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { data: dup } = await admin
    .from("coaching_applications")
    .select("id")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1);
  if (dup?.length) return NextResponse.json({ ok: true });

  const { data, error } = await admin.from("coaching_applications").insert(row).select("id").single();
  if (error || !data) {
    console.error("coaching apply failed:", error?.message);
    return NextResponse.json({ error: "Нещо се обърка. Пиши ми на hello@geshapov.com." }, { status: 500 });
  }

  const flagged = health.some((h) => HEALTH_DOCTOR.has(h));
  const rows: [string, string][] = [
    ["Име", name],
    ["Имейл", email],
    ["Телефон", `${phone}${row.contact_app ? ` (${row.contact_app})` : ""}`],
    ["Цел", row.goal ?? ""],
    ["Пол / години", [row.sex, row.age && `${row.age} г.`].filter(Boolean).join(", ")],
    ["Ръст / тегло", [row.height_cm && `${row.height_cm} см`, row.weight_kg && `${row.weight_kg} кг`].filter(Boolean).join(", ")],
    ["Движение", row.activity ?? ""],
    ["Тренировки", [row.train_where, row.train_days != null && `${row.train_days} пъти седмично`].filter(Boolean).join(", ")],
    ["Не яде", row.dislikes ?? ""],
    ["Пробвал/а досега", row.tried ?? ""],
    ["Здраве", health.length ? health.join(", ") : "нищо отметнато"],
    ["Бележка за здравето", row.health_note ?? ""],
    ["План", row.plan === "three" ? "3 месеца" : row.plan === "month" ? "Месечно" : "Не знае още"],
  ];
  await Promise.allSettled([
    sendCoachingApplied({ id: data.id, email, name }),
    sendCoachingNotify({ id: data.id, rows, flagged }),
  ]);
  return NextResponse.json({ ok: true });
}
