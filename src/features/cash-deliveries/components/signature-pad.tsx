"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { saveDeliverySignatureAction } from "../actions";

interface Point { x: number; y: number }

export function SignaturePad({ deliveryId, error }: { deliveryId: number; error?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Point[] | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);

  function point(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 200 / bounds.height };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const first = point(event); activeStroke.current = [first];
    const context = canvasRef.current?.getContext("2d"); if (!context) return;
    context.fillStyle = "#17233c"; context.beginPath(); context.arc(first.x, first.y, 1.5, 0, Math.PI * 2); context.fill();
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStroke.current; if (!stroke) return;
    const next = point(event); const previous = stroke.at(-1)!; stroke.push(next);
    const context = canvasRef.current?.getContext("2d"); if (!context) return;
    context.strokeStyle = "#17233c"; context.lineWidth = 2.5; context.lineCap = "round"; context.lineJoin = "round"; context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(next.x, next.y); context.stroke();
  }
  function finish() { if (activeStroke.current) setStrokes((current) => [...current, activeStroke.current!]); activeStroke.current = null; }
  function clear() { const canvas = canvasRef.current; canvas?.getContext("2d")?.clearRect(0, 0, 600, 200); activeStroke.current = null; setStrokes([]); }

  return <form action={saveDeliverySignatureAction.bind(null, deliveryId)} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="space-y-4 p-5 sm:p-6">{error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}<div><p className="text-sm font-semibold text-slate-900">Firma de recepción</p><p className="mt-1 text-sm text-slate-500">Firma dentro del recuadro usando mouse, pluma o pantalla táctil.</p></div><canvas aria-label="Área para firma de recepción" className="h-auto w-full touch-none rounded-lg border border-dashed border-slate-400 bg-white" height={200} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} ref={canvasRef} width={600} /><input name="signature" type="hidden" value={JSON.stringify(strokes)} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" onClick={clear} type="button">Limpiar firma</button></div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={`/entregas/${deliveryId}`}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50" disabled={!strokes.length} type="submit">Guardar firma y confirmar</button></div></form>;
}
