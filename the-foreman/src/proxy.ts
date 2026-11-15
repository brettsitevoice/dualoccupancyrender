import { NextResponse, type NextRequest } from "next/server";

// A quick first check: send people without a session cookie to the login
// screen, and people who already have one away from it. This only looks at
// whether the cookie exists. The real check (is the session valid, does this
// job belong to this student) happens in every API route.

const SESSION_COOKIE = "foreman_session";

export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE);
  const onLogin = request.nextUrl.pathname === "/login";

  if (!signedIn && !onLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (signedIn && onLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the API, Next.js internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|svg|ico|webmanifest|txt)$).*)"],
};
