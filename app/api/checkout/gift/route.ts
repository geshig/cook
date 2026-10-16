import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";
import { GIFT_PRICE_CENTS } from "@/lib/gifts";

/** Book owners buy a second access (27 €) for a friend; they get a gift link. */
export async function POST() {
  const access = await getAccess();
  if (!access.email) return NextResponse.json({ error: "Влез, за да подариш книгата." }, { status: 401 });
  if (!access.purchasedBook) {
    return NextResponse.json({ error: "Подаръкът за 27 € е за хората, които вече имат книгата." }, { status: 403 });
  }

  const siteUrl = getSiteUrl();
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: access.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: GIFT_PRICE_CENTS,
            product_data: {
              name: "Кухнята на Геша — подарък за приятел",
              description: "Достъп до 101-те рецепти за един човек, с негов имейл. Получаваш линк, който му пращаш.",
            },
          },
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 5 },
        },
      ],
      metadata: { kind: "gift" },
      success_url: `${siteUrl}/account?gift=success`,
      cancel_url: `${siteUrl}/account`,
      locale: "bg",
      payment_method_types: ["card", "revolut_pay"],
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: { message: `Съгласен съм с [Условията](${siteUrl}/usloviya).` },
      },
    });
    if (!session.url) throw new Error("no url");
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("gift checkout failed:", msg);
    return NextResponse.json({ error: `Плащането не можа да започне: ${msg}` }, { status: 502 });
  }
}
