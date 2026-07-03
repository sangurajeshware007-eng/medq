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
  | 'HOSPITAL_DOCUMENT'
  | 'CITY_IMAGE';

/** Global upload cap. Must match `MAX_UPLOAD_BYTES` in medq-be/.../storage/UploadPolicy.kt. */
export const MAX_UPLOAD_BYTES = 1 * 1024 * 1024; // 1 MB

/** Thrown when a file is too big — surface its `code` to render the localised toast. */
export class FileTooLargeError extends Error {
  readonly code = 'FILE_TOO_LARGE';
  constructor(public actualBytes: number) {
    super(`File must be less than ${MAX_UPLOAD_BYTES} bytes (got ${actualBytes})`);
  }
}

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
  contentLength: number,
  fileName?: string,
): Promise<PresignResponse> {
  return api.post<PresignResponse>('/api/v1/upload/presign', {
    fileType,
    contentType,
    contentLength,
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

async function uploadBlobToR2(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
  // Strip query string for log clarity (presign signature is huge)
  const safeUrl = uploadUrl.split('?')[0];
  console.log(`📤 Uploading ${blob.size} bytes to ${safeUrl}  (Content-Type: ${contentType})`);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
  } catch (e) {
    // Network failure — host unreachable / DNS / TLS / firewall
    console.error('❌ Storage PUT network failure:', e);
    const msg = (e as Error).message ?? 'Network error';
    throw new Error(
      `Could not reach the storage server. ${msg}. ` +
      `Check that the backend's STORAGE_PUBLIC_ENDPOINT points to a host the phone can reach, ` +
      `and that the macOS firewall isn't blocking port 9000.`
    );
  }

  if (!uploadResponse.ok) {
    // Try to extract MinIO's XML error body for a precise reason
    let body = '';
    try { body = await uploadResponse.text(); } catch { /* ignore */ }
    console.error(`❌ Storage PUT failed: HTTP ${uploadResponse.status}\n${body}`);
    // Common MinIO codes — surface them clearly
    if (body.includes('SignatureDoesNotMatch')) {
      throw new Error(
        'Storage rejected the upload (SignatureDoesNotMatch). The presigned URL was signed for a different host than the phone is reaching. ' +
        'Restart the backend with STORAGE_PUBLIC_ENDPOINT set to the same host the phone uses.'
      );
    }
    if (body.includes('AccessDenied')) {
      throw new Error('Storage rejected the upload (AccessDenied). Check the bucket policy.');
    }
    throw new Error(`Storage upload failed (HTTP ${uploadResponse.status}). ${body.slice(0, 200)}`);
  }

  console.log('✅ Upload completed');
}

// ─── Host rewriting for device reachability ─────────────────────────────────
// The backend embeds its own STORAGE_PUBLIC_ENDPOINT (often "localhost") in BOTH
// the presigned uploadUrl AND the publicUrl. On a physical phone via Expo Go,
// "localhost" resolves to the phone itself — so uploads fail and images don't
// load. Rewrite the origin (scheme + host + port) of any storage URL to match
// the env-configured EXPO_PUBLIC_STORAGE_PUBLIC_URL so it's reachable from the
// device. Query strings (presign signatures) are preserved verbatim.

/** "http://192.168.1.2:9000" — extracted once from EXPO_PUBLIC_STORAGE_PUBLIC_URL.
 *  Regex avoids React Native's incomplete URL polyfill. */
const STORAGE_HOST_ORIGIN: string | undefined = (() => {
  const m = STORAGE_PUBLIC_URL.match(/^(https?:\/\/[^/]+)/);
  return m ? m[1] : undefined;
})();

/** Replace the origin of a URL with our env-configured storage host. */
function rewriteHost(url: string | undefined): string | undefined {
  if (!url || !STORAGE_HOST_ORIGIN) return url;
  return url.replace(/^https?:\/\/[^/]+/, STORAGE_HOST_ORIGIN);
}

function rewritePublicUrl(backendUrl: string | undefined): string | undefined {
  if (!backendUrl) return undefined;
  // Same as rewriteHost — kept as a named alias since it conveys intent
  // (returns a *display* URL, not a presigned upload URL).
  return rewriteHost(backendUrl);
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

  // Read the file ONCE here so we know its size before asking the backend for a
  // presigned URL. Rejecting locally avoids a wasted round trip and surfaces the
  // size error before the user sees a network error.
  let blob: Blob;
  try {
    const fileResponse = await fetch(fileUri);
    blob = await fileResponse.blob();
  } catch (e) {
    throw new Error(`Could not read the selected file. ${(e as Error).message}`);
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new FileTooLargeError(blob.size);
  }

  const presign = await requestPresignedUrl(fileType, safeContentType, blob.size, fileName);
  // NOTE — DO NOT rewrite presign.uploadUrl. AWS SigV4 includes the Host header
  // in the signed-headers list, so changing the host invalidates the signature
  // (MinIO rejects with 403 SignatureDoesNotMatch). The backend must generate
  // the URL with the correct external host from the start — see
  // STORAGE_PUBLIC_ENDPOINT in medq-be/docker-compose.yml.
  await uploadBlobToR2(presign.uploadUrl, blob, safeContentType);
  return {
    objectKey: presign.objectKey,
    // publicUrl points to the anonymous public-read bucket, which is NOT
    // signature-protected — host rewriting is safe and necessary for the
    // image to render on the device.
    publicUrl: rewritePublicUrl(presign.publicUrl),
  };
}

// ─── Signed GET URL (for private files) ──────────────────────────────────────

async function getSignedUrl(objectKey: string): Promise<string> {
  const result = await api.get<{ url: string }>(
    `/api/v1/upload/signed-url?key=${encodeURIComponent(objectKey)}`,
  );
  // Same caveat as uploadUrl — signed GETs are SigV4-bound to the host.
  // Backend must embed the device-reachable host (STORAGE_PUBLIC_ENDPOINT).
  return result.url;
}

const storageService = { uploadFile, getSignedUrl };
export default storageService;
