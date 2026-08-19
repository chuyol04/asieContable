import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

interface SignaturePoint { x: number; y: number }

const directory = path.join(process.cwd(), "storage", "signatures");

export async function writeSignatureFile(deliveryId: number, strokes: SignaturePoint[][]): Promise<string> {
  await mkdir(directory, { recursive: true });
  const reference = `delivery-${deliveryId}.svg`;
  const lines = strokes.map((stroke) => stroke.length === 1
    ? `<circle cx="${coordinate(stroke[0].x)}" cy="${coordinate(stroke[0].y)}" r="1.5"/>`
    : `<polyline points="${stroke.map((point) => `${coordinate(point.x)},${coordinate(point.y)}`).join(" ")}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200"><rect width="600" height="200" fill="white"/><g fill="none" stroke="#17233c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${lines}</g></svg>`;
  await writeFile(path.join(directory, reference), svg, "utf8");
  return reference;
}

export async function readSignatureFile(reference: string): Promise<Buffer | null> {
  if (!/^delivery-[1-9]\d*\.svg$/.test(reference)) return null;
  try { return await readFile(path.join(directory, reference)); } catch { return null; }
}

export async function deleteSignatureFile(reference: string): Promise<void> {
  if (/^delivery-[1-9]\d*\.svg$/.test(reference)) await rm(path.join(directory, reference), { force: true });
}

function coordinate(value: number): string { return (Math.round(value * 10) / 10).toString(); }
