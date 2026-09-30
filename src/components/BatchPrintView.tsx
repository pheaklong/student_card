import React, { useState, useMemo } from 'react';
import {
  Printer,
  ArrowLeft,
  Settings2,
  Scissors,
  LayoutGrid,
  Info,
  FileDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Student, SchoolSettings, PrintOptions, CardTemplateConfig } from '../types';
import { PrintSheetLayout } from './PrintSheetLayout';
import { exportPrintSheetsToPdf, PdfExportProgress } from '../lib/pdfExport';

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
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    gridMode: '6-per-page',
    showCutLines: true,
    showCropMarks: true,
    showBackSide: false,
    showStamp: school.template_config?.showStamp !== false,
    borderStyle: 'dashed',
    scale: 1,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [batchRange, setBatchRange] = useState<number | 'ALL'>(0);
  const BATCH_SIZE = 120; // 20 pages per batch chunk (smooth browser rendering and printing)

  const isLargeSet = students.length > BATCH_SIZE;
  const totalBatchChunks = Math.ceil(students.length / BATCH_SIZE);

  const activeStudents = useMemo(() => {
    if (!isLargeSet || batchRange === 'ALL') {
      return students;
    }
    const start = (typeof batchRange === 'number' ? batchRange : 0) * BATCH_SIZE;
    return students.slice(start, start + BATCH_SIZE);
  }, [students, isLargeSet, batchRange]);

  const cardsPerPage = printOptions.gridMode === '8-per-page' ? 8 : 6;
  const totalPages = Math.ceil(activeStudents.length / cardsPerPage);
  const totalAllPages = Math.ceil(students.length / cardsPerPage);

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
      const fileName = `ប័ណ្ណសិស្ស_${cleanSchoolName}_${sideText}_${printOptions.gridMode}_${dateStr}.pdf`;

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
    <div className="space-y-6">
      
      {/* Top Controls Toolbar (Hidden automatically in print mode via .no-print) */}
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
              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                <span>ចំនួនសិស្ស៖ <strong className="text-neutral-900 font-mono">{students.length}</strong> នាក់</span>
                <span>·</span>
                <span>សន្លឹក A4 សរុប៖ <strong className="text-neutral-900 font-mono">{totalPages}</strong> ទំព័រ</span>
                <span>·</span>
                <span>ទម្រង់៖ <strong className="text-blue-700">{printOptions.gridMode === '6-per-page' ? '៦ ប័ណ្ណ/ទំព័រ' : '៨ ប័ណ្ណ/ទំព័រ'}</strong></span>
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Grid mode switcher */}
            <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-100 text-xs">
              <button
                type="button"
                onClick={() => setPrintOptions({ ...printOptions, gridMode: '6-per-page' })}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  printOptions.gridMode === '6-per-page'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ៦ ប័ណ្ណ/ទំព័រ (ស្តង់ដារ)
              </button>
              <button
                type="button"
                onClick={() => setPrintOptions({ ...printOptions, gridMode: '8-per-page' })}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  printOptions.gridMode === '8-per-page'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ៨ ប័ណ្ណ/ទំព័រ
              </button>
            </div>

            {/* Front / Back Toggle */}
            <button
              type="button"
              onClick={() =>
                setPrintOptions({
                  ...printOptions,
                  showBackSide: !printOptions.showBackSide,
                })
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                printOptions.showBackSide
                  ? 'bg-purple-50 text-purple-800 border-purple-300 font-semibold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {printOptions.showBackSide ? 'ផ្នែកខាងក្រោយ (Back)' : 'ផ្នែកខាងមុខ (Front)'}
            </button>

            {/* Stamp Visibility Toggle Button */}
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                (printOptions.showStamp ?? (school.template_config?.showStamp !== false))
                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold shadow-2xs hover:bg-rose-100'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
              title="ចុចដើម្បីប្តូររវាង បង្ហាញត្រា ឬ អត់បង្ហាញត្រា (Toggle Stamp Display)"
            >
              <span>{(printOptions.showStamp ?? (school.template_config?.showStamp !== false)) ? '🔴' : '⚪'}</span>
              <span>{(printOptions.showStamp ?? (school.template_config?.showStamp !== false)) ? 'បង្ហាញត្រា' : 'អត់បង្ហាញត្រា'}</span>
            </button>

            {/* Template Studio Shortcut Button */}
            {onGoToTemplateEditor && (
              <button
                type="button"
                onClick={onGoToTemplateEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title="កែសម្រួលគំរូប័ណ្ណតាមចិត្ត (Customize ID Card Template)"
              >
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span>កែ Template កាត</span>
              </button>
            )}

            {/* Cut line border style */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Scissors className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={printOptions.borderStyle}
                onChange={(e) =>
                  setPrintOptions({
                    ...printOptions,
                    borderStyle: e.target.value as any,
                  })
                }
                className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs bg-white focus:outline-hidden"
              >
                <option value="dashed">បន្ទាត់កាត់ដាច់ៗ (Dashed)</option>
                <option value="solid">បន្ទាត់កាត់ជាប់ (Solid)</option>
                <option value="dotted">បន្ទាត់ចុចៗ (Dotted)</option>
                <option value="none">គ្មានបន្ទាត់ (No Border)</option>
              </select>
            </div>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
              title="ទាញយកឯកសារជា PDF ដោយផ្ទាល់"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-200" />
              )}
              <span>{isExportingPdf ? 'កំពុងបង្កើត PDF...' : 'ទាញយកជា PDF'}</span>
            </button>

            {/* Primary Print Button (Browser Print dialog) */}
            <button
              onClick={handlePrint}
              disabled={isExportingPdf || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
              title="បញ្ជាបោះពុម្ពលើម៉ាស៊ីនព្រីន ឬរក្សាទុកតាម Browser"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>បោះពុម្ព A4 (Print)</span>
            </button>
          </div>

        </div>

        {/* Export Error Alert if any */}
        {exportError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
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

        {/* Helpful Print Tips Note */}
        <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between text-[11px] text-neutral-600 gap-2">
          <div className="flex items-start md:items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 md:mt-0" />
            <span>
              <strong>ការណែនាំ៖</strong> លោកអ្នកអាចចុច <strong>«ទាញយកជា PDF»</strong> ដើម្បីទាញយក file PDF ផ្ទាល់ ឬចុច <strong>«បោះពុម្ព A4» (Ctrl+P)</strong> ដើម្បីបញ្ជាម៉ាស៊ីនព្រីន (ក្នុងផ្ទាំង Print Dialog សូមជ្រើស Margin: <strong>None (គ្មានគែម)</strong> និងគូសធីក <strong>"Background graphics"</strong>)។
            </span>
          </div>

          <span className="text-neutral-400 font-mono shrink-0">
            Ctrl + P / Cmd + P
          </span>
        </div>
      </div>

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

      {/* Sheet Preview & Actual Print Surface */}
      <div className="w-full flex justify-center overflow-x-auto p-4 bg-neutral-200/50 rounded-xl print:bg-transparent print:p-0 print:m-0">
        <PrintSheetLayout
          students={students}
          school={school}
          options={printOptions}
        />
      </div>

    </div>
  );
};
