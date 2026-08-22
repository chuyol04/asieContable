import type { Metadata } from "next";
import phantoLogo from "../../docs/referencias-ui/PHANTOLOGO.png";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Phanto Contable",
  title: "Phanto Contable | Gestión Administrativa y Financiera",
  description: "Sistema de gestión administrativa, contable y financiera de PHANTO.",
  icons: {
    icon: phantoLogo.src,
    shortcut: phantoLogo.src,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
