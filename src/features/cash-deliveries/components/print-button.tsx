"use client";

export function PrintButton() { return <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 print:hidden" onClick={() => window.print()} type="button">Imprimir comprobante</button>; }
