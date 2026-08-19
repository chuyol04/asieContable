import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { saveDriveAuthorization } from "@/features/purchase-orders/google-drive";

export const dynamic = "force-dynamic";

function sameState(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const expectedState = request.cookies.get("asie_drive_oauth_state")?.value;
  if (!sameState(expectedState, state) || !code || code.length > 4096) return NextResponse.json({ error: "Respuesta OAuth inválida." }, { status: 400 });

  try {
    await saveDriveAuthorization(code);
    const response = new NextResponse("Google Drive quedó conectado. Ya puedes cerrar esta pestaña y volver a ASIEContable.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
    response.cookies.delete("asie_drive_oauth_state");
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo completar la conexión con Google Drive." }, { status: 502 });
  }
}
