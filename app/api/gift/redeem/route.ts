import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { startFreeTrial } from "@/lib/trial";

/** The friend, signed in with their own email, turns a gift code into the book. */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!access.email) return NextResponse.json({ error: "Влез с твоя имейл, за да вземеш подаръка." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code)) return NextResponse.json({ error: "Невалиден код." }, { status: 400 });
  if (access.purchasedBook) {
    return NextResponse.json(
      { error: "Ти вече имаш книгата. Пази кода за някой друг, той още е валиден.", owned: true },
      { status: 409 }
    );
  }

  const email = access.email.toLowerCase();
  const admin = createAdminClient();

  // Claim the code atomically: only an unused one gets updated.
  const { data: claimed, error } = await admin
    .from("gift_codes")
    .update({ redeemed_by: email, redeemed_at: new Date().toISOString() })
    .eq("code", code)
    .is("redeemed_by", null)
    .select("code")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Нещо се обърка. Опитай пак." }, { status: 500 });
  if (!claimed) return NextResponse.json({ error: "Този подарък вече е използван или не съществува." }, { status: 410 });

  const { error: upErr } = await admin
    .from("subscribers")
    .upsert({ email, purchased_book: true }, { onConflict: "email" });
  if (upErr) {
    // Give the code back so it isn't lost.
    await admin.from("gift_codes").update({ redeemed_by: null, redeemed_at: null }).eq("code", code);
    return NextResponse.json({ error: "Нещо се обърка. Опитай пак." }, { status: 500 });
  }
  await admin.from("subscribers").update({ book_purchased_at: new Date().toISOString() }).eq("email", email).is("book_purchased_at", null);

  // Same bonus as a buyer: 3 months of new recipes, no card. Best-effort.
  try {
    const { data: row } = await admin
      .from("subscribers")
      .select("stripe_customer_id, subscription_status")
      .eq("email", email)
      .maybeSingle();
    if (!row?.subscription_status || row.subscription_status === "inactive") {
      const stripe = getStripe();
      let customerId = row?.stripe_customer_id as string | null | undefined;
      if (!customerId) customerId = (await stripe.customers.create({ email })).id;
      await startFreeTrial(stripe, admin, { email, customerId, idempotencyKey: `gift-bonus-${code}` });
    }
  } catch (e) {
    console.error("gift trial failed:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
