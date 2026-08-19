import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASIEContable | Fase 0",
  description: "Entorno local del sistema operativo y financiero ASIEContable.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
