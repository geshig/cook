import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Не си влязъл" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subscriber } = await admin
    .from("subscribers")
    .select("stripe_customer_id")
    .eq("email", user.email)
    .maybeSingle();

  if (!subscriber?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Няма Stripe клиент за този имейл" },
      { status: 404 }
    );
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: subscriber.stripe_customer_id,
    return_url: `${getSiteUrl()}/account`,
  });

  return NextResponse.json({ url: portalSession.url });
}
