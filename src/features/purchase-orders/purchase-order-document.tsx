import { Document, Head } from "@htmldocs/react";

import { amountInWords } from "@/features/purchase-orders/amount-in-words";
import type { PurchaseOrderDocumentData } from "@/features/purchase-orders/document-data";
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types";

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export function PurchaseOrderDocument({ data }: { data: PurchaseOrderDocumentData }) {
  const { company, logoDataUri, order, settings } = data;
  const companyTitle = company.legalName || company.name;

  return (
    <Document size="A4" orientation="portrait" margin="12mm 10mm 16mm">
      <Head>
        <meta charSet="utf-8" />
        <title>{`${company.name} ${order.orderNumber}`}</title>
        <style>{documentStyles}</style>
      </Head>
      <main className="purchase-order">
        <header className="document-header">
          <div className="logo-box">
            {logoDataUri ? (
              // El logo embebido en base64 debe llegar sin transformación al motor de PDF.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Logo de ${company.name}`} src={logoDataUri} />
            ) : <span>{company.name}</span>}
          </div>
          <div className="company-heading">
            <p className="eyebrow">Orden de compra</p>
            <h1>{companyTitle}</h1>
            {company.legalName && company.legalName !== company.name ? <p>{company.name}</p> : null}
            {settings?.headerText ? <p className="header-text">{settings.headerText}</p> : null}
          </div>
          <div className="order-number">
            <span>Folio</span>
            <strong>{order.orderNumber}</strong>
            <em>{statusLabels[order.status]}</em>
          </div>
        </header>

        <section className="information-grid">
          <InfoBlock title="Datos de la empresa">
            <Line label="RFC" value={company.taxId} />
            <Line label="Dirección" value={company.fiscalAddress} />
            <Line label="Teléfono" value={company.phone} />
            <Line label="Correo" value={company.email} />
          </InfoBlock>
          <InfoBlock title="Proveedor">
            <Line label="Razón social" value={order.supplierLegalName} />
            <Line label="RFC" value={order.supplierTaxId} />
            <Line label="Domicilio" value={order.supplierAddress} />
            <Line label="Teléfono" value={order.supplierPhone} />
          </InfoBlock>
          <InfoBlock title="Fechas">
            <Line label="Expedición" value={formatDate(order.orderDate)} />
            <Line label="Entrega" value={formatDate(order.deliveryDate)} />
          </InfoBlock>
        </section>

        <table className="items-table">
          <thead>
            <tr>
              <th>Referencia / producto</th>
              <th className="numeric">P. unitario</th>
              <th className="numeric">Cantidad</th>
              <th className="numeric">Descuento</th>
              <th className="numeric">IVA</th>
              <th className="numeric">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.productName}</strong>
                  <span>{item.productReference || "Sin referencia"} · {item.unit}</span>
                  {item.description ? <small>{item.description}</small> : null}
                </td>
                <td className="numeric">{formatMoney(item.unitPrice)}</td>
                <td className="numeric">{formatQuantity(item.quantity)}</td>
                <td className="numeric">{formatMoney(item.discount)}</td>
                <td className="numeric">{formatTax(item.taxRate)}</td>
                <td className="numeric total-cell">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="summary-section">
          <div className="notes">
            <h2>Cantidad en letra</h2>
            <p>{amountInWords(order.total)}</p>
            {order.notes ? <><h2>Observaciones</h2><p>{order.notes}</p></> : null}
          </div>
          <dl className="totals">
            <Total label="Subtotal" value={order.subtotal} />
            <Total label="Descuento" value={order.discountTotal} />
            <Total label="IVA" value={order.taxTotal} />
            <Total final label="Total" value={order.total} />
          </dl>
        </section>

        <section className="signatures">
          <Signature text={settings?.leftSignatureText || "ELABORADO POR"} />
          <Signature text={settings?.rightSignatureText || "AUTORIZADO POR"} />
        </section>

        {settings?.footerText ? <p className="configured-footer">{settings.footerText}</p> : null}
      </main>
    </Document>
  );
}

function InfoBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return <div className="info-block"><h2>{title}</h2><dl>{children}</dl></div>;
}

function Line({ label, value }: { label: string; value: string | null }) {
  return <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;
}

function Total({ final = false, label, value }: { final?: boolean; label: string; value: string }) {
  return <div className={final ? "grand-total" : undefined}><dt>{label}</dt><dd>{formatMoney(value)}</dd></div>;
}

function Signature({ text }: { text: string }) {
  return <div><span /><p>{text}</p></div>;
}

function formatMoney(value: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));
}

function formatQuantity(value: string): string {
  return Number(value).toLocaleString("es-MX", { maximumFractionDigits: 4 });
}

function formatTax(value: string): string {
  return `${Number(value).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`;
}

function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

const documentStyles = `
  :root { color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #172033; background: white; }
  .purchase-order { width: 100%; }
  .document-header { display: grid; grid-template-columns: 120px 1fr 145px; gap: 16px; align-items: center; padding-bottom: 14px; border-bottom: 2px solid #0891b2; }
  .logo-box { display: flex; min-height: 70px; align-items: center; justify-content: center; color: #0e7490; font-size: 18px; font-weight: 800; }
  .logo-box img { display: block; max-width: 116px; max-height: 68px; object-fit: contain; }
  .company-heading { text-align: center; }
  .company-heading h1 { margin: 3px 0; color: #0f172a; font-size: 19px; line-height: 1.15; }
  .company-heading p { margin: 2px 0; color: #475569; }
  .company-heading .eyebrow { color: #0891b2; font-size: 9px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; }
  .company-heading .header-text { margin-top: 6px; white-space: pre-wrap; font-size: 9px; }
  .order-number { padding: 12px; border: 1px solid #bae6fd; border-radius: 8px; background: #f0f9ff; text-align: center; }
  .order-number span, .order-number em { display: block; color: #64748b; font-size: 8px; font-style: normal; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
  .order-number strong { display: block; margin: 5px 0; color: #0e7490; font-size: 18px; overflow-wrap: anywhere; }
  .information-grid { display: grid; grid-template-columns: 1fr 1fr .72fr; gap: 8px; margin: 14px 0; }
  .info-block { padding: 10px; border: 1px solid #dbe3ec; border-radius: 7px; }
  .info-block h2, .notes h2 { margin: 0 0 7px; color: #0e7490; font-size: 9px; letter-spacing: .5px; text-transform: uppercase; }
  .info-block dl, .totals { margin: 0; }
  .info-block dl > div { display: grid; grid-template-columns: 72px 1fr; gap: 5px; margin-top: 4px; }
  .info-block dt { color: #64748b; font-weight: 700; }
  .info-block dd { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items-table thead { display: table-header-group; }
  .items-table tr { break-inside: avoid; page-break-inside: avoid; }
  .items-table th { padding: 8px 6px; border: 1px solid #0e7490; color: white; background: #0e7490; font-size: 8px; letter-spacing: .3px; text-align: left; text-transform: uppercase; }
  .items-table th:first-child { width: 38%; }
  .items-table th:nth-child(2) { width: 14%; }
  .items-table th:nth-child(3), .items-table th:nth-child(4), .items-table th:nth-child(5) { width: 11%; }
  .items-table th:last-child { width: 15%; }
  .items-table td { padding: 8px 6px; border: 1px solid #dbe3ec; vertical-align: top; }
  .items-table tbody tr:nth-child(even) { background: #f8fafc; }
  .items-table td strong, .items-table td span, .items-table td small { display: block; overflow-wrap: anywhere; }
  .items-table td span { margin-top: 2px; color: #64748b; font-size: 8px; }
  .items-table td small { margin-top: 4px; color: #475569; line-height: 1.35; white-space: pre-wrap; }
  .numeric { text-align: right !important; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .total-cell { font-weight: 700; }
  .summary-section { display: grid; grid-template-columns: 1fr 230px; gap: 22px; margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
  .notes { padding: 10px; border: 1px solid #dbe3ec; border-radius: 7px; }
  .notes h2:not(:first-child) { margin-top: 12px; }
  .notes p { margin: 0; color: #475569; line-height: 1.4; white-space: pre-wrap; }
  .totals { padding: 4px 10px; border: 1px solid #dbe3ec; border-radius: 7px; }
  .totals > div { display: flex; justify-content: space-between; gap: 15px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
  .totals > div:last-child { border-bottom: 0; }
  .totals dt { color: #475569; }
  .totals dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
  .totals .grand-total { margin: 2px -10px -4px; padding: 10px; color: white; background: #0e7490; font-size: 12px; }
  .totals .grand-total dt { color: white; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin: 46px 28px 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
  .signatures span { display: block; border-top: 1px solid #64748b; }
  .signatures p { margin: 7px 0 0; color: #475569; font-size: 9px; font-weight: 700; white-space: pre-wrap; }
  .configured-footer { margin: 18px 0 0; color: #64748b; font-size: 8px; line-height: 1.35; text-align: center; white-space: pre-wrap; break-inside: avoid; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;
