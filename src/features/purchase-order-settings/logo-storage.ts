import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "storage", "purchase-order-logos");
const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

export class LogoUploadError extends Error {}

export async function writeLogoFile(companyId: number, value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 2 * 1024 * 1024) throw new LogoUploadError("El logo no puede superar 2 MB.");
  const extension = extensions[value.type as keyof typeof extensions];
  if (!extension) throw new LogoUploadError("El logo debe ser PNG, JPG o WebP.");
  const data = Buffer.from(await value.arrayBuffer());
  if (!hasValidSignature(data, extension)) throw new LogoUploadError("El contenido del archivo no corresponde a una imagen válida.");

  await mkdir(directory, { recursive: true });
  const reference = `company-${companyId}-${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, reference), data, { flag: "wx" });
  return reference;
}

export async function readLogoFile(reference: string): Promise<{ data: Buffer; contentType: string } | null> {
  const match = /^company-[1-9]\d*-[0-9a-f-]{36}\.(png|jpg|webp)$/.exec(reference);
  if (!match) return null;
  try {
    const data = await readFile(path.join(directory, reference));
    const contentType = match[1] === "png" ? "image/png" : match[1] === "jpg" ? "image/jpeg" : "image/webp";
    return { data, contentType };
  } catch {
    return null;
  }
}

export async function deleteLogoFile(reference: string | null): Promise<void> {
  if (reference && /^company-[1-9]\d*-[0-9a-f-]{36}\.(png|jpg|webp)$/.test(reference)) {
    await rm(path.join(directory, reference), { force: true });
  }
}

function hasValidSignature(data: Buffer, extension: "png" | "jpg" | "webp"): boolean {
  if (extension === "png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === "jpg") return data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255;
  return data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
}
