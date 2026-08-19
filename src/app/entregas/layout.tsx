import { AppShell } from "@/components/app-shell";

export default function DeliveriesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell active="deliveries" title="Entregas de efectivo"><main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:p-0">{children}</main></AppShell>;
}
