/**
 * Storage Service — Cloudflare R2 / MinIO direct upload
 *
 * Flow for every file:
 *   1. POST /api/v1/upload/presign  → backend returns a presigned PUT URL
 *   2. PUT {uploadUrl} with file bytes directly to R2/MinIO (never touches our server)
 *   3. Return { objectKey, publicUrl? } to the caller
 *
 * Public files  (DOCTOR_AVATAR, HOSPITAL_LOGO, HOSPITAL_FACILITY_PHOTO):
 *   → publicUrl is set; save it as the avatar/imageUrl in the onboarding API call.
 *
 * Private files (DOCTOR_CERTIFICATE, HOSPITAL_DOCUMENT):
 *   → publicUrl is null; save objectKey and request a signed GET URL via
 *     GET /api/v1/upload/signed-url?key={objectKey} when you need to display it.
 */
import api from './api';

// Public base URL for MinIO/R2 — set EXPO_PUBLIC_STORAGE_PUBLIC_URL in .env.local.
// Falls back to the backend default so the service still works without the env var.
const STORAGE_PUBLIC_URL: string =
  process.env.EXPO_PUBLIC_STORAGE_PUBLIC_URL ?? 'http://localhost:9000/medreachplus-public';

export type StorageFileType =
  | 'DOCTOR_AVATAR'
  | 'DOCTOR_CERTIFICATE'
  | 'HOSPITAL_LOGO'
  | 'HOSPITAL_FACILITY_PHOTO'
  | 'HOSPITAL_DOCUMENT';

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl?: string;
  expiresInMinutes: number;
}

export interface UploadResult {
  objectKey: string;
  /** Only present for public files — use this as the avatar/imageUrl */
  publicUrl?: string;
}

// ─── Presign ─────────────────────────────────────────────────────────────────

async function requestPresignedUrl(
  fileType: StorageFileType,
  contentType: string,
  fileName?: string,
): Promise<PresignResponse> {
  return api.post<PresignResponse>('/api/v1/upload/presign', {
    fileType,
    contentType,
    fileName,
  });
}

// ─── MIME type normalisation ──────────────────────────────────────────────────
// iOS ImagePicker returns 'image/heic' / 'image/heif' for native camera photos.
// The backend only accepts image/jpeg|png|webp — map unsupported types to jpeg.
// (Expo re-encodes with quality:0.8 so the actual bytes are already JPEG-compatible.)

function normaliseMimeType(rawMime: string | undefined): string {
  const mime = rawMime?.toLowerCase() ?? 'image/jpeg';
  if (['image/heic', 'image/heif'].includes(mime)) return 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mime)) return mime;
  return 'image/jpeg'; // safe fallback for any other image format
}

// ─── Upload to R2/MinIO ───────────────────────────────────────────────────────
// Must use fetch (not Axios) — request goes directly to R2/MinIO, not our API.

async function uploadToR2(uploadUrl: string, fileUri: string, contentType: string): Promise<void> {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload to storage failed (${uploadResponse.status})`);
  }
}

// ─── Public URL rewrite ───────────────────────────────────────────────────────
// The backend embeds its own STORAGE_PUBLIC_URL in the presign response.
// On Android emulator / physical device that URL contains 'localhost' which only
// resolves on iOS simulator. Replace the origin with the env-configured base URL
// so the returned publicUrl is always device-reachable.

function rewritePublicUrl(backendUrl: string | undefined): string | undefined {
  if (!backendUrl) return undefined;
  // Replace everything up to (and including) the bucket name with our env value.
  // backendUrl pattern: http://<host>:<port>/<bucket>/<key>
  const afterBucket = backendUrl.replace(/^https?:\/\/[^/]+\/[^/]+/, '');
  return `${STORAGE_PUBLIC_URL}${afterBucket}`;
}

// ─── Combined helper ──────────────────────────────────────────────────────────

/**
 * Full upload in two steps:
 *   1. Request presigned URL from backend
 *   2. PUT file directly to R2/MinIO
 */
async function uploadFile(
  fileType: StorageFileType,
  fileUri: string,
  contentType: string,
  fileName?: string,
): Promise<UploadResult> {
  const safeContentType = normaliseMimeType(contentType);
  const presign = await requestPresignedUrl(fileType, safeContentType, fileName);
  await uploadToR2(presign.uploadUrl, fileUri, safeContentType);
  return {
    objectKey: presign.objectKey,
    publicUrl: rewritePublicUrl(presign.publicUrl),
  };
}

// ─── Signed GET URL (for private files) ──────────────────────────────────────

async function getSignedUrl(objectKey: string): Promise<string> {
  const result = await api.get<{ url: string }>(
    `/api/v1/upload/signed-url?key=${encodeURIComponent(objectKey)}`,
  );
  return result.url;
}

const storageService = { uploadFile, getSignedUrl };
export default storageService;
