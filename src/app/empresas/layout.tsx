import { AppShell } from "@/components/app-shell";

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell active="companies" title="Expedientes de empresas">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </AppShell>
  );
}
