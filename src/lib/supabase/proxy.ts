import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

function copyCookies(
  source: NextResponse,
  target: NextResponse,
) {
  source.cookies.getAll().forEach(
    ({ name, value }) => {
      target.cookies.set(name, value);
    },
  );

  return target;
}

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) =>
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              ),
          );
        },
      },
    },
  );

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const isLoggedIn = Boolean(
    claimsData?.claims?.sub,
  );

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(url),
    );
  }

  if (isLoggedIn && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(url),
    );
  }

  return supabaseResponse;
}
