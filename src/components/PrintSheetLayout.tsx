import React from 'react';
import { SchoolSettings, Student, PrintOptions, PaperSize } from '../types';
import { StudentCard } from './StudentCard';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';

interface PrintSheetLayoutProps {
  students: Student[];
  school: SchoolSettings;
  options: PrintOptions;
}

export const getPaperDimensions = (paperSize: PaperSize = 'a4-portrait', cardW = 92, cardH = 128) => {
  switch (paperSize) {
    case 'a4-landscape':
      return { widthMm: 297, heightMm: 210, label: 'A4 ផ្តេក (29.7 x 21.0 cm)' };
    case 'a3-portrait':
      return { widthMm: 297, heightMm: 420, label: 'A3 បញ្ឈរ (29.7 x 42.0 cm)' };
    case 'a3-landscape':
      return { widthMm: 420, heightMm: 297, label: 'A3 ផ្តេក (42.0 x 29.7 cm)' };
    case 'letter':
      return { widthMm: 215.9, heightMm: 279.4, label: 'Letter (21.6 x 27.9 cm)' };
    case 'card-direct':
      return {
        widthMm: cardW,
        heightMm: cardH,
        label: `តាមទំហំប័ណ្ណផ្ទាល់ (${(cardW / 10).toFixed(1)} x ${(cardH / 10).toFixed(1)} cm)`,
      };
    case 'a4-portrait':
    default:
      return { widthMm: 210, heightMm: 297, label: 'A4 បញ្ឈរ (21.0 x 29.7 cm)' };
  }
};

export const PrintSheetLayout: React.FC<PrintSheetLayoutProps> = ({
  students,
  school,
  options,
}) => {
  const baseCfg = getEffectiveTemplateConfig(school.template_config);
  const cfg = {
    ...baseCfg,
    ...(options.showStamp !== undefined ? { showStamp: options.showStamp } : {}),
  };
  const isLandscapeCard = cfg.orientation === 'landscape';

  // Base physical dimensions of the card in mm
  const cardW = cfg.cardWidthMm || (isLandscapeCard ? 128 : 92);
  const cardH = cfg.cardHeightMm || (isLandscapeCard ? 92 : 128);

  const paperSize = options.paperSize || 'a4-portrait';
  const paper = getPaperDimensions(paperSize, cardW, cardH);
  const paperW = paper.widthMm;
  const paperH = paper.heightMm;

  const isCardDirect = paperSize === 'card-direct';
  const isTrueSize = options.scaleMode === 'true-size-100' && !isCardDirect;

  // Optimized spacing in mm for maximum card area on A4
  const gapMm = isCardDirect ? 0 : (options.gapMm ?? 2.5);
  const marginMm = isCardDirect ? 0 : 5;
  const topHeaderSpaceMm = isCardDirect ? 0 : 5.5;
  const bottomFooterSpaceMm = isCardDirect ? 0 : 4.5;

  // Available printable area
  const availW = Math.max(10, paperW - 2 * marginMm);
  const availH = Math.max(10, paperH - 2 * marginMm - topHeaderSpaceMm - bottomFooterSpaceMm);

  let cols = 2;
  let rows = 3;
  let cardsPerPage = 6;
  let cardScale = 1.0;

  if (isCardDirect) {
    cols = 1;
    rows = 1;
    cardsPerPage = 1;
    cardScale = 1.0;
  } else if (isTrueSize) {
    // 100% True Physical Centimeter Size Mode (No CSS scaling)
    cols = Math.max(1, Math.floor((availW + gapMm) / (cardW + gapMm)));
    rows = Math.max(1, Math.floor((availH + gapMm) / (cardH + gapMm)));
    cardsPerPage = Math.max(1, cols * rows);
    cardScale = options.scale || 1.0;
  } else {
    // Standard Fit-to-grid mode: 6 cards (2 cols x 3 rows) or 8 cards (2 cols x 4 rows)
    cols = 2;
    rows = options.gridMode === '8-per-page' ? 4 : 3;
    cardsPerPage = options.gridMode === '8-per-page' ? 8 : 6;

    const targetCellW = (availW - (cols - 1) * gapMm) / cols;
    const targetCellH = (availH - (rows - 1) * gapMm) / rows;
    const scaleW = targetCellW / cardW;
    const scaleH = targetCellH / cardH;
    cardScale = Math.min(scaleW, scaleH) * (options.scale || 1.0);
  }

  const scaledW = cardW * cardScale;
  const scaledH = cardH * cardScale;

  // Split students into chunks of cardsPerPage
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += cardsPerPage) {
    pages.push(students.slice(i, i + cardsPerPage));
  }

  if (students.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500 font-kantumruy">
        មិនមានសិស្សដែលបានជ្រើសរើសសម្រាប់បោះពុម្ពឡើយ។ សូមជ្រើសរើសសិស្សពីតារាងជាមុនសិន។
      </div>
    );
  }

  return (
    <div id="print-sheets-container" className="w-full flex flex-col items-center print:p-0 print:m-0">
      {/* Dynamic @page CSS rule to inform the browser print engine of the exact paper size */}
      <style>{`
        @page {
          size: ${paperW}mm ${paperH}mm !important;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            width: ${paperW}mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {pages.map((pageStudents, pageIndex) => (
        <div
          key={pageIndex}
          data-sheet-page={pageIndex + 1}
          data-paper-width={paperW}
          data-paper-height={paperH}
          className="print-page-break print-sheet-page relative bg-white shadow-md print:shadow-none mb-8 print:mb-0 print:border-none border border-neutral-200"
          style={{
            width: `${paperW}mm`,
            height: `${paperH}mm`,
            maxHeight: `${paperH}mm`,
            padding: isCardDirect ? '0' : `${marginMm}mm`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Top Sheet Metadata Header (Hidden in card-direct mode) */}
          {!isCardDirect && (
            <div
              className="flex justify-between items-center text-[8px] font-kantumruy text-neutral-500 border-b border-neutral-200 pb-1 mb-1 print:text-neutral-500"
              style={{ height: `${topHeaderSpaceMm - 1}mm` }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-neutral-800">
                  {school.school_name || 'សាលារៀន'} ({school.academic_year || 'ឆ្នាំសិក្សា'})
                </span>
                <span>•</span>
                <span className="text-blue-700 font-semibold">
                  {isTrueSize
                    ? `ទំហំពិត ១០០% (${(cardW / 10).toFixed(1)} x ${(cardH / 10).toFixed(1)} cm - ${cardsPerPage} ប័ណ្ណ/ទំព័រ)`
                    : options.gridMode === '8-per-page'
                    ? '៨ ប័ណ្ណ/សន្លឹក A4'
                    : '៦ ប័ណ្ណ/សន្លឹក A4 (ស្តង់ដារ)'}
                </span>
                <span>•</span>
                <span>{paper.label}</span>
              </div>
              <span className="font-mono text-[8px] shrink-0 text-neutral-500">
                ទំព័រ {pageIndex + 1} / {pages.length}
              </span>
            </div>
          )}

          {/* Grid Container for Cards */}
          <div
            className="flex items-center justify-center w-full"
            style={{
              height: isCardDirect ? `${paperH}mm` : `${availH}mm`,
              width: isCardDirect ? `${paperW}mm` : `${availW}mm`,
              margin: '0 auto',
            }}
          >
            <div
              className="grid justify-center items-center"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${scaledW}mm)`,
                gridTemplateRows: `repeat(${rows}, ${scaledH}mm)`,
                gap: `${gapMm}mm`,
                width: 'max-content',
                height: 'max-content',
              }}
            >
              {pageStudents.map((student) => (
                <div
                  key={student.id || student.student_id}
                  className="flex items-center justify-center"
                  style={{
                    width: `${scaledW}mm`,
                    height: `${scaledH}mm`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${cardW}mm`,
                      height: `${cardH}mm`,
                      transform: cardScale === 1.0 ? 'none' : `scale(${cardScale})`,
                      transformOrigin: 'center center',
                      flexShrink: 0,
                    }}
                  >
                    <StudentCard
                      student={student}
                      school={school}
                      template={cfg}
                      showCutLines={options.showCutLines}
                      borderStyle={options.borderStyle}
                      showBackSide={options.showBackSide}
                      scale={1}
                    />
                  </div>
                </div>
              ))}

              {/* Empty placeholders to preserve grid structure if last page has fewer cards */}
              {Array.from({ length: Math.max(0, cardsPerPage - pageStudents.length) }).map((_, emptyIndex) => (
                <div
                  key={`empty-${emptyIndex}`}
                  className="flex items-center justify-center opacity-0 pointer-events-none"
                  style={{ width: `${scaledW}mm`, height: `${scaledH}mm` }}
                />
              ))}
            </div>
          </div>

          {/* Sheet Footer Cut Guide Note & Exact 5cm Verification Ruler (Hidden in card-direct mode) */}
          {!isCardDirect && (
            <div
              className="absolute bottom-1 left-2 right-2 flex justify-between items-center text-[7px] font-kantumruy text-neutral-400 print:text-neutral-500 px-1 border-t border-neutral-100"
              style={{ height: `${bottomFooterSpaceMm - 1}mm` }}
            >
              <span>* សូមកាត់តាមបន្ទាត់ដាច់ៗដោយប្រុងប្រយ័ត្នដើម្បីបានទំហំប័ណ្ណត្រឹមត្រូវស្មើគ្នា</span>

              {/* 5.0 cm Calibration Ruler to let users physically verify print accuracy when true-size is used */}
              {isTrueSize ? (
                <div className="flex items-center gap-1.5 font-mono text-[7px] text-neutral-500">
                  <span className="text-[6.5px]">បន្ទាត់ផ្ទៀងផ្ទាត់ (5.0 cm)៖</span>
                  <div
                    className="h-2 border-x border-b border-neutral-700 relative flex items-end justify-between px-0.5 bg-neutral-50/50"
                    style={{ width: '50mm', boxSizing: 'border-box' }}
                    title="បន្ទាត់នេះត្រូវតែមានប្រវែង 5cm ជាក់ស្តែងលើក្រដាសព្រីនចេញ"
                  >
                    <span className="text-[5.5px] -mb-0.5">0</span>
                    <span className="text-[5.5px] -mb-0.5">1</span>
                    <span className="text-[5.5px] -mb-0.5">2</span>
                    <span className="text-[5.5px] -mb-0.5">3</span>
                    <span className="text-[5.5px] -mb-0.5">4</span>
                    <span className="text-[5.5px] -mb-0.5 font-bold">5cm</span>
                  </div>
                </div>
              ) : (
                <span className="text-[7.5px] font-semibold text-neutral-600">
                  ទំហំប័ណ្ណលើ A4៖ ~{(scaledW / 10).toFixed(1)} x {(scaledH / 10).toFixed(1)} cm ({cardsPerPage} ប័ណ្ណ/សន្លឹក)
                </span>
              )}

              <span>ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
