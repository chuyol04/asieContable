import { notFound } from "next/navigation";

import { updateBankAction } from "@/features/banks/actions";
import { BankForm } from "@/features/banks/components/bank-form";
import { getBank } from "@/features/banks/service";
import { parseBankId } from "@/features/banks/validation";

export const dynamic = "force-dynamic";

export default async function EditBankPage({ params }: PageProps<"/bancos/[id]/editar">) {
  const { id: rawId } = await params;
  const id = parseBankId(rawId);
  if (!id) notFound();
  const bank = await getBank(id);
  if (!bank) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Bancos / Editar</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar {bank.name}</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Actualiza los datos generales del banco.</p>
      <BankForm action={updateBankAction.bind(null, bank.id)} initialValues={{ name: bank.name, shortName: bank.shortName ?? "" }} submitLabel="Guardar cambios" />
    </div>
  );
}
