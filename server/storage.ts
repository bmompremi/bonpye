// Storage helpers — priority order:
//   1. S3 / R2 / Backblaze (if AWS_ACCESS_KEY_ID + AWS_S3_BUCKET set)
//   2. Forge API (if FORGE_API_URL + FORGE_API_KEY set)
//   3. Local filesystem (fallback for dev)
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

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ─── S3 / R2 / Backblaze storage ─────────────────────────────────────────────

function getS3Config() {
  const { awsAccessKeyId, awsSecretAccessKey, awsS3Bucket } = ENV;
  if (!awsAccessKeyId || !awsSecretAccessKey || !awsS3Bucket) return null;
  return {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    bucket: awsS3Bucket,
    region: ENV.awsRegion || "us-east-1",
    endpoint: ENV.awsEndpoint || undefined,
    publicBaseUrl: ENV.awsPublicBaseUrl || "",
  };
}

async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
  config: NonNullable<ReturnType<typeof getS3Config>>
): Promise<{ key: string; url: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const key = normalizeKey(relKey);
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
  });

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  // Build public URL
  let url: string;
  if (config.publicBaseUrl) {
    url = `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  } else if (config.endpoint) {
    // R2 / custom endpoint — path-style URL
    url = `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${key}`;
  } else {
    url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  console.log(`[Storage] S3 upload: ${key} → ${url}`);
  return { key, url };
}

// ─── Local filesystem storage ─────────────────────────────────────────────────

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.join(UPLOADS_DIR, key);

  ensureDir(path.dirname(filePath));

  const buffer = typeof data === 'string'
    ? Buffer.from(data)
    : Buffer.from(data);
  fs.writeFileSync(filePath, buffer);

  const url = `/uploads/${key}`;
  console.log(`[Storage] Local file saved: ${filePath} -> ${url}`);
  return { key, url };
}

async function localGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

// ─── Forge API storage (remote) ───────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // 1. S3-compatible (AWS / R2 / Backblaze)
  const s3Config = getS3Config();
  if (s3Config) {
    return s3Put(relKey, data, contentType, s3Config);
  }

  // 2. Forge API
  const forgeConfig = getStorageConfig();
  if (forgeConfig) {
    return remotePut(relKey, data, contentType, forgeConfig);
  }

  // 3. Local filesystem (dev only)
  return localPut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const s3Config = getS3Config();
  if (s3Config) {
    // For S3, reconstruct the public URL directly
    const key = normalizeKey(relKey);
    let url: string;
    if (s3Config.publicBaseUrl) {
      url = `${s3Config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
    } else if (s3Config.endpoint) {
      url = `${s3Config.endpoint.replace(/\/$/, "")}/${s3Config.bucket}/${key}`;
    } else {
      url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
    }
    return { key, url };
  }

  const forgeConfig = getStorageConfig();
  if (forgeConfig) {
    const key = normalizeKey(relKey);
    return { key, url: await buildDownloadUrl(forgeConfig.baseUrl, key, forgeConfig.apiKey) };
  }

  return localGet(relKey);
}
