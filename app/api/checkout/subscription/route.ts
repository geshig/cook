import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { bonusDaysFor } from "@/lib/launch";

function bgDate(d: Date) {
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_SUBSCRIPTION?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_SUBSCRIPTION не е конфигуриран" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  const access = await getAccess();
  // The book's bonus is claimed here, after the purchase: book owners who
  // never had a subscription get it free (3 months for the first 100 buyers,
  // else 1), with the price after it shown right on this page. The card is
  // charged only after the free period, unless they stop it before.
  const trial = !!access.email && access.purchasedBook && !access.hadSubscription;
  const days = trial ? await bonusDaysFor(createAdminClient(), access.email!) : 0;
  const freeUntil = bgDate(new Date(Date.now() + days * 86400000));
  // Same Stripe customer as the book, so refunds and "Профил" see one person.
  let customerId: string | null = null;
  if (access.email) {
    const { data: row } = await createAdminClient()
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("email", access.email.toLowerCase())
      .maybeSingle();
    customerId = (row?.stripe_customer_id as string | null) ?? null;
  }
  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      ...(customerId ? { customer: customerId } : access.email ? { customer_email: access.email } : {}),
      ...(trial
        ? {
            subscription_data: {
              trial_period_days: days,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
              metadata: { kind: "book_bonus" },
            },
          }
        : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: trial
        ? `${siteUrl}/recipes?bonus=active`
        : `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: trial ? `${siteUrl}/recipes` : `${siteUrl}/?checkout=cancelled`,
      adaptive_pricing: { enabled: false },
      locale: "bg",
      // Cards only (Visa, Mastercard, Revolut и т.н.); Apple Pay и Google Pay
      // идват с картите, ако са включени в Stripe → Settings → Payment methods.
      payment_method_types: ["card"],
      // Digital content: the buyer must expressly agree that access starts now
      // and that this waives the 14-day withdrawal right. Requires a Terms of
      // service URL in Stripe → Settings → Public details.
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        ...(trial
          ? {
              submit: {
                message: `Днес плащаш 0 €. Новите рецепти са безплатни до ${freeUntil}. След това абонаментът продължава за 5,99 € на месец с тази карта, докато не го спреш от „Профил“. Спреш ли го преди ${freeUntil}, не плащаш нищо. Ще ти напомня по имейл 7 дни преди първото плащане.`,
              },
            }
          : {}),
        terms_of_service_acceptance: {
          message: `Съгласен съм с [Условията](${siteUrl}/usloviya).`,
        },
      },
    });
  } catch (e) {
    // Surface Stripe's reason instead of a blank 500, so problems are visible.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("checkout session failed:", msg);
    return NextResponse.json(
      { error: `Плащането не можа да започне: ${msg}` },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Неуспешно създаване на Checkout сесия" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
