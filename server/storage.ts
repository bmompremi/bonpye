// Storage helpers — uses Forge API if configured, otherwise local filesystem
import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Local filesystem storage ────────────────────────────────────────────────

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.join(UPLOADS_DIR, key);

  // Ensure parent directory exists
  ensureDir(path.dirname(filePath));

  // Write file
  const buffer = typeof data === 'string'
    ? Buffer.from(data)
    : Buffer.from(data);
  fs.writeFileSync(filePath, buffer);

  // Return URL relative to server
  const url = `/uploads/${key}`;
  console.log(`[Storage] Local file saved: ${filePath} -> ${url}`);
  return { key, url };
}

async function localGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

// ─── Forge API storage (remote) ──────────────────────────────────────────────

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob = typeof data === "string"
    ? new Blob([data], { type: contentType })
    : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function remotePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
  config: StorageConfig
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(config.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(config.apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status} ${response.statusText}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  if (config) {
    return remotePut(relKey, data, contentType, config);
  }
  // Fallback to local filesystem
  return localPut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  if (config) {
    const key = normalizeKey(relKey);
    return { key, url: await buildDownloadUrl(config.baseUrl, key, config.apiKey) };
  }
  return localGet(relKey);
}
