import "server-only";

import { cookies } from "next/headers";

import { firebaseAdminAuth } from "./firebase-admin";

export const SESSION_COOKIE = "asie_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 5;

export async function getCurrentUser() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    return await firebaseAdminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}
