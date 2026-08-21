import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "ASIE Contable",
  title: "ASIE Contable | Gestión Administrativa y Financiera",
  description: "Sistema de gestión administrativa, contable y financiera de ASIE.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
