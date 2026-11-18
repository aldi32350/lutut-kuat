import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { SESSION_COOKIE } from "@/lib/auth/local";

export const runtime = "nodejs";

export async function POST() {
  if (config.authMode === "local") {
    cookies().delete(SESSION_COOKIE);
  } else {
    const { supabaseServer } = await import("@/lib/supabase/server");
    await supabaseServer().auth.signOut();
  }
  return Response.json({ ok: true });
}
