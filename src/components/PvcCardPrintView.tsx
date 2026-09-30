import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  ArrowLeft,
  Settings2,
  FileDown,
  Loader2,
  AlertCircle,
  RotateCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student, SchoolSettings, PvcPrintOptions, PvcCardStandard, PvcPrinterTrayType, CardTemplateConfig } from '../types';
import { StudentCard } from './StudentCard';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';
import { exportPvcCardsToPdf, PdfExportProgress } from '../lib/pdfExport';

interface PvcCardPrintViewProps {
  students: Student[];
  school: SchoolSettings;
  selectedStudentIds?: Set<string>;
  onBackToStudents: () => void;
  onGoToTemplateEditor?: () => void;
}

export const PvcCardPrintView: React.FC<PvcCardPrintViewProps> = ({
  students,
  school,
  selectedStudentIds,
  onBackToStudents,
  onGoToTemplateEditor,
}) => {
  const baseCfg = getEffectiveTemplateConfig(school.template_config);
  const isTemplateLandscape = baseCfg.orientation === 'landscape';

  // Default PVC options: Match standard CR-80 card dimensions (54mm x 85.6mm)
  const [options, setOptions] = useState<PvcPrintOptions>(() => {
    return {
      cardStandard: isTemplateLandscape ? 'cr80-landscape' : 'cr80-portrait',
      widthMm: isTemplateLandscape ? 85.6 : 54.0,
      heightMm: isTemplateLandscape ? 54.0 : 85.6,
      cornerRadiusMm: 3.18,
      printerTrayType: 'direct-single',
      sideMode: 'front-only',
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      showStamp: baseCfg.showStamp !== false,
    };
  });

  // Fit style: 'contain' ensures all text/margins fit safely; 'cover' fills 100% border-to-border (edge-to-edge bleed)
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('cover');

  // Preview state
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [previewStudentIndex, setPreviewStudentIndex] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showCardMockupEffect, setShowCardMockupEffect] = useState<boolean>(true);

  // Student filter / selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlySelected, setOnlySelected] = useState<boolean>(() => {
    return !!(selectedStudentIds && selectedStudentIds.size > 0);
  });

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Print Container Ref
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Manage body class `.pvc-print-mode` for non-A4 print page size
  useEffect(() => {
    document.body.classList.add('pvc-print-mode');
    return () => {
      document.body.classList.remove('pvc-print-mode');
    };
  }, []);

  // Filter students based on selection and search
  const filteredStudents = useMemo(() => {
    let list = students;
    if (onlySelected && selectedStudentIds && selectedStudentIds.size > 0) {
      list = list.filter((s) => selectedStudentIds.has(s.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.student_id?.toLowerCase().includes(q) ||
          s.latin_name?.toLowerCase().includes(q) ||
          s.grade?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, onlySelected, selectedStudentIds, searchQuery]);

  const activePreviewStudent = filteredStudents[previewStudentIndex] || filteredStudents[0] || students[0];

  // Handle standard presets switch
  const handleSelectStandard = (standard: PvcCardStandard) => {
    switch (standard) {
      case 'cr80-portrait':
        setOptions((prev) => ({
          ...prev,
          cardStandard: 'cr80-portrait',
          widthMm: 54.0,
          heightMm: 85.6,
          cornerRadiusMm: 3.18,
        }));
        break;
      case 'cr80-landscape':
        setOptions((prev) => ({
          ...prev,
          cardStandard: 'cr80-landscape',
          widthMm: 85.6,
          heightMm: 54.0,
          cornerRadiusMm: 3.18,
        }));
        break;
      case 'cr79':
        setOptions((prev) => ({
          ...prev,
          cardStandard: 'cr79',
          widthMm: 52.1,
          heightMm: 83.9,
          cornerRadiusMm: 3.18,
        }));
        break;
      case 'cr100':
        setOptions((prev) => ({
          ...prev,
          cardStandard: 'cr100',
          widthMm: 67.0,
          heightMm: 98.5,
          cornerRadiusMm: 3.5,
        }));
        break;
      case 'custom':
        setOptions((prev) => ({
          ...prev,
          cardStandard: 'custom',
        }));
        break;
    }
  };

  // Base dimensions of the StudentCard template
  const cardW = baseCfg.cardWidthMm || (isTemplateLandscape ? 128 : 92);
  const cardH = baseCfg.cardHeightMm || (isTemplateLandscape ? 92 : 128);

  // Compute scaling ratio from template base size to target PVC size
  const scaleW = options.widthMm / cardW;
  const scaleH = options.heightMm / cardH;
  const autoScale = fitMode === 'cover' ? Math.max(scaleW, scaleH) : Math.min(scaleW, scaleH);
  const finalScale = autoScale * options.scale;

  // Print execution
  const handlePrint = () => {
    window.print();
  };

  // Dedicated PVC PDF Export
  const handleExportPdf = async () => {
    if (filteredStudents.length === 0) return;

    try {
      setIsExportingPdf(true);
      setExportError(null);

      const container = printContainerRef.current;
      if (!container) {
        throw new Error('រកមិនឃើញផ្ទាំងបោះពុម្ពកាតឡើយ។');
      }

      const cardElements = Array.from(
        container.querySelectorAll<HTMLElement>('.pvc-card-render-target')
      );

      if (cardElements.length === 0) {
        throw new Error('មិនមានប័ណ្ណសម្រាប់បង្កើត PDF ឡើយ។');
      }

      const cleanSchoolName = school.school_name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'សាលា';
      const sideText =
        options.sideMode === 'duplex'
          ? 'មុខក្រោយ_Duplex'
          : options.sideMode === 'back-only'
          ? 'ខាងក្រោយ_Back'
          : 'ខាងមុខ_Front';
      const fileName = `ប័ណ្ណកាតរឹង_PVC_${cleanSchoolName}_${options.widthMm}x${options.heightMm}mm_${sideText}.pdf`;

      await exportPvcCardsToPdf(
        cardElements,
        options.widthMm,
        options.heightMm,
        fileName,
        (progress) => {
          setExportProgress(progress);
        }
      );
    } catch (err: any) {
      console.error('PVC PDF export failed:', err);
      setExportError(err?.message || 'មានបញ្ហាក្នុងការបង្កើតឯកសារ PDF កាតរឹង។ សូមសាកល្បង Ctrl+P វិញ។');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  // Build the list of cards to render for print/PDF (single-sided vs duplex)
  interface RenderCardItem {
    id: string;
    student: Student;
    side: 'front' | 'back';
    pageNumber: number;
  }

  const renderCardItems = useMemo<RenderCardItem[]>(() => {
    const items: RenderCardItem[] = [];
    let pageNum = 1;

    filteredStudents.forEach((student) => {
      if (options.sideMode === 'front-only') {
        items.push({
          id: `${student.id}-front`,
          student,
          side: 'front',
          pageNumber: pageNum++,
        });
      } else if (options.sideMode === 'back-only') {
        items.push({
          id: `${student.id}-back`,
          student,
          side: 'back',
          pageNumber: pageNum++,
        });
      } else {
        // Duplex: Front page followed immediately by Back page
        items.push({
          id: `${student.id}-front`,
          student,
          side: 'front',
          pageNumber: pageNum++,
        });
        items.push({
          id: `${student.id}-back`,
          student,
          side: 'back',
          pageNumber: pageNum++,
        });
      }
    });

    return items;
  }, [filteredStudents, options.sideMode]);

  return (
    <div className="space-y-6">
      {/* Dynamic @page CSS rule for direct card printers */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${options.widthMm}mm ${options.heightMm}mm !important;
                margin: 0 !important;
              }
            }
          `,
        }}
      />

      {/* Top Controls Toolbar */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-5 shadow-xs font-kantumruy">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Back button and title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudents}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="ត្រឡប់ទៅតារាងសិស្ស"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-sky-950 font-muol leading-tight">
                  បោះពុម្ពកាតរឹង (PVC Hard Card Print)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  CR-80 Direct
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                មុខងារ Print ដាច់ដោយឡែកសម្រាប់ម៉ាស៊ីនបោះពុម្ពកាត PVC ផ្ទាល់ (Zebra, Fargo, Evolis) និងថាសកាត Epson
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Template edit shortcut */}
            {onGoToTemplateEditor && (
              <button
                onClick={onGoToTemplateEditor}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                title="កែសម្រួលពុម្ពកាត"
              >
                <Settings2 className="w-4 h-4 text-neutral-600" />
                <span>កែ Template</span>
              </button>
            )}

            {/* Guide Accordion Toggle */}
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                showGuide
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>ការណែនាំម៉ាស៊ីន Print</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Export Dedicated PVC PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || filteredStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="ទាញយកជាឯកសារ PDF ទំហំ CR-80 សម្រាប់បញ្ជូនទៅម៉ាស៊ីនបោះពុម្ព"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>{exportProgress ? `${exportProgress.currentPage}/${exportProgress.totalPages}` : 'កំពុងបង្កើត PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  <span>ទាញយក PDF កាតរឹង</span>
                </>
              )}
            </button>

            {/* Direct Browser Print (window.print) */}
            <button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បញ្ជា Print ឥឡូវនេះ (Ctrl+P)</span>
            </button>
          </div>

        </div>

        {/* Printer Driver Setup Guide Accordion */}
        {showGuide && (
          <div className="mt-4 pt-4 border-t border-neutral-200 bg-sky-50/70 p-4 rounded-xl text-xs text-sky-950 space-y-2 border border-sky-200">
            <h4 className="font-bold text-sky-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-700" />
              របៀបកំណត់ Printer Driver លើកុំព្យូទ័រ ដើម្បីកុំឱ្យខុសទំហំម៉ាស៊ីន៖
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-sky-200">
                <span className="font-bold text-blue-700 block mb-0.5">១. Paper Size (ទំហំក្រដាស)</span>
                <p className="text-neutral-600">
                  ជ្រើសរើស <strong>CR-80 Card</strong> ឬ <strong>54.0 x 85.6 mm</strong> (កុំជ្រើសរើស A4)។
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-200">
                <span className="font-bold text-blue-700 block mb-0.5">២. Margins (គែម)</span>
                <p className="text-neutral-600">
                  ជ្រើសរើស <strong>None (គ្មានគែម)</strong> ឬ <strong>0 mm</strong> ដើម្បីបោះពុម្ពពេញផ្ទៃកាត។
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-200">
                <span className="font-bold text-blue-700 block mb-0.5">៣. Scale (មាត្រដ្ឋាន)</span>
                <p className="text-neutral-600">
                  ជ្រើសរើស <strong>100% (Actual Size / Default)</strong>។ ជៀសវាង "Fit to page"។
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-200">
                <span className="font-bold text-blue-700 block mb-0.5">៤. Background Graphics</span>
                <p className="text-neutral-600">
                  ត្រូវប្រាកដថាបាន <strong>Check / បើក "Background graphics"</strong> ក្នុងផ្ទាំង Print Browser។
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Error Alert */}
        {exportError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{exportError}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Control Panel (Left) & Live Preview (Right) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 font-kantumruy">
        
        {/* Left Control Panel: Dimensions, Calibration & Sides */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 1. Card Standard & Exact Dimensions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>ស្តង់ដារទំហំកាតរឹង (Card Standard)</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {options.widthMm} × {options.heightMm} mm
              </span>
            </div>

            {/* Standard Presets */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectStandard('cr80-portrait')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.cardStandard === 'cr80-portrait'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">CR-80 បញ្ឈរ</span>
                  <span className="text-[10px] text-neutral-500 font-mono">54 × 85.6 mm</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">ស្តង់ដារកាតបុគ្គលិក / កាតសិស្ស</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStandard('cr80-landscape')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.cardStandard === 'cr80-landscape'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">CR-80 ផ្តេក</span>
                  <span className="text-[10px] text-neutral-500 font-mono">85.6 × 54 mm</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">ស្តង់ដារកាតធនាគារ ATM / ប្លង់ផ្តេក</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStandard('cr79')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.cardStandard === 'cr79'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">CR-79 កាវបិទ</span>
                  <span className="text-[10px] text-neutral-500 font-mono">52.1 × 83.9 mm</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">សម្រាប់បិទលើកាត Clamshell Proximity</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStandard('custom')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.cardStandard === 'custom'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">កំណត់ដោយដៃ</span>
                  <span className="text-[10px] text-neutral-500">Custom mm</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">បញ្ចូលទទឹង និងបណ្តោយតាមម៉ាស៊ីន</p>
              </button>
            </div>

            {/* Custom Dimensions Input (Visible if custom or fine-tuning) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  ទទឹង (Width mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="150"
                  value={options.widthMm}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      widthMm: parseFloat(e.target.value) || 54.0,
                      cardStandard: 'custom',
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  បណ្តោយ (Height mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="150"
                  value={options.heightMm}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      heightMm: parseFloat(e.target.value) || 85.6,
                      cardStandard: 'custom',
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  កោងជ្រុង (Radius mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={options.cornerRadiusMm}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      cornerRadiusMm: parseFloat(e.target.value) || 3.18,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2. Side Selection & Printer Tray Type */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>ជ្រើសរើសផ្នែកបោះពុម្ព (Print Sides)</span>
            </h3>

            {/* Side Mode Buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, sideMode: 'front-only' }))}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  options.sideMode === 'front-only'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <span>ខាងមុខតែមួយ</span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">Front Only</span>
              </button>

              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, sideMode: 'back-only' }))}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  options.sideMode === 'back-only'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <span>ខាងក្រោយតែមួយ</span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">Back Only</span>
              </button>

              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, sideMode: 'duplex' }))}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  options.sideMode === 'duplex'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <span>មុខ-ក្រោយ (Duplex)</span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">Double-sided</span>
              </button>
            </div>

            {/* Stamp & Fit Mode Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showStamp}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showStamp: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
                />
                <span className="text-neutral-800 font-medium">បង្ហាញត្រាក្រហម</span>
              </label>

              <button
                type="button"
                onClick={() => setFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-left transition-colors"
                title="ប្តូររវាង ពង្រីកពេញគែម (Cover Bleed) ឬ រក្សាសុវត្ថិភាពអក្សរ (Contain Fit)"
              >
                <span className="text-neutral-700 font-medium">កម្រិតពេញគែម៖</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                  {fitMode === 'cover' ? 'ពេញគែម (Bleed)' : 'ស្តង់ដារ (Safe)'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Hardware Alignment & Calibration (Fine-tune mm Offsets) */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>ការតម្រឹមក្បាលម៉ាស៊ីន (Hardware Calibration)</span>
              </h3>
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, offsetX: 0, offsetY: 0, scale: 1 }))}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                កំណត់ទៅ 0 វិញ
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              ប្រសិនបើម៉ាស៊ីនបោះពុម្ពរបស់អ្នកស៊ីគែមឆ្វេង/ស្តាំ ឬលើ/ក្រោម អ្នកអាចរំកិល Fine-tune គិតជា mm បានភ្លាមៗ៖
            </p>

            <div className="space-y-3 text-xs">
              {/* Offset X (mm) */}
              <div>
                <div className="flex justify-between text-neutral-700 mb-1">
                  <span>រំកិល ឆ្វេង-ស្តាំ (Offset X)</span>
                  <span className="font-mono font-bold text-blue-700">
                    {options.offsetX > 0 ? `+${options.offsetX}` : options.offsetX} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.2"
                  value={options.offsetX}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, offsetX: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Offset Y (mm) */}
              <div>
                <div className="flex justify-between text-neutral-700 mb-1">
                  <span>រំកិល លើ-ក្រោម (Offset Y)</span>
                  <span className="font-mono font-bold text-blue-700">
                    {options.offsetY > 0 ? `+${options.offsetY}` : options.offsetY} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.2"
                  value={options.offsetY}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, offsetY: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Fine Scale (%) */}
              <div>
                <div className="flex justify-between text-neutral-700 mb-1">
                  <span>ពង្រីក/បង្រួមបន្ថែម (Zoom Scale)</span>
                  <span className="font-mono font-bold text-blue-700">
                    {Math.round(options.scale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.1"
                  step="0.01"
                  value={options.scale}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, scale: parseFloat(e.target.value) || 1 }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Student Selection & Filter */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-bold text-sm text-neutral-900">
                បញ្ជីសិស្សត្រូវបោះពុម្ព ({filteredStudents.length} នាក់)
              </h3>
              {selectedStudentIds && selectedStudentIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlySelected(!onlySelected)}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                    onlySelected
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {onlySelected ? '✓ តែសិស្សដែលបានជ្រើស' : 'សិស្សទាំងអស់'}
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPreviewStudentIndex(0);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Quick Student Selector for Preview */}
            <div className="max-h-36 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg p-1.5 text-xs">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-neutral-400 py-3 text-[11px]">រកមិនឃើញសិស្សឡើយ</p>
              ) : (
                filteredStudents.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPreviewStudentIndex(idx)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                      idx === previewStudentIndex
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {st.full_name}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500 ml-2">
                      {st.student_id}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Panel: Interactive 3D PVC Live Card Preview & Physical Footprint */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          <div className="sticky top-20 w-full flex flex-col items-center space-y-4">
            
            {/* Preview Toolbar */}
            <div className="w-full flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-800">ផ្ទាំងគំរូកាតរឹង (Realistic Preview):</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {options.widthMm}mm × {options.heightMm}mm
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 3D plastic shine toggle */}
                <button
                  type="button"
                  onClick={() => setShowCardMockupEffect(!showCardMockupEffect)}
                  className={`p-1.5 rounded-md border text-xs transition-colors ${
                    showCardMockupEffect
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                  }`}
                  title="បើក/បិទ បែបផែនពន្លឺផ្លាស្ទិក PVC"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {/* Flip Front / Back Button */}
                <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewSide('front')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      previewSide === 'front'
                        ? 'bg-white shadow-xs text-blue-700'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    ខាងមុខ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide('back')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      previewSide === 'back'
                        ? 'bg-white shadow-xs text-blue-700'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    ខាងក្រោយ
                  </button>
                </div>
              </div>
            </div>

            {/* Realistic Plastic PVC Card Live Stage */}
            <div className="relative w-full min-h-[460px] p-8 bg-neutral-900/90 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
              
              {/* Subtle background grid representing printer alignment platen */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #ffffff 1px, transparent 1px),
                    linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                  `,
                  backgroundSize: '10mm 10mm',
                }}
              />

              {/* Physical PVC Card Container */}
              {activePreviewStudent ? (
                <div
                  className="relative transition-transform duration-300"
                  style={{
                    filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.6))',
                  }}
                >
                  {/* The Physical Card Boundary with exact mm dimensions */}
                  <div
                    style={{
                      width: `${options.widthMm}mm`,
                      height: `${options.heightMm}mm`,
                      borderRadius: `${options.cornerRadiusMm}mm`,
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 2px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {/* Inner scaled card element */}
                    <div
                      style={{
                        width: `${cardW}mm`,
                        height: `${cardH}mm`,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${options.offsetX}mm, ${options.offsetY}mm) scale(${finalScale})`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                      }}
                    >
                      <StudentCard
                        student={activePreviewStudent}
                        school={school}
                        template={{
                          ...baseCfg,
                          showStamp: options.showStamp ?? true,
                        }}
                        showCutLines={false}
                        borderStyle="none"
                        showBackSide={previewSide === 'back'}
                        scale={1}
                      />
                    </div>

                    {/* Plastic Card Glossy Sheen Overlay */}
                    {showCardMockupEffect && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `
                            linear-gradient(
                              135deg,
                              rgba(255, 255, 255, 0.25) 0%,
                              rgba(255, 255, 255, 0.05) 35%,
                              transparent 50%,
                              rgba(255, 255, 255, 0.08) 70%,
                              rgba(255, 255, 255, 0.2) 100%
                            )
                          `,
                          borderRadius: `${options.cornerRadiusMm}mm`,
                        }}
                      />
                    )}
                  </div>

                  {/* Corner dimension guidelines */}
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold text-neutral-400 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded-full border border-neutral-700">
                    ទំហំពិត៖ {options.widthMm}mm × {options.heightMm}mm (R{options.cornerRadiusMm}mm)
                  </div>
                </div>
              ) : (
                <div className="text-neutral-400 text-xs">មិនមានសិស្សសម្រាប់បង្ហាញឡើយ</div>
              )}

            </div>

            {/* Quick Summary Note below card preview */}
            <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  ត្រៀមបោះពុម្ព៖ សិស្ស {filteredStudents.length} នាក់ · សរុប {renderCardItems.length} ទំព័រកាត (Pages)
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  នៅពេលចុច <strong>Print (Ctrl+P)</strong> ឬ <strong>ទាញយក PDF</strong> ប្រព័ន្ធនឹងរៀបចំទំព័រ 1 កាតក្នុង 1 សន្លឹកបោះពុម្ព (1 Card per Sheet) យ៉ាងស្វ័យប្រវត្តិតាមទំហំ CR-80 ដោយគ្មានការលេចធ្លាយ ឬខូចខាតឡើយ។
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* HIDDEN IN SCREEN, SHOWN IN PRINT & USED FOR HIGH-RES PDF EXPORT           */}
      {/* ========================================================================= */}
      <div
        id="pvc-print-output-container"
        ref={printContainerRef}
        className="w-full print:block"
        style={{
          display: isExportingPdf ? 'block' : undefined,
          position: isExportingPdf ? 'absolute' : undefined,
          left: isExportingPdf ? '-99999px' : undefined,
          top: isExportingPdf ? '-99999px' : undefined,
        }}
      >
        {renderCardItems.map((item, idx) => (
          <div
            key={item.id}
            data-pvc-card-index={idx + 1}
            className="pvc-card-page pvc-card-render-target relative bg-white"
            style={{
              width: `${options.widthMm}mm`,
              height: `${options.heightMm}mm`,
              maxWidth: `${options.widthMm}mm`,
              maxHeight: `${options.heightMm}mm`,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              margin: '0 auto',
              padding: 0,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Card inner canvas centered and scaled to exact mm */}
            <div
              style={{
                width: `${cardW}mm`,
                height: `${cardH}mm`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${options.offsetX}mm, ${options.offsetY}mm) scale(${finalScale})`,
                transformOrigin: 'center center',
              }}
            >
              <StudentCard
                student={item.student}
                school={school}
                template={{
                  ...baseCfg,
                  showStamp: options.showStamp ?? true,
                }}
                showCutLines={false}
                borderStyle="none"
                showBackSide={item.side === 'back'}
                scale={1}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
