import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "./session";

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect("/mis-nominas");
  return user;
}

export function isClientUser(user: Awaited<ReturnType<typeof getCurrentUser>>): boolean {
  return user?.role === "client";
}
