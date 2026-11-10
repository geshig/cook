import { NextResponse } from "next/server";
import { sendCoachingRequest, sendCoachingThanks, type CoachingRequest } from "@/lib/email";
import { COACH_DAYS, COACH_EXPERIENCE, COACH_FORMATS, COACH_GOALS } from "@/lib/coaching";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A few requests per IP per hour is plenty for a real person; stops form spam.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v: unknown, list: readonly string[]) => {
  const s = str(v, 60);
  return list.includes(s) ? s : "";
};
const num = (v: unknown, min: number, max: number) => {
  const n = Number(str(v, 6).replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? String(Math.round(n)) : "";
};

/** /trenirai-s-men → email to hello@ + a short "got it" email to the person. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
  }

  // Honeypot: real people never see or fill this field.
  if (str(body.website, 100)) return NextResponse.json({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Твърде много опити. Опитай пак след малко." }, { status: 429 });
  }

  const r: CoachingRequest = {
    name: str(body.name, 80),
    email: str(body.email, 120).toLowerCase(),
    contact: str(body.contact, 80),
    format: pick(body.format, COACH_FORMATS),
    goal: pick(body.goal, COACH_GOALS),
    age: num(body.age, 14, 99),
    height: num(body.height, 120, 230),
    weight: num(body.weight, 35, 250),
    experience: pick(body.experience, COACH_EXPERIENCE),
    days: pick(body.days, COACH_DAYS),
    health: str(body.health, 800),
    message: str(body.message, 1500),
  };

  if (!r.name || !EMAIL_RE.test(r.email) || !r.format || !r.goal) {
    return NextResponse.json({ error: "Попълни име, имейл, как искаш да тренираш и целта си." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Отбележи съгласието, за да мога да ти пиша." }, { status: 400 });
  }

  const ok = await sendCoachingRequest(r);
  if (!ok) {
    return NextResponse.json(
      { error: "Не успях да изпратя заявката. Пиши ми на hello@geshapov.com." },
      { status: 500 }
    );
  }
  await sendCoachingThanks(r.email, r.name);
  return NextResponse.json({ ok: true });
}
