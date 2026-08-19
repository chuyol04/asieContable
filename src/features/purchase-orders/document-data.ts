import { getCompany } from "@/features/companies/service";
import type { Company } from "@/features/companies/types";
import { readLogoFile } from "@/features/purchase-order-settings/logo-storage";
import { getPurchaseOrderSettings } from "@/features/purchase-order-settings/service";
import type { PurchaseOrderSettings } from "@/features/purchase-order-settings/types";
import { getPurchaseOrder } from "@/features/purchase-orders/service";
import type { PurchaseOrderDetail } from "@/features/purchase-orders/types";

export interface PurchaseOrderDocumentData {
  company: Company;
  order: PurchaseOrderDetail;
  settings: PurchaseOrderSettings | null;
  logoDataUri: string | null;
}

export async function getPurchaseOrderDocumentData(id: number): Promise<PurchaseOrderDocumentData | null> {
  const order = await getPurchaseOrder(id);
  if (!order) return null;

  const [company, settings] = await Promise.all([
    getCompany(order.companyId),
    getPurchaseOrderSettings(order.companyId),
  ]);
  if (!company) return null;

  const logo = settings?.logoUrl ? await readLogoFile(settings.logoUrl) : null;
  return {
    company,
    order,
    settings,
    logoDataUri: logo ? `data:${logo.contentType};base64,${logo.data.toString("base64")}` : null,
  };
}
