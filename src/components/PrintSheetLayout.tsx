import React from 'react';
import { SchoolSettings, Student, PrintOptions } from '../types';
import { StudentCard } from './StudentCard';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';

interface PrintSheetLayoutProps {
  students: Student[];
  school: SchoolSettings;
  options: PrintOptions;
}

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

  const cardsPerPage = options.gridMode === '8-per-page' ? 8 : 6;
  const rows = options.gridMode === '8-per-page' ? 4 : 3;

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

  // Base dimensions of the card
  const cardW = cfg.cardWidthMm || (isLandscapeCard ? 128 : 92);
  const cardH = cfg.cardHeightMm || (isLandscapeCard ? 92 : 128);

  // Available space per cell inside 2-col A4 grid (264mm total grid height, 196mm total grid width)
  const targetColW = 94; // mm per col
  const targetRowH = options.gridMode === '8-per-page' ? 64 : 86; // mm per row

  const scaleW = targetColW / cardW;
  const scaleH = targetRowH / cardH;
  const cardScale = Math.min(scaleW, scaleH);

  const scaledW = cardW * cardScale;
  const scaledH = cardH * cardScale;

  return (
    <div id="print-sheets-container" className="w-full flex flex-col items-center print:p-0 print:m-0">
      {pages.map((pageStudents, pageIndex) => (
        <div
          key={pageIndex}
          data-sheet-page={pageIndex + 1}
          className="print-page-break print-sheet-page relative bg-white shadow-md print:shadow-none mb-8 print:mb-0 print:border-none border border-neutral-200"
          style={{
            width: '210mm',
            height: '297mm',
            maxHeight: '297mm',
            padding: '7mm 7mm 7mm 7mm',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Top Sheet Metadata Header */}
          <div className="flex justify-between items-center text-[8px] font-kantumruy text-neutral-400 border-b border-neutral-200 pb-1 mb-2 print:text-neutral-500">
            <span>
              {school.school_name} - {school.academic_year} | បោះពុម្ពប័ណ្ណសម្គាល់ខ្លួនសិស្ស ({options.gridMode === '8-per-page' ? '៨ ប័ណ្ណ/ទំព័រ' : '៦ ប័ណ្ណ/ទំព័រ'})
              {isLandscapeCard ? ' [ប្លង់ផ្តេក Landscape]' : ' [ប្លង់បញ្ឈរ Portrait]'}
            </span>
            <span className="font-mono">
              ទំព័រ {pageIndex + 1} / {pages.length}
            </span>
          </div>

          {/* Grid Container for Cards - exact 264mm height to guarantee 0 overflow */}
          <div
            className="grid gap-x-2 gap-y-2 justify-center items-center w-full"
            style={{
              height: '264mm',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {pageStudents.map((student) => (
              <div
                key={student.id || student.student_id}
                className="flex items-center justify-center w-full h-full"
              >
                {/* Scaled wrapper holding card with exact scaled footprint */}
                <div
                  style={{
                    width: `${scaledW}mm`,
                    height: `${scaledH}mm`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${cardW}mm`,
                      height: `${cardH}mm`,
                      transform: `scale(${cardScale})`,
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
              </div>
            ))}

            {/* Empty placeholders to maintain grid if last page has fewer cards */}
            {Array.from({ length: cardsPerPage - pageStudents.length }).map((_, emptyIndex) => (
              <div
                key={`empty-${emptyIndex}`}
                className="flex items-center justify-center w-full h-full opacity-0 pointer-events-none"
              >
                <div style={{ width: `${scaledW}mm`, height: `${scaledH}mm` }} />
              </div>
            ))}
          </div>

          {/* Sheet Footer Cut Guide Note */}
          <div className="absolute bottom-2 left-7 right-7 flex justify-between items-center text-[7px] font-kantumruy text-neutral-400 print:text-neutral-500">
            <span>* សូមកាត់តាមបន្ទាត់ដាច់ៗដោយប្រុងប្រយ័ត្នដើម្បីបានទំហំប័ណ្ណត្រឹមត្រូវស្មើគ្នា</span>
            <span>ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS)</span>
          </div>
        </div>
      ))}
    </div>
  );
};
