import { renderAsync } from "@htmldocs/render";
import { chromium } from "playwright";

import type { PurchaseOrderDocumentData } from "@/features/purchase-orders/document-data";
import { PurchaseOrderDocument } from "@/features/purchase-orders/purchase-order-document";

export async function renderPurchaseOrderPdf(data: PurchaseOrderDocumentData): Promise<Uint8Array> {
  const renderedHtml = await renderAsync(<PurchaseOrderDocument data={data} />);
  const html = renderedHtml.replace(/<script src="https:\/\/unpkg\.com\/@htmldocs\/render@[^\"]+"><\/script>/, "");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    return await page.pdf({
      displayHeaderFooter: true,
      footerTemplate: '<div style="width:100%;font:8px Arial;color:#64748b;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      format: "A4",
      headerTemplate: "<span></span>",
      margin: { top: "12mm", right: "10mm", bottom: "16mm", left: "10mm" },
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

export function purchaseOrderPdfFilename(companyName: string, orderNumber: string): string {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return `${normalize(companyName) || "EMPRESA"}_${normalize(orderNumber) || "ORDEN"}.pdf`;
}
