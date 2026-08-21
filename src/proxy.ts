import { NextResponse, type NextRequest } from "next/server";

import { firebaseAdminAuth } from "@/features/auth/firebase-admin";
import { SESSION_COOKIE } from "@/features/auth/session";

const publicPaths = new Set(["/login", "/api/auth/session", "/api/health"]);

export async function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = request.nextUrl.pathname === "/login";
  if (!session) return publicPaths.has(request.nextUrl.pathname) ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));

  try {
    const user = await firebaseAdminAuth.verifySessionCookie(session, true);
    const clientArea = request.nextUrl.pathname === "/mis-nominas" || request.nextUrl.pathname.startsWith("/mis-nominas/");
    if (user.role === "client") {
      if (isLogin || (!clientArea && !publicPaths.has(request.nextUrl.pathname))) return NextResponse.redirect(new URL("/mis-nominas", request.url));
      return NextResponse.next();
    }
    if (clientArea || isLogin) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  } catch {
    const response = publicPaths.has(request.nextUrl.pathname) ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
