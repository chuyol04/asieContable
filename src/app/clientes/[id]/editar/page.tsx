import { notFound } from "next/navigation";

import { updateClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { getClient } from "@/features/clients/service";
import { parseClientId } from "@/features/clients/validation";

export default async function EditClientPage({ params }: PageProps<"/clientes/[id]/editar">) {
  const route = await params;
  const clientId = parseClientId(route.id);
  if (!clientId) notFound();
  const client = await getClient(clientId);
  if (!client) notFound();
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{client.name} / Cliente</p><h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Editar cliente</h1><ClientForm action={updateClientAction.bind(null, clientId)} initialValues={{ name: client.name, legalName: client.legalName ?? "", taxId: client.taxId ?? "", userEmail: client.userEmail, phone: client.phone ?? "", website: client.website ?? "", notes: client.notes ?? "" }} submitLabel="Guardar cambios" /></div>;
}
