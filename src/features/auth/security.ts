export function isTrustedOrigin(origin: string | null, expectedOrigins: string | readonly string[]): boolean {
  if (!origin) return false;
  try {
    const normalizedOrigin = new URL(origin).origin;
    const allowedOrigins = typeof expectedOrigins === "string" ? [expectedOrigins] : expectedOrigins;
    return allowedOrigins.includes(normalizedOrigin);
  } catch {
    return false;
  }
}

export function safeInternalPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  try {
    const url = new URL(value, "http://internal.local");
    return url.origin === "http://internal.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export function isClientAllowedPath(pathname: string): boolean {
  return pathname === "/mis-nominas"
    || pathname.startsWith("/mis-nominas/")
    || /^\/api\/nominas\/[1-9]\d*\/download$/.test(pathname);
}
