/**
 * QR Code Redirection and URL Generation Utilities.
 */

/**
 * Resolves the final QR code URL for a student card.
 * If qrBaseUrl is provided:
 * - Appends the student ID directly to the end of qrBaseUrl without auto-inserting any '/' (user controls the trailing slash).
 * - If base URL contains {id} placeholder, replaces {id} with student ID.
 * 
 * If qrBaseUrl is not provided:
 * - Uses custom student qr_code_data if non-default
 * - Or falls back to standard https://verify.moeys.gov.kh/student/{student_id}
 */
export function resolveStudentQrCode(
  studentId: string | undefined | null,
  qrBaseUrl?: string | null,
  customQrData?: string | null
): string {
  const cleanId = String(studentId || '').trim();

  if (qrBaseUrl && qrBaseUrl.trim()) {
    const base = qrBaseUrl.trim();

    // If base URL contains {id} placeholder
    if (base.includes('{id}')) {
      return base.replace('{id}', encodeURIComponent(cleanId));
    }

    // Direct concatenation: Do NOT auto-insert any '/' (user controls the trailing slash)
    return `${base}${cleanId}`;
  }

  // If student has a specific custom QR data that is not the default
  if (customQrData && customQrData.trim() && !customQrData.includes('verify.moeys.gov.kh/student/')) {
    return customQrData.trim();
  }

  return `https://verify.moeys.gov.kh/student/${cleanId}`;
}
