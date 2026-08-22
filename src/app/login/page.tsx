import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "client" ? "/mis-nominas" : "/");
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9"><BrandLogo className="h-16 w-48" /><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Phanto Contable</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Iniciar sesión</h1><p className="mt-2 text-sm leading-6 text-slate-500">Ingresa con el usuario autorizado en Firebase.</p><LoginForm /></section></main>;
}
