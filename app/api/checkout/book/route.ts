import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";
import { prices } from "@/lib/price";

let productCache: { price: string; product: string } | null = null;
async function bookProduct(priceId: string): Promise<string> {
  if (productCache?.price === priceId) return productCache.product;
  const p = await getStripe().prices.retrieve(priceId);
  const product = typeof p.product === "string" ? p.product : p.product.id;
  productCache = { price: priceId, product };
  return product;
}

export async function POST(request: Request) {
  const forTwo = new URL(request.url).searchParams.get("for") === "2";
  const priceId = process.env.STRIPE_PRICE_BOOK?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_BOOK не е конфигуриран" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  const access = await getAccess();
  const now = prices();
  let session;
  try {
    // At the regular price use the Stripe price as is; during a promo charge
    // the promo amount on the same Stripe product (same name, image, receipt).
    const stripe = getStripe();
    const regular = now.book === 4700;
    const bookItem = regular
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "eur",
            unit_amount: now.book,
            product: await bookProduct(priceId),
          },
          quantity: 1,
        };
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Marks the charge as the book, so a full refund takes the book back
      // whatever the price was.
      payment_intent_data: { metadata: { kind: forTwo ? "book_for_two" : "book" } },
      ...(access.email ? { customer_email: access.email } : {}),
      line_items: [
        bookItem,
        ...(forTwo
          ? [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: now.forTwo - now.book,
                  product_data: {
                    name: "Втори достъп за приятел",
                    description: "Получаваш линк, който пращаш. Той влиза със своя имейл.",
                  },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      ...(forTwo ? { metadata: { kind: "book_for_two" } } : {}),
      success_url: `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      locale: "bg",
      // Always euro: no "pay in UAH/BGN…" currency switch (Stripe Adaptive Pricing).
      adaptive_pricing: { enabled: false },
      // Карти (Visa, Mastercard, Revolut и т.н.) и Revolut Pay; Apple Pay и Google Pay
      // идват с картите, ако са включени в Stripe → Settings → Payment methods.
      payment_method_types: ["card", "revolut_pay"],
      // Digital content: the buyer must expressly agree that access starts now
      // and that this waives the 14-day withdrawal right. Requires a Terms of
      // service URL in Stripe → Settings → Public details.
      // Note: consent_collection.promotions (and with it the abandoned-cart
      // reminder) is not available for a Bulgarian Stripe account — Stripe
      // rejects the session. Do not add it back.
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        submit: {
          message: forTwo
            ? "Веднага след плащането влизаш с този имейл, а линкът за втория човек идва в имейла ти. И двамата получавате и бонус: нови рецепти безплатно, активирате го в сайта."
            : "Вътре: 100+ рецепти с калориите, дневни менюта, калкулатор за калории и общност в Skool. Еднократно плащане. Веднага след него влизаш с този имейл, а бонуса с нови рецепти безплатно го активираш в сайта.",
        },
        terms_of_service_acceptance: {
          message: `Искам достъп веднага след плащането и приемам [Условията](${siteUrl}/usloviya).`,
        },
      },
      customer_creation: "always",
      // Stripe collects the email on the Checkout page; the webhook uses it
      // to upsert the subscribers row, and the buyer signs in with the same
      // email afterwards to unlock /recipes.
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

/**
 * Same as POST, but as a plain link: the buy button navigates here and gets a
 * 303 straight to Stripe. In-app browsers (TikTok, Instagram) sometimes drop a
 * redirect done from JavaScript after fetch and hide alert() errors, so a real
 * navigation is the reliable path.
 */
export async function GET(request: Request) {
  const res = await POST(request);
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (data.url) return NextResponse.redirect(data.url, 303);
  const msg = encodeURIComponent(data.error ?? "Плащането не можа да започне.");
  return NextResponse.redirect(`${getSiteUrl()}/?checkout=error&msg=${msg}#pricing`, 303);
}
