import { AppShell } from "@/components/app-shell";

export default function PurchaseOrdersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell active="purchase-orders" title="Órdenes de compra"><main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main></AppShell>;
}
