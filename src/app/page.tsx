import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { isDriveConnected } from "@/features/purchase-orders/google-drive";
import { isDatabaseConnected } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export default async function Home() {
  const databaseConnected = await isDatabaseConnected();
  const driveConnected = isDriveConnected();

  return (
    <AppShell active="home" title="Resumen del sistema">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Inicio / Resumen</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Resumen del sistema</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Estado técnico y accesos disponibles para la operación actual de ASIEContable.
          </p>
        </div>

        <section aria-label="Estado del entorno" className="grid gap-4 sm:grid-cols-2">
          <StatusCard label="Aplicación" value="En línea" detail="Next.js disponible" tone="emerald" />
          <StatusCard
            label="Base de datos"
            value={databaseConnected ? "Conectada" : "No disponible"}
            detail="MySQL local"
            tone={databaseConnected ? "emerald" : "amber"}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Módulos disponibles</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Operación actual</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <ModuleLink code="EM" description="Datos generales, representantes, documentos y cuentas bancarias." href="/empresas" name="Expedientes de empresas" />
            <ModuleLink code="CN" description="Usuarios clientes y archivos privados de nómina en Google Drive." href="/clientes" name="Clientes y nóminas" />
            <ModuleLink code="PM" description="Periodos mensuales por empresa y control de estado." href="/periodos" name="Periodos mensuales" />
            <ModuleLink code="DP" description="Captura individual y múltiple de movimientos recibidos." href="/depositos" name="Depósitos recibidos" />
            <ModuleLink code="CO" description="Coincidencias exactas, similares y conciliación manual por periodo." href="/conciliacion" name="Conciliación" />
            <ModuleLink code="EE" description="Saldo disponible, entregas parciales, firma y comprobante imprimible." href="/entregas" name="Entregas de efectivo" />
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Integraciones</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">Google Drive</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${driveConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {driveConnected ? "Conectado" : "Pendiente"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Repositorio de expedientes y PDF de órdenes de compra.</p>
            </div>
            <Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-700" href="/api/google-drive/connect">
              {driveConnected ? "Reconectar Drive" : "Conectar Google Drive"}
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Verificación técnica</p>
              <h2 className="mt-1 font-semibold text-slate-900">Endpoint de salud</h2>
              <p className="mt-1 text-sm text-slate-500">Comprueba aplicación y conexión a MySQL sin exponer configuración sensible.</p>
            </div>
            <code className="w-fit rounded-lg bg-slate-950 px-3 py-2 text-xs text-cyan-300">GET /api/health</code>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function ModuleLink({ code, name, description, href }: { code: string; name: string; description: string; href: string }) {
  return (
    <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-700">{code}</span>
        <div><h3 className="font-semibold text-slate-900">{name}</h3><p className="text-sm text-slate-500">{description}</p></div>
      </div>
      <Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-700" href={href}>Abrir módulo</Link>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "amber" | "cyan";
}) {
  const color = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
  }[tone];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
      </div>
    </article>
  );
}
