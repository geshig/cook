import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";
import { COACHING, type CoachingPlan } from "@/lib/coaching";
import { bookCredit, getApplication, spotsLeft } from "@/lib/coachingDb";

/**
 * The payment link from the "approved" email: /api/coaching/pay?t=<token>&plan=month|three.
 * A plain GET that redirects to Stripe, so it works from any mail app or in-app browser.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const site = getSiteUrl();
  const token = url.searchParams.get("t") ?? "";
  const plan: CoachingPlan = url.searchParams.get("plan") === "month" ? "month" : "three";
  const back = (q: string) => NextResponse.redirect(`${site}/treniray?${q}`, 303);

  if (!/^[a-f0-9]{32}$/.test(token)) return back("link=bad");
  const app = await getApplication({ token }).catch(() => null);
  if (!app) return back("link=bad");
  if (app.status === "paid") return back("paid=1");
  if (app.status !== "approved") return back("link=bad");
  if ((await spotsLeft()) <= 0) return back("full=1");

  const meta = { kind: "coaching", app: app.id, plan };
  // Already has the book: its price comes off the first payment.
  const credit = await bookCredit(app.email);
  let discounts: Stripe.Checkout.SessionCreateParams["discounts"];
  if (credit > 0) {
    try {
      const coupon = await getStripe().coupons.create({
        amount_off: credit,
        currency: "eur",
        duration: "once",
        max_redemptions: 1,
        name: "Връщам ти парите за книгата",
      });
      discounts = [{ coupon: coupon.id }];
    } catch (e) {
      console.error("coaching book coupon failed:", e instanceof Error ? e.message : e);
    }
  }
  const common: Stripe.Checkout.SessionCreateParams = {
    customer_email: app.email,
    client_reference_id: app.id,
    metadata: meta,
    ...(discounts ? { discounts } : {}),
    success_url: `${site}/treniray?paid=1`,
    cancel_url: `${site}/treniray?link=cancel`,
    locale: "bg",
    adaptive_pricing: { enabled: false },
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: { message: `Приемам [Условията](${site}/usloviya).` },
    },
  };

  try {
    const session = await getStripe().checkout.sessions.create(
      plan === "month"
        ? {
            ...common,
            mode: "subscription",
            line_items: [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: COACHING.month,
                  recurring: { interval: "month" },
                  product_data: { name: `${COACHING.product} — месечно` },
                },
                quantity: 1,
              },
            ],
            subscription_data: { metadata: meta, description: "Спираш по всяко време с едно съобщение до Геша." },
          }
        : {
            ...common,
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: COACHING.three,
                  product_data: {
                    name: `${COACHING.product} — 3 месеца`,
                    description: "Личен план за хранене и тренировки, седмична проверка, лична връзка с Геша и книгата „Кухнята на Геша“.",
                  },
                },
                quantity: 1,
              },
            ],
            payment_intent_data: { metadata: meta },
          }
    );
    if (!session.url) throw new Error("no url");
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("coaching checkout failed:", e instanceof Error ? e.message : e);
    return back("link=error");
  }
}
