import { createClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";

export default function NewClientPage() {
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Administración / Clientes</p><h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Nuevo cliente</h1><p className="mt-2 text-sm text-slate-500">Crea el acceso de consulta para un usuario de Firebase.</p><ClientForm action={createClientAction} submitLabel="Guardar cliente" /></div>;
}
