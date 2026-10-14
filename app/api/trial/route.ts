import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { startFreeTrial } from "@/lib/trial";

/** One click, no card: starts the book's 3 free months for owners who don't have them yet. */
export async function POST() {
  const access = await getAccess();
  if (!access.email) return NextResponse.json({ error: "Влез, за да активираш бонуса." }, { status: 401 });
  if (!access.purchasedBook) return NextResponse.json({ error: "Бонусът е за купилите книгата." }, { status: 403 });
  // Already started (e.g. automatically right after purchase): just refresh the page.
  if (access.hadSubscription) return NextResponse.json({ ok: true, already: true });

  const admin = createAdminClient();
  const stripe = getStripe();
  const { data: row } = await admin
    .from("subscribers")
    .select("stripe_customer_id")
    .eq("email", access.email.toLowerCase())
    .maybeSingle();

  let customerId = row?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: access.email });
    customerId = customer.id;
  }

  try {
    const r = await startFreeTrial(stripe, admin, {
      email: access.email.toLowerCase(),
      customerId,
      idempotencyKey: `book-bonus-manual-${access.email.toLowerCase()}`,
    });
    if (!r.ok) return NextResponse.json({ error: "Не успяхме да активираме бонуса. Опитай пак." }, { status: 500 });
    return NextResponse.json({ ok: true, trialEnd: r.trialEnd });
  } catch {
    return NextResponse.json({ error: "Не успяхме да активираме бонуса. Опитай пак." }, { status: 502 });
  }
}
