"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveAccountingPeriod, createAccountingPeriod, getAccountingPeriod, isDuplicatePeriod, updatePeriodNotes, updatePeriodStatus } from "./service";
import type { PeriodFormState, PeriodStatus } from "./types";
import { parsePeriodId, validatePeriodForm, validatePeriodNotes } from "./validation";
import { validateActiveCompany } from "@/features/company-context/service";

export async function createPeriodAction(_state: PeriodFormState, formData: FormData): Promise<PeriodFormState> {
  const validation = validatePeriodForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { await validateActiveCompany(validation.data.companyId); } catch { return { message: "La empresa no coincide con el contexto activo." }; }

  let id: number;
  try {
    id = await createAccountingPeriod(validation.data);
  } catch (error) {
    if (isDuplicatePeriod(error)) return { message: "Ya existe un periodo para esa empresa, mes y año.", values: { companyId: String(validation.data.companyId), month: String(validation.data.month), year: String(validation.data.year), notes: validation.data.notes ?? "" } };
    console.error("[accounting-periods] Failed to create period.");
    return { message: "No fue posible guardar el periodo." };
  }

  revalidatePath("/periodos");
  revalidatePath(`/empresas/${validation.data.companyId}`);
  redirect(`/periodos/${id}?message=created`);
}

export async function updatePeriodNotesAction(id: number, companyId: number, _state: PeriodFormState, formData: FormData): Promise<PeriodFormState> {
  if (!parsePeriodId(id) || !parsePeriodId(companyId)) return { message: "El periodo indicado no es válido." };
  if (!await periodMatchesActiveCompany(id, companyId)) return { message: "La empresa no coincide con el contexto activo." };
  const validation = validatePeriodNotes(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };

  try {
    await updatePeriodNotes(id, validation.notes);
  } catch {
    console.error("[accounting-periods] Failed to update notes.");
    return { message: "No fue posible actualizar las observaciones." };
  }
  revalidatePath("/periodos");
  revalidatePath(`/periodos/${id}`);
  revalidatePath(`/empresas/${companyId}`);
  redirect(`/periodos/${id}?message=updated`);
}

export async function setPeriodStatusAction(formData: FormData): Promise<void> {
  const id = parsePeriodId(formData.get("id"));
  const companyId = parsePeriodId(formData.get("companyId"));
  const rawStatus = formData.get("status");
  const status = rawStatus === "open" || rawStatus === "review" || rawStatus === "closed" ? rawStatus : null;
  if (!id || !companyId || !status) redirect("/periodos?error=invalid-period");
  if (!await periodMatchesActiveCompany(id, companyId)) redirect("/periodos?error=invalid-period");

  try {
    await updatePeriodStatus(id, status as PeriodStatus);
  } catch {
    console.error("[accounting-periods] Failed to update status.");
    redirect(`/periodos/${id}?error=status-update`);
  }
  revalidatePath("/periodos");
  revalidatePath(`/periodos/${id}`);
  revalidatePath(`/empresas/${companyId}`);
  redirect(`/periodos/${id}?message=status-updated`);
}

export async function archivePeriodAction(formData: FormData): Promise<void> {
  const id = parsePeriodId(formData.get("id"));
  const companyId = parsePeriodId(formData.get("companyId"));
  if (!id || !companyId) redirect("/periodos?error=invalid-period");
  if (!await periodMatchesActiveCompany(id, companyId)) redirect("/periodos?error=invalid-period");
  let result: Awaited<ReturnType<typeof archiveAccountingPeriod>>;
  try {
    result = await archiveAccountingPeriod(id, companyId);
  } catch {
    console.error("[accounting-periods] Failed to archive period.");
    redirect("/periodos?error=archive-failed");
  }
  if (result === "has-data") redirect("/periodos?error=period-has-data");
  if (result === "not-found") redirect("/periodos?error=invalid-period");
  revalidatePath("/periodos");
  revalidatePath(`/empresas/${companyId}`);
  redirect("/periodos?message=archived");
}

async function periodMatchesActiveCompany(id: number, companyId: number): Promise<boolean> {
  const period = await getAccountingPeriod(id);
  if (!period || period.companyId !== companyId) return false;
  try { await validateActiveCompany(period.companyId); return true; } catch { return false; }
}
