import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/galeri", "/akun", "/admin", "/bayar"];
const SUPABASE = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  let loggedIn = false;

  if (SUPABASE) {
    // Perbarui sesi Supabase di setiap request
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    loggedIn = !!data.user;
  } else {
    // Mode demo: tanda tangan cookie diverifikasi di server (lib/auth), di sini cukup cek ada/tidak
    loggedIn = req.cookies.has("fa_session");
  }

  const path = req.nextUrl.pathname;
  if (!loggedIn && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|examples/|api/files/|api/payment/webhook).*)"],
};
