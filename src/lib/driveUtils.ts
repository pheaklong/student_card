/**
 * Utilities for parsing and converting Google Drive image links and other media URLs.
 */

/**
 * Extracts a Google Drive file ID from various Drive URL formats.
 * Supports:
 * - https://drive.google.com/file/d/{id}/view?usp=drivesdk
 * - https://drive.google.com/open?id={id}
 * - https://drive.google.com/uc?id={id}
 * - https://lh3.googleusercontent.com/d/{id}
 * - Raw Google Drive file IDs
 */
export function extractGoogleDriveId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Matching /file/d/{id}
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Matching id={id} or export=view&id={id} query parameter
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Matching googleusercontent.com/d/{id}
  const googleUserMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (googleUserMatch && googleUserMatch[1]) return googleUserMatch[1];

  // If string is already a naked file ID (typically ~28-44 chars)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Checks whether a given URL is a Google Drive link or ID.
 */
export function isGoogleDriveUrl(url: string | undefined | null): boolean {
  return extractGoogleDriveId(url) !== null;
}

/**
 * Converts any Google Drive link or raw ID into a direct embeddable image URL.
 * Uses Google's high-speed direct content delivery network (lh3.googleusercontent.com/d/{id})
 * or thumbnail endpoint (drive.google.com/thumbnail?id={id}&sz=w1000).
 * If the input is not a Google Drive link, returns the original URL.
 */
export function formatDriveImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    // Both lh3.googleusercontent.com/d/{id} and drive.google.com/thumbnail?id={id}&sz=w1000 work.
    // lh3 is fast and supports direct CORS/embed in browser <img> tags.
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return trimmed;
}

/**
 * Returns alternative direct URLs for Google Drive images to handle fallbacks.
 */
export function getDriveImageFallbackUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const driveId = extractGoogleDriveId(url);
  if (!driveId) return url.trim();

  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
}
