import { isDatabaseConnected } from "@/lib/database/mysql";

export async function GET() {
  const databaseConnected = await isDatabaseConnected();

  return Response.json(
    { status: databaseConnected ? "ok" : "degraded" },
    { status: databaseConnected ? 200 : 503 },
  );
}
