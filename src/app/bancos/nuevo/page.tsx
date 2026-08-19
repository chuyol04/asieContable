import { createBankAction } from "@/features/banks/actions";
import { BankForm } from "@/features/banks/components/bank-form";

export default function NewBankPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Bancos / Nuevo</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Nuevo banco</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Registra una institución bancaria en el catálogo general.</p>
      <BankForm action={createBankAction} submitLabel="Crear banco" />
    </div>
  );
}
