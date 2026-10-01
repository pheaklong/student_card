import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { KHMER_FONT_EMBED_CSS } from './khmerFontBase64';

export interface PdfExportProgress {
  currentPage: number;
  totalPages: number;
  statusText: string;
}

const BLANK_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>';

/**
 * Injects offline base64 fonts into the document head so that the browser's
 * font cache is pre-warmed and ready before any SVG serialization occurs.
 */
function ensureKhmerFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();

  const STYLE_ID = 'offline-khmer-embedded-fonts-sheet';
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = KHMER_FONT_EMBED_CSS;
    document.head.appendChild(styleEl);
  }

  if (document.fonts && document.fonts.ready) {
    return document.fonts.ready.then(() => {}).catch(() => {});
  }
  return Promise.resolve();
}

/**
 * Renders an HTML element to a JPEG data URL safely with 100% embedded Khmer typography.
 */
async function renderElementToImageDataUrl(element: HTMLElement, pixelRatio = 2): Promise<string> {
  // Ensure document fonts are loaded before capturing
  await ensureKhmerFontsLoaded();

  const commonOptions = {
    quality: 0.96,
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: false,
    skipFonts: true, // Skips external network scanning (prevents CORS errors)
    fontEmbedCSS: KHMER_FONT_EMBED_CSS, // Direct offline base64 embedded Khmer fonts with all aliases
    imagePlaceholder: BLANK_PLACEHOLDER,
    onImageErrorHandler: () => BLANK_PLACEHOLDER,
  };

  // Pre-warm the SVG canvas engine with the embedded fonts so Skia compiles OpenType HarfBuzz tables
  try {
    await toJpeg(element, { ...commonOptions, pixelRatio: 1 });
    await new Promise((resolve) => setTimeout(resolve, 80));
  } catch {
    // Ignore pre-warm failure and continue to primary render
  }

  try {
    return await toJpeg(element, commonOptions);
  } catch (primaryErr) {
    console.warn('Initial render failed, trying with lower scale', primaryErr);
    try {
      return await toJpeg(element, {
        ...commonOptions,
        pixelRatio: 1.5,
      });
    } catch (fallbackErr) {
      console.error('All rendering attempts failed for element:', fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Exports all A4 print sheet pages to a multi-page PDF document.
 * 
 * @param pageElements Array of HTML elements representing each A4 page (.print-page-break)
 * @param fileName Name of the downloaded PDF file
 * @param onProgress Callback function to update UI progress during rendering
 */
export async function exportPrintSheetsToPdf(
  pageElements: HTMLElement[],
  fileName: string = 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស.pdf',
  onProgress?: (progress: PdfExportProgress) => void
): Promise<void> {
  if (!pageElements || pageElements.length === 0) {
    throw new Error('មិនមានទំព័រសម្រាប់បង្កើត PDF ឡើយ');
  }

  const totalPages = pageElements.length;

  const firstEl = pageElements[0];
  const firstW = firstEl?.dataset?.paperWidth ? parseFloat(firstEl.dataset.paperWidth) : 210;
  const firstH = firstEl?.dataset?.paperHeight ? parseFloat(firstEl.dataset.paperHeight) : 297;
  const firstOrientation = firstW > firstH ? 'landscape' : 'portrait';

  // Initialize jsPDF with exact paper dimensions
  const pdf = new jsPDF({
    orientation: firstOrientation,
    unit: 'mm',
    format: [firstW, firstH],
    compress: true,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i];
    const pageW = pageEl?.dataset?.paperWidth ? parseFloat(pageEl.dataset.paperWidth) : firstW;
    const pageH = pageEl?.dataset?.paperHeight ? parseFloat(pageEl.dataset.paperHeight) : firstH;
    const pageOrientation = pageW > pageH ? 'landscape' : 'portrait';

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages,
        statusText: `កំពុង Render ទំព័រទី ${i + 1} នៃ ${totalPages}...`,
      });
    }

    // Add new page for subsequent sheets
    if (i > 0) {
      pdf.addPage([pageW, pageH], pageOrientation);
    }

    const imgData = await renderElementToImageDataUrl(pageEl, 2);

    // Add image filling the exact paper dimensions in mm
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      statusText: 'កំពុងទាញយកឯកសារ PDF...',
    });
  }

  // Trigger file download
  pdf.save(fileName);
}

/**
 * Exports a single student card to a standalone PDF with exact card dimensions.
 */
export async function exportSingleCardToPdf(
  cardElement: HTMLElement,
  studentName: string,
  studentId: string
): Promise<void> {
  const imgData = await renderElementToImageDataUrl(cardElement, 2.5);

  const rect = cardElement.getBoundingClientRect();
  const isLandscape = rect.width > rect.height;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isLandscape ? [128, 92] : [92, 128],
    compress: true,
  });

  if (isLandscape) {
    pdf.addImage(imgData, 'JPEG', 0, 0, 128, 92, undefined, 'FAST');
  } else {
    pdf.addImage(imgData, 'JPEG', 0, 0, 92, 128, undefined, 'FAST');
  }

  const cleanName = studentName.replace(/[/\\?%*:|"<> ]/g, '_') || studentId;
  pdf.save(`ប័ណ្ណសិស្ស_${cleanName}_${studentId}.pdf`);
}

/**
 * Exports hard card / PVC cards to a dedicated PDF with exact card dimensions (e.g. CR-80 54x85.6mm or 85.6x54mm).
 */
export async function exportPvcCardsToPdf(
  cardElements: HTMLElement[],
  widthMm: number = 54,
  heightMm: number = 85.6,
  fileName: string = 'ប័ណ្ណកាតរឹង_PVC_CR80.pdf',
  onProgress?: (progress: PdfExportProgress) => void
): Promise<void> {
  if (!cardElements || cardElements.length === 0) {
    throw new Error('មិនមានប័ណ្ណសម្រាប់បង្កើត PDF ឡើយ');
  }

  const isLandscape = widthMm > heightMm;
  const totalCards = cardElements.length;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  for (let i = 0; i < totalCards; i++) {
    const el = cardElements[i];
    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages: totalCards,
        statusText: `កំពុង Render កាតរឹងទី ${i + 1} នៃ ${totalCards}...`,
      });
    }

    if (i > 0) {
      pdf.addPage([widthMm, heightMm], isLandscape ? 'landscape' : 'portrait');
    }

    const imgData = await renderElementToImageDataUrl(el, 2.5);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress({
      currentPage: totalCards,
      totalPages: totalCards,
      statusText: 'កំពុងទាញយកឯកសារ PDF...',
    });
  }

  pdf.save(fileName);
}
