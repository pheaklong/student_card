import React, { useState, useMemo } from 'react';
import {
  Printer,
  ArrowLeft,
  Settings2,
  Scissors,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Student, SchoolSettings, PrintOptions, CardTemplateConfig, PaperSize } from '../types';
import { PrintSheetLayout, getPaperDimensions } from './PrintSheetLayout';
import { exportPrintSheetsToPdf, PdfExportProgress } from '../lib/pdfExport';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';

interface BatchPrintViewProps {
  students: Student[];
  school: SchoolSettings;
  onBackToStudents: () => void;
  onGoToTemplateEditor?: () => void;
  onSaveTemplate?: (config: CardTemplateConfig) => void;
}

export const BatchPrintView: React.FC<BatchPrintViewProps> = ({
  students,
  school,
  onBackToStudents,
  onGoToTemplateEditor,
  onSaveTemplate,
}) => {
  const baseCfg = getEffectiveTemplateConfig(school.template_config);
  const isLandscapeCard = baseCfg.orientation === 'landscape';
  const cardW = baseCfg.cardWidthMm || (isLandscapeCard ? 128 : 92);
  const cardH = baseCfg.cardHeightMm || (isLandscapeCard ? 92 : 128);

  // Default to 6 cards per A4 page as requested by user!
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    scaleMode: 'fit-grid',
    paperSize: 'a4-portrait',
    gridMode: '6-per-page',
    showCutLines: true,
    showCropMarks: true,
    showBackSide: false,
    showStamp: school.template_config?.showStamp !== false,
    borderStyle: 'dashed',
    scale: 1,
    gapMm: 2.5,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [batchRange, setBatchRange] = useState<number | 'ALL'>(0);
  const BATCH_SIZE = 120; // 20-30 pages per batch chunk for super smooth browser rendering

  const isLargeSet = students.length > BATCH_SIZE;
  const totalBatchChunks = Math.ceil(students.length / BATCH_SIZE);

  const activeStudents = useMemo(() => {
    if (!isLargeSet || batchRange === 'ALL') {
      return students;
    }
    const start = (typeof batchRange === 'number' ? batchRange : 0) * BATCH_SIZE;
    return students.slice(start, start + BATCH_SIZE);
  }, [students, isLargeSet, batchRange]);

  const paperSize = printOptions.paperSize || 'a4-portrait';
  const paper = getPaperDimensions(paperSize, cardW, cardH);
  const isCardDirect = paperSize === 'card-direct';
  const scaleMode = printOptions.scaleMode || 'fit-grid';

  // Calculate cards per page based on current mode & paper size
  const cardsPerPage = useMemo(() => {
    if (isCardDirect) return 1;
    if (scaleMode === 'true-size-100') {
      const gapMm = printOptions.gapMm ?? 2.5;
      const marginMm = 5;
      const topHeaderSpaceMm = 5.5;
      const bottomFooterSpaceMm = 4.5;
      const availW = Math.max(10, paper.widthMm - 2 * marginMm);
      const availH = Math.max(10, paper.heightMm - 2 * marginMm - topHeaderSpaceMm - bottomFooterSpaceMm);
      const cols = Math.max(1, Math.floor((availW + gapMm) / (cardW + gapMm)));
      const rows = Math.max(1, Math.floor((availH + gapMm) / (cardH + gapMm)));
      return Math.max(1, cols * rows);
    }
    return printOptions.gridMode === '8-per-page' ? 8 : 6;
  }, [isCardDirect, scaleMode, paper, cardW, cardH, printOptions.gapMm, printOptions.gridMode]);

  const totalPages = Math.ceil(activeStudents.length / cardsPerPage);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (students.length === 0) return;

    try {
      setIsExportingPdf(true);
      setExportError(null);

      const container = document.getElementById('print-sheets-container');
      if (!container) {
        throw new Error('រកមិនឃើញផ្ទាំងបោះពុម្ពឡើយ។ សូមព្យាយាមម្តងទៀត');
      }

      const pageElements = Array.from(
        container.querySelectorAll<HTMLElement>('.print-sheet-page')
      );

      if (pageElements.length === 0) {
        throw new Error('មិនមានទំព័រសម្រាប់បង្កើត PDF ឡើយ');
      }

      const cleanSchoolName = school.school_name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'សាលា';
      const sideText = printOptions.showBackSide ? 'ខាងក្រោយ_Back' : 'ខាងមុខ_Front';
      const dateStr = new Date().toISOString().slice(0, 10);
      const formatText =
        printOptions.scaleMode === 'true-size-100'
          ? `ទំហំពិត_${(cardW / 10).toFixed(1)}x${(cardH / 10).toFixed(1)}cm`
          : `${cardsPerPage}កាត_A4`;
      const fileName = `ប័ណ្ណសិស្ស_${cleanSchoolName}_${sideText}_${formatText}_${dateStr}.pdf`;

      await exportPrintSheetsToPdf(pageElements, fileName, (progress) => {
        setExportProgress(progress);
      });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setExportError(err?.message || 'មានបញ្ហាក្នុងការបង្កើតឯកសារ PDF។ សូមសាកល្បងបោះពុម្ពតាម Browser (Ctrl+P) វិញ។');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Toolbar (Hidden in print mode) */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-5 shadow-xs font-kantumruy">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Back button and summary */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudents}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="ត្រឡប់ទៅតារាងសិស្ស (Back to Students)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                ផ្ទាំងបោះពុម្ព & ទាញយក PDF ប័ណ្ណសម្គាល់ខ្លួនសិស្ស
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-0.5">
                <span>
                  ចំនួនសិស្ស៖ <strong className="text-neutral-900 font-mono">{students.length}</strong> នាក់
                </span>
                <span>•</span>
                <span>
                  ទម្រង់៖{' '}
                  <strong className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {printOptions.scaleMode === 'true-size-100'
                      ? `🎯 ទំហំពិត ១០០% (${cardsPerPage} ប័ណ្ណ/ទំព័រ)`
                      : printOptions.paperSize === 'card-direct'
                      ? '🪪 កាតទោល (១ ប័ណ្ណ/ទំព័រ)'
                      : printOptions.gridMode === '8-per-page'
                      ? '៨ ប័ណ្ណ/សន្លឹក A4'
                      : '🌟 ៦ ប័ណ្ណ/សន្លឹក A4 (ស្តង់ដារ)'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  សន្លឹកសរុប៖ <strong className="text-neutral-900 font-mono">{totalPages}</strong> ទំព័រ
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
              title="ទាញយកឯកសារជា PDF ដោយផ្ទាល់"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-100" />
              )}
              <span>{isExportingPdf ? 'កំពុងបង្កើត PDF...' : 'ទាញយកជា PDF'}</span>
            </button>

            {/* Primary Print Button (Browser Print dialog) */}
            <button
              onClick={handlePrint}
              disabled={isExportingPdf || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
              title="បញ្ជាបោះពុម្ពលើម៉ាស៊ីនព្រីន (Ctrl + P)"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>បោះពុម្ព (Print)</span>
            </button>
          </div>
        </div>

        {/* Print Configuration Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Layout Mode Selection (Primary: 6 Cards per A4 page) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>ទម្រង់ប្លង់បោះពុម្ព (Print Layout)</span>
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-neutral-300 p-0.5 bg-neutral-100">
              {/* Option 1: 6 cards per A4 page (Recommended / Default) */}
              <button
                type="button"
                onClick={() =>
                  setPrintOptions({
                    ...printOptions,
                    scaleMode: 'fit-grid',
                    gridMode: '6-per-page',
                    paperSize: printOptions.paperSize === 'card-direct' ? 'a4-portrait' : printOptions.paperSize,
                  })
                }
                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-center ${
                  printOptions.scaleMode === 'fit-grid' && printOptions.gridMode === '6-per-page'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:text-neutral-900 bg-white/70'
                }`}
                title="កំណត់ប្លង់ ២ ជួរឈរ x ៣ ជួរដេក = ៦ ប័ណ្ណពេញមួយសន្លឹក A4 សមល្មមស្អាត"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>៦ ប័ណ្ណ/សន្លឹក A4</span>
              </button>

              {/* Option 2: 8 cards per A4 page */}
              <button
                type="button"
                onClick={() =>
                  setPrintOptions({
                    ...printOptions,
                    scaleMode: 'fit-grid',
                    gridMode: '8-per-page',
                    paperSize: printOptions.paperSize === 'card-direct' ? 'a4-portrait' : printOptions.paperSize,
                  })
                }
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-center ${
                  printOptions.scaleMode === 'fit-grid' && printOptions.gridMode === '8-per-page'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:text-neutral-900 bg-white/70'
                }`}
                title="ប្លង់ ២ ជួរឈរ x ៤ ជួរដេក = ៨ ប័ណ្ណក្នុងមួយសន្លឹក A4"
              >
                <span>៨ ប័ណ្ណ/សន្លឹក A4</span>
              </button>

              {/* Option 3: 100% True Physical CM Size */}
              <button
                type="button"
                onClick={() =>
                  setPrintOptions({
                    ...printOptions,
                    scaleMode: 'true-size-100',
                    gridMode: 'true-size-auto',
                  })
                }
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-center ${
                  printOptions.scaleMode === 'true-size-100'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:text-neutral-900 bg-white/70'
                }`}
                title={`រក្សាទំហំពិត ${(cardW / 10).toFixed(1)} x ${(cardH / 10).toFixed(1)} cm ពេញ ១០០% មិនបង្រួម`}
              >
                <span>🎯 ទំហំពិត ១០០% cm</span>
              </button>
            </div>
          </div>

          {/* 2. Paper Size Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>ទំហំក្រដាស (Paper Size)</span>
            </label>
            <select
              value={printOptions.paperSize}
              onChange={(e) =>
                setPrintOptions({
                  ...printOptions,
                  paperSize: e.target.value as PaperSize,
                })
              }
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 focus:outline-hidden focus:border-blue-500 font-medium"
            >
              <option value="a4-portrait">A4 បញ្ឈរ (21.0 x 29.7 cm) - ស្តង់ដារ</option>
              <option value="a4-landscape">A4 ផ្តេក (29.7 x 21.0 cm)</option>
              <option value="a3-portrait">A3 បញ្ឈរ (29.7 x 42.0 cm) - ធំ</option>
              <option value="a3-landscape">A3 ផ្តេក (42.0 x 29.7 cm)</option>
              <option value="letter">Letter (21.6 x 27.9 cm)</option>
              <option value="card-direct">
                តាមទំហំប័ណ្ណផ្ទាល់ ({(cardW / 10).toFixed(1)} x {(cardH / 10).toFixed(1)} cm - ១កាត/ទំព័រ)
              </option>
            </select>
          </div>

          {/* 3. Cut Line & Stamp Controls */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-neutral-600" />
              <span>បន្ទាត់កាត់ & ត្រាសាលា</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={printOptions.borderStyle}
                onChange={(e) =>
                  setPrintOptions({
                    ...printOptions,
                    borderStyle: e.target.value as any,
                  })
                }
                className="flex-1 px-2 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="dashed">បន្ទាត់ដាច់ៗ</option>
                <option value="solid">បន្ទាត់ជាប់</option>
                <option value="dotted">បន្ទាត់ចុចៗ</option>
                <option value="none">គ្មានបន្ទាត់</option>
              </select>

              {/* Front/Back toggle */}
              <button
                type="button"
                onClick={() =>
                  setPrintOptions({
                    ...printOptions,
                    showBackSide: !printOptions.showBackSide,
                  })
                }
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  printOptions.showBackSide
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
                title="ប្តូររវាងផ្នែកខាងមុខ ឬផ្នែកខាងក្រោយ"
              >
                {printOptions.showBackSide ? 'ខាងក្រោយ' : 'ខាងមុខ'}
              </button>

              {/* Stamp toggle */}
              <button
                type="button"
                onClick={() => {
                  const currentVal = printOptions.showStamp ?? (school.template_config?.showStamp !== false);
                  const nextVal = !currentVal;
                  setPrintOptions({
                    ...printOptions,
                    showStamp: nextVal,
                  });
                  if (onSaveTemplate && school.template_config) {
                    onSaveTemplate({
                      ...school.template_config,
                      showStamp: nextVal,
                    });
                  }
                }}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shrink-0 ${
                  (printOptions.showStamp ?? (school.template_config?.showStamp !== false))
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-300 line-through'
                }`}
                title="បើក/បិទ ត្រាសាលា"
              >
                ត្រា
              </button>

              {/* Edit Template shortcut */}
              {onGoToTemplateEditor && (
                <button
                  type="button"
                  onClick={onGoToTemplateEditor}
                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="កែសម្រួលទំហំ ឬរូបរាង Template"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-blue-950 gap-2">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-900">
                ការណែនាំលើផ្ទាំង Browser Print (Ctrl + P) ដើម្បីបាន ៦ កាតពេញសន្លឹក A4 ស្អាត៖
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-700 mt-1">
                <span>
                  1. Margins (គែម)៖ <strong className="text-blue-700 font-bold">None (គ្មានគែម)</strong>
                </span>
                <span>•</span>
                <span>
                  2. Scale (មាត្រដ្ឋាន)៖ <strong className="text-blue-700 font-bold">100% (ឬ Default)</strong>
                </span>
                <span>•</span>
                <span>
                  3. Options៖ គូសធីក <strong className="text-blue-700 font-bold">"Background graphics"</strong> (ដើម្បីចេញពណ៌ផ្ទៃកាត)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 border border-blue-200 rounded px-2.5 py-1 text-[11px] font-semibold text-blue-800 shrink-0">
            {cardsPerPage} ប័ណ្ណក្នុងមួយសន្លឹក
          </div>
        </div>
      </div>

      {/* Export Error Alert if any */}
      {exportError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700 font-kantumruy">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* PDF Generation Progress Modal */}
      {isExportingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-neutral-200 flex flex-col items-center text-center font-kantumruy">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 animate-pulse">
              <FileDown className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              កំពុងបង្កើតឯកសារ PDF...
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              {exportProgress?.statusText || 'កំពុងដំណើរការ សូមរង់ចាំបន្តិច...'}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: exportProgress
                    ? `${(exportProgress.currentPage / exportProgress.totalPages) * 100}%`
                    : '30%',
                }}
              />
            </div>
            <div className="flex justify-between w-full text-[11px] text-neutral-400 font-mono">
              <span>ទំព័រ {exportProgress?.currentPage || 1}</span>
              <span>{exportProgress?.totalPages || totalPages} ទំព័រ</span>
            </div>
          </div>
        </div>
      )}

      {/* Large batch chunk pagination if list is very large */}
      {isLargeSet && (
        <div className="no-print flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-3 font-kantumruy text-xs">
          <span className="text-neutral-600">
            បញ្ជីសិស្សមានចំនួនច្រើន ({students.length} នាក់) — បែងចែកជាផ្នែកដើម្បីដំណើរការលឿន៖
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalBatchChunks }).map((_, chunkIdx) => (
              <button
                key={chunkIdx}
                onClick={() => setBatchRange(chunkIdx)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                  batchRange === chunkIdx
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                ផ្នែកទី {chunkIdx + 1} ({chunkIdx * BATCH_SIZE + 1}-
                {Math.min((chunkIdx + 1) * BATCH_SIZE, students.length)})
              </button>
            ))}
            <button
              onClick={() => setBatchRange('ALL')}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                batchRange === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              ទាំងអស់ ({students.length})
            </button>
          </div>
        </div>
      )}

      {/* Sheet Preview & Actual Print Surface */}
      <div className="w-full flex justify-center overflow-x-auto p-4 bg-neutral-200/50 rounded-xl print:bg-transparent print:p-0 print:m-0">
        <PrintSheetLayout
          students={activeStudents}
          school={school}
          options={printOptions}
        />
      </div>
    </div>
  );
};
