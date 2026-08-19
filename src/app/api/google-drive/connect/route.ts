import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { driveAuthorizationUrl } from "@/features/purchase-orders/google-drive";

export const dynamic = "force-dynamic";

export function GET() {
  const state = randomBytes(32).toString("base64url");
  const response = NextResponse.redirect(driveAuthorizationUrl(state));
  response.cookies.set("asie_drive_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/api/google-drive/callback",
  });
  return response;
}
