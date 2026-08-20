import { NextResponse, type NextRequest } from "next/server";

import { firebaseAdminAuth } from "@/features/auth/firebase-admin";
import { isTrustedOrigin } from "@/features/auth/security";
import { SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/features/auth/session";

export async function POST(request: NextRequest) {
  const appDomain = process.env.APP_DOMAIN?.trim().toLowerCase();
  const trustedOrigins = appDomain
    ? [`https://${appDomain}`, `https://www.${appDomain}`]
    : request.nextUrl.origin;
  if (!isTrustedOrigin(request.headers.get("origin"), trustedOrigins)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  try {
    const { idToken } = await request.json() as { idToken?: unknown };
    if (typeof idToken !== "string" || idToken.length > 10_000) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    const token = await firebaseAdminAuth.verifyIdToken(idToken);
    if (!token.auth_time || Date.now() / 1000 - token.auth_time > 5 * 60) return NextResponse.json({ error: "Vuelve a iniciar sesión." }, { status: 401 });
    const session = await firebaseAdminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_SECONDS * 1000 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_DURATION_SECONDS, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }
}
