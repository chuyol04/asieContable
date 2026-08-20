import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { OAuth2Client } from "google-auth-library";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const API_BASE = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files";

interface DriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenPath: string;
  rootFolderId?: string;
  documentsRootFolderId?: string;
}

interface OAuthCredentialFile {
  web?: { client_id?: string; client_secret?: string; redirect_uris?: string[] };
}

interface OAuthTokenFile {
  refresh_token?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveFolder {
  id: string;
  path: string;
  url: string;
}

export class GoogleDriveError extends Error {
  constructor(public code: "CONFIG" | "API" | "FILE_EXISTS", message: string) { super(message); }
}

let authClient: OAuth2Client | null = null;
let rootFolders: Promise<{ documents: string; orders: string }> | null = null;

function getConfig(): DriveConfig {
  const credentialPath = process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH?.trim();
  const tokenPath = process.env.GOOGLE_DRIVE_OAUTH_TOKEN_PATH?.trim();
  if (!credentialPath || !tokenPath) throw new GoogleDriveError("CONFIG", "Faltan las rutas seguras de OAuth para Google Drive.");

  let credentials: OAuthCredentialFile;
  try {
    credentials = JSON.parse(readFileSync(credentialPath, "utf8")) as OAuthCredentialFile;
  } catch {
    throw new GoogleDriveError("CONFIG", "No se pudo leer el archivo OAuth de Google Drive.");
  }
  const clientId = credentials.web?.client_id?.trim();
  const clientSecret = credentials.web?.client_secret?.trim();
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI?.trim() || credentials.web?.redirect_uris?.[0]?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new GoogleDriveError("CONFIG", "El archivo OAuth de Google Drive no es válido.");

  return {
    clientId,
    clientSecret,
    redirectUri,
    tokenPath,
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim() || undefined,
    documentsRootFolderId: process.env.GOOGLE_DRIVE_DOCUMENTS_ROOT_FOLDER_ID?.trim() || undefined,
  };
}

function oauthClient(config: DriveConfig): OAuth2Client {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

function getAuthClient(config: DriveConfig): OAuth2Client {
  if (authClient) return authClient;
  let token: OAuthTokenFile;
  try {
    token = JSON.parse(readFileSync(config.tokenPath, "utf8")) as OAuthTokenFile;
  } catch {
    throw new GoogleDriveError("CONFIG", "Google Drive aún no está conectado. Abre /api/google-drive/connect.");
  }
  if (!token.refresh_token) throw new GoogleDriveError("CONFIG", "El token de Google Drive no contiene autorización renovable.");
  authClient = oauthClient(config);
  authClient.setCredentials({ refresh_token: token.refresh_token });
  return authClient;
}

export function driveAuthorizationUrl(state: string): string {
  return oauthClient(getConfig()).generateAuthUrl({ access_type: "offline", prompt: "consent", scope: [DRIVE_SCOPE], state });
}

export async function saveDriveAuthorization(code: string): Promise<void> {
  const config = getConfig();
  const client = oauthClient(config);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new GoogleDriveError("API", "Google no devolvió autorización renovable. Intenta conectar nuevamente.");
  mkdirSync(dirname(config.tokenPath), { recursive: true });
  writeFileSync(config.tokenPath, JSON.stringify({ refresh_token: tokens.refresh_token }, null, 2), { encoding: "utf8", mode: 0o600 });
  authClient = null;
  rootFolders = null;
}

export function isDriveConnected(): boolean {
  const tokenPath = process.env.GOOGLE_DRIVE_OAUTH_TOKEN_PATH?.trim();
  if (!tokenPath || !existsSync(tokenPath)) return false;
  try {
    return Boolean((JSON.parse(readFileSync(tokenPath, "utf8")) as OAuthTokenFile).refresh_token);
  } catch {
    return false;
  }
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const config = getConfig();
  const { token } = await getAuthClient(config).getAccessToken();
  if (!token) throw new GoogleDriveError("API", "Google no devolvió un token de acceso.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new GoogleDriveError("API", `Google Drive no pudo completar la solicitud (${response.status}).`);
  }
  return response;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  return (await driveFetch(url, init)).json() as Promise<T>;
}

function queryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function folderName(value: string): string {
  return value.trim().replace(/[\\/]+/g, "-").slice(0, 200) || "Empresa";
}

async function findFile(name: string, parentId: string, mimeType: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    fields: "files(id,name,webViewLink)",
    pageSize: "10",
    q: `name = '${queryValue(name)}' and mimeType = '${mimeType}' and '${queryValue(parentId)}' in parents and trashed = false`,
    spaces: "drive",
  });
  const result = await requestJson<{ files?: DriveFile[] }>(`${API_BASE}?${params}`);
  return result.files?.[0] ?? null;
}

async function createFolder(name: string, parentId: string): Promise<DriveFile> {
  const params = new URLSearchParams({ fields: "id,name" });
  return requestJson<DriveFile>(`${API_BASE}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mimeType: FOLDER_MIME_TYPE, name, parents: [parentId] }),
  });
}

async function ensureFolder(name: string, parentId: string): Promise<string> {
  return (await findFile(name, parentId, FOLDER_MIME_TYPE) ?? await createFolder(name, parentId)).id;
}

async function getRootFolders(): Promise<{ documents: string; orders: string }> {
  const config = getConfig();
  if (!rootFolders) {
    rootFolders = (async () => {
      const applicationRoot = await ensureFolder("ASIEContable", "root");
      return {
        orders: config.rootFolderId || await ensureFolder("Ordenes de compra", applicationRoot),
        documents: config.documentsRootFolderId || await ensureFolder("Expedientes", applicationRoot),
      };
    })();
  }
  try {
    return await rootFolders;
  } catch (error) {
    rootFolders = null;
    throw error;
  }
}

export async function ensurePurchaseOrderFolder(companyName: string, orderDate: string): Promise<DriveFolder> {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(orderDate);
  const month = match ? Number(match[2]) : 0;
  if (!match || month < 1 || month > 12) throw new GoogleDriveError("API", "La fecha de la orden no permite determinar la carpeta.");
  const names = [folderName(companyName), match[1], months[month - 1]];
  let parentId = (await getRootFolders()).orders;
  for (const name of names) parentId = await ensureFolder(name, parentId);
  return { id: parentId, path: names.join(" / "), url: `https://drive.google.com/drive/folders/${encodeURIComponent(parentId)}` };
}

export async function ensureCompanyDocumentFolder(companyName: string, category: string): Promise<DriveFolder> {
  const names = [folderName(companyName), "Expediente administrativo", folderName(category)];
  let parentId = (await getRootFolders()).documents;
  for (const name of names) parentId = await ensureFolder(name, parentId);
  return { id: parentId, path: names.join(" / "), url: `https://drive.google.com/drive/folders/${encodeURIComponent(parentId)}` };
}

function multipartBody(metadata: object, data: Uint8Array, filename: string, mimeType: string): FormData {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([Uint8Array.from(data).buffer], { type: mimeType }), filename);
  return form;
}

export async function uploadPurchaseOrderPdf(folderId: string, filename: string, pdf: Uint8Array): Promise<DriveFile> {
  if (await findFile(filename, folderId, "application/pdf")) {
    throw new GoogleDriveError("FILE_EXISTS", "Ya existe un archivo con ese nombre en la carpeta destino.");
  }
  const params = new URLSearchParams({ fields: "id,name,webViewLink", uploadType: "multipart" });
  return requestJson<DriveFile>(`${UPLOAD_BASE}?${params}`, {
    method: "POST",
    body: multipartBody({ mimeType: "application/pdf", name: filename, parents: [folderId] }, pdf, filename, "application/pdf"),
  });
}

export async function replacePurchaseOrderPdf(fileId: string, filename: string, pdf: Uint8Array): Promise<DriveFile> {
  const params = new URLSearchParams({ fields: "id,name,webViewLink", uploadType: "multipart" });
  return requestJson<DriveFile>(`${UPLOAD_BASE}/${encodeURIComponent(fileId)}?${params}`, {
    method: "PATCH",
    body: multipartBody({ mimeType: "application/pdf", name: filename }, pdf, filename, "application/pdf"),
  });
}

export async function uploadDriveFile(folderId: string, filename: string, mimeType: string, data: Uint8Array): Promise<DriveFile> {
  if (await findFile(filename, folderId, mimeType)) throw new GoogleDriveError("FILE_EXISTS", "Ya existe un archivo con ese nombre en la carpeta destino.");
  const params = new URLSearchParams({ fields: "id,name,webViewLink", uploadType: "multipart" });
  return requestJson<DriveFile>(`${UPLOAD_BASE}?${params}`, { method: "POST", body: multipartBody({ mimeType, name: filename, parents: [folderId] }, data, filename, mimeType) });
}

export async function replaceDriveFile(fileId: string, filename: string, mimeType: string, data: Uint8Array): Promise<DriveFile> {
  const params = new URLSearchParams({ fields: "id,name,webViewLink", uploadType: "multipart" });
  return requestJson<DriveFile>(`${UPLOAD_BASE}/${encodeURIComponent(fileId)}?${params}`, { method: "PATCH", body: multipartBody({ mimeType, name: filename }, data, filename, mimeType) });
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  await driveFetch(`${API_BASE}/${encodeURIComponent(fileId)}`, { method: "DELETE" });
}

export function driveFileUrl(file: DriveFile): string {
  return file.webViewLink || `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view`;
}

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;
