import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  // 303 so the browser follows with GET; also drop offline copies of recipes.
  const res = NextResponse.redirect(new URL("/", request.url), 303);
  res.headers.set("Clear-Site-Data", '"cache"');
  return res;
}
