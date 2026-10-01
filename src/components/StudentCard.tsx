import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from 'lucide-react';
import { SchoolSettings, Student, CardTemplateConfig } from '../types';
import { MoEYSEmblem, OfficialRedStamp, PrincipalSignature, DefaultStudentAvatar } from './CambodianEmblems';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';
import { formatDriveImageUrl, getDriveImageFallbackUrl } from '../lib/driveUtils';
import { resolveStudentQrCode } from '../lib/qrUtils';
import { getStudentLatinName } from '../lib/khmerTranslit';
import { formatKhmerDob, toKhmerDigits } from '../lib/khmerDateUtils';
import { formatPhoneNumber } from '../lib/phoneUtils';

interface StudentCardProps {
  student: Student;
  school: SchoolSettings;
  template?: CardTemplateConfig;
  showCutLines?: boolean;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  showBackSide?: boolean;
  scale?: number;
  className?: string;
  activeHighlightElement?:
    | 'card'
    | 'logo'
    | 'header'
    | 'headerKingdom'
    | 'headerMotto'
    | 'headerMinistry'
    | 'headerDepartment'
    | 'headerSchoolName'
    | 'title'
    | 'subtitle'
    | 'photo'
    | 'info'
    | 'stamp'
    | 'signature'
    | 'qr'
    | 'date'
    | 'principalTitle'
    | 'principalName'
    | null;
  onSelectElement?: (element: any) => void;
  onNudgeElement?: (element: string, dx: number, dy: number) => void;
  onUpdateOffset?: (element: string, offsetX: number, offsetY: number) => void;
  onResetElement?: (element: string) => void;
  onUpdateSize?: (element: string, delta: number) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  school,
  template: propTemplate,
  showCutLines = true,
  borderStyle = 'dashed',
  showBackSide = false,
  scale = 1,
  className = '',
  activeHighlightElement = null,
  onSelectElement,
  onNudgeElement,
  onUpdateOffset,
  onResetElement,
  onUpdateSize,
}) => {
  const cfg = getEffectiveTemplateConfig(propTemplate || school.template_config);

  // Direct mouse / touch dragging handler for on-card elements
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    element: string,
    initialX: number,
    initialY: number
  ) => {
    if (!onUpdateOffset && !onNudgeElement) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    e.stopPropagation();
    onSelectElement?.(element as any);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startX = clientX;
    const startY = clientY;
    const currentScale = scale || 1;

    const handlePointerMove = (moveEvt: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : (moveEvt as MouseEvent).clientX;
      const curY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : (moveEvt as MouseEvent).clientY;
      const deltaX = Math.round((curX - startX) / currentScale);
      const deltaY = Math.round((curY - startY) / currentScale);

      if (moveEvt.cancelable) moveEvt.preventDefault();
      if (onUpdateOffset) {
        onUpdateOffset(element, initialX + deltaX, initialY + deltaY);
      } else if (onNudgeElement) {
        onNudgeElement(element, deltaX, deltaY);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  // Reusable floating quick-nudge toolbar for any active element
  const renderNudgeToolbar = (
    elementName: string,
    curX: number,
    curY: number,
    placement: 'top' | 'bottom' = 'top'
  ) => {
    if (activeHighlightElement !== elementName || (!onNudgeElement && !onUpdateOffset)) return null;
    return (
      <div
        className={`absolute ${placement === 'top' ? '-top-7' : '-bottom-7'} left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-xl border border-blue-400/60 z-50 pointer-events-auto whitespace-nowrap text-[9px] font-sans`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-[8px] text-blue-300 px-1">
          X:{curX} Y:{curY}
        </span>
        <button
          type="button"
          onClick={() => onNudgeElement ? onNudgeElement(elementName, -2, 0) : onUpdateOffset?.(elementName, curX - 2, curY)}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
          title="រំកិលឆ្វេង"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => onNudgeElement ? onNudgeElement(elementName, 0, -2) : onUpdateOffset?.(elementName, curX, curY - 2)}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
          title="រំកិលឡើង"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onNudgeElement ? onNudgeElement(elementName, 0, 2) : onUpdateOffset?.(elementName, curX, curY + 2)}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
          title="រំកិលចុះ"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => onNudgeElement ? onNudgeElement(elementName, 2, 0) : onUpdateOffset?.(elementName, curX + 2, curY)}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
          title="រំកិលស្តាំ"
        >
          ▶
        </button>
        {onResetElement && (
          <button
            type="button"
            onClick={() => onResetElement(elementName)}
            className="px-1 h-4 flex items-center justify-center rounded bg-blue-700/80 hover:bg-blue-500 text-white font-mono text-[7.5px] cursor-pointer ml-0.5 transition-colors"
            title="កំណត់ដើម (0, 0)"
          >
            ↺0
          </button>
        )}
        {onUpdateSize && (
          <div className="flex items-center gap-0.5 border-l border-slate-700 pl-1 ml-0.5">
            <button
              type="button"
              onClick={() => onUpdateSize(elementName, -1)}
              className="px-1 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="បន្ថយទំហំអក្សរ (A-)"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize(elementName, 1)}
              className="px-1 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="ពង្រីកទំហំអក្សរ (A+)"
            >
              A+
            </button>
          </div>
        )}
      </div>
    );
  };

  const borderClasses = {
    solid: 'border border-neutral-300',
    dashed: 'border border-dashed border-neutral-400',
    dotted: 'border border-dotted border-neutral-400',
    none: 'border-0',
  }[borderStyle];

  const isLandscape = cfg.orientation === 'landscape';
  const isKamriengLayout = (cfg.cardLayoutMode === 'kamrieng-official' || cfg.presetId === 'kamrieng-official') && !isLandscape;
  const cardWidth = cfg.cardWidthMm ? `${cfg.cardWidthMm}mm` : (isLandscape ? '128mm' : '92mm');
  const cardHeight = cfg.cardHeightMm ? `${cfg.cardHeightMm}mm` : (isLandscape ? '92mm' : '128mm');
  const cardRadius = `${cfg.cardBorderRadiusMm ?? 3}mm`;
  const baseInfoSize = cfg.infoFontSize || (isLandscape ? 8.2 : 8.6);
  const defaultLabelWidthMm = isLandscape ? 28 : 27;
  const labelWidth = cfg.infoLabelWidth
    ? (cfg.infoLabelWidth <= 45 ? `${cfg.infoLabelWidth}mm` : `${cfg.infoLabelWidth}px`)
    : `${defaultLabelWidthMm}mm`;

  // Inner border styles
  const getInnerBorderClasses = () => {
    switch (cfg.innerBorderType) {
      case 'double':
        return 'border-2 border-double';
      case 'ornamental':
        return 'border-2 border-solid relative';
      case 'minimal':
        return 'border border-neutral-200';
      case 'none':
        return 'border-0';
      case 'single':
      default:
        return 'border';
    }
  };

  // Photo shape styles
  const getPhotoShapeClass = () => {
    switch (cfg.photoShape) {
      case 'rounded':
        return 'rounded-lg';
      case 'oval':
        return 'rounded-full aspect-square';
      case 'rect-3x4':
      default:
        return 'rounded-[2px]';
    }
  };

  // Dynamic Latin name generation if not explicitly provided
  const displayLatinName = student.latin_name || getStudentLatinName(student);

  // Dynamic QR Code redirection URL
  const qrCodeUrl = resolveStudentQrCode(
    student.student_id,
    school.qr_base_url,
    student.qr_code_data
  );

  // ==========================================
  // BACK SIDE OF CARD
  // ==========================================
  if (showBackSide) {
    return (
      <div
        className={`card-print-container relative overflow-hidden select-none ${showCutLines ? borderClasses : ''} ${className}`}
        style={{
          width: cardWidth,
          height: cardHeight,
          padding: isLandscape ? '5mm 7mm 4mm 7mm' : '6mm 6mm 5mm 6mm',
          backgroundColor: cfg.cardBgColor || '#ffffff',
          color: '#171717',
          boxSizing: 'border-box',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {/* Decorative background watermark */}
        {cfg.showWatermark !== false && cfg.watermarkOpacity > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: cfg.watermarkOpacity }}
          >
            {cfg.watermarkType !== 'moeys-emblem' && school.logo_url ? (
              <img
                src={school.logo_url}
                alt="School Watermark Logo"
                className="object-contain select-none pointer-events-none max-w-[75%] max-h-[75%]"
                style={{
                  width: `${cfg.watermarkSize || (isLandscape ? 130 : 160)}px`,
                  height: `${cfg.watermarkSize || (isLandscape ? 130 : 160)}px`,
                }}
              />
            ) : (
              <MoEYSEmblem size={cfg.watermarkSize || (isLandscape ? 130 : 160)} />
            )}
          </div>
        )}

        {/* Backside Header */}
        <div
          className="text-center pb-2 mb-2.5 border-b"
          style={{ borderColor: cfg.primaryColor || '#0c4a6e' }}
        >
          <h4
            className="font-muol text-[11px] leading-relaxed"
            style={{ color: cfg.primaryColor || '#0c4a6e' }}
          >
            {cfg.backsideTitle || 'បទបញ្ជាផ្ទៃក្នុង & លក្ខខណ្ឌប្រើប្រាស់'}
          </h4>
          {cfg.backsideSubtitle && (
            <p className="text-[8.5px] font-kantumruy text-neutral-600 tracking-wider">
              {cfg.backsideSubtitle}
            </p>
          )}
        </div>

        {/* Rules List */}
        {cfg.showBacksideRules && cfg.backsideRules && cfg.backsideRules.length > 0 && (
          <div
            className={`font-kantumruy leading-relaxed text-neutral-800 ${
              isLandscape ? 'space-y-1.5 text-[8.5px]' : 'space-y-2 text-[9.2px]'
            }`}
          >
            {cfg.backsideRules.map((rule, idx) => (
              <div key={idx} className="flex gap-1.5 items-start">
                <span
                  className="font-bold shrink-0 font-kantumruy"
                  style={{ color: cfg.primaryColor || '#0c4a6e' }}
                >
                  {idx + 1}.
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        )}

        {/* School Contact Box */}
        {cfg.showBacksideContact && (
          <div
            className={`pt-2.5 border-t border-dashed border-neutral-300 font-kantumruy space-y-1 text-neutral-700 ${
              isLandscape ? 'mt-2 text-[8px]' : 'mt-4 text-[8.5px]'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-semibold text-neutral-900">គ្រឹះស្ថានសិក្សា៖</span>
              <span className="font-medium" style={{ color: cfg.primaryColor }}>
                {school.school_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-neutral-900">ទីតាំង៖</span>
              <span className="truncate max-w-[65mm] text-right">
                {school.school_address || 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-neutral-900">ទូរស័ព្ទទាក់ទង៖</span>
              <span className="font-mono text-neutral-900 font-semibold">
                {school.contact_number || '095 858 545'}
              </span>
            </div>
          </div>
        )}

        {/* Backside Verification Code */}
        {cfg.showBacksideQr && (
          <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between pt-2 border-t border-neutral-200">
            <div>
              <p className="text-[7.5px] font-kantumruy text-neutral-500">
                ស្កេនដើម្បីផ្ទៀងផ្ទាត់ទិន្នន័យផ្លូវការ
              </p>
              <p className="text-[9px] font-mono font-bold" style={{ color: cfg.primaryColor }}>
                {student.student_id}
              </p>
            </div>
            <QRCodeSVG
              value={qrCodeUrl}
              size={36}
              level="M"
            />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // FRONT SIDE OF CARD (PORTRAIT & LANDSCAPE)
  // ==========================================
  const logoDimensions = {
    small: { width: 30, height: 30 },
    medium: { width: 38, height: 38 },
    large: { width: 46, height: 46 },
  }[cfg.logoSize || 'medium'];

  // On-card floating controls for Photo (Zoom, Dimensions, Nudge, Reset)
  const renderPhotoControls = () => {
    if (activeHighlightElement !== 'photo' || (!onNudgeElement && !onUpdateOffset && !onUpdateSize)) return null;
    const curZoom = cfg.photoZoom || 1;
    const curW = cfg.photoWidthMm || (isKamriengLayout ? 27 : (isLandscape ? 24 : 23));
    const curH = cfg.photoHeightMm || (isKamriengLayout ? 36 : 31);

    return (
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-xl border border-blue-400/60 z-50 pointer-events-auto whitespace-nowrap text-[9px] font-sans"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-[8px] text-blue-300 px-0.5 font-bold">
          {Math.round(curZoom * 100)}%
        </span>
        {onUpdateSize && (
          <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1 mr-0.5">
            <button
              type="button"
              onClick={() => onUpdateSize('photoZoom', -1)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="បង្រួមរូប (Zoom Out -5%)"
            >
              🔍-
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('photoZoom', 1)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="ពង្រីករូប (Zoom In +5%)"
            >
              🔍+
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('photoWidth', -1)}
              className="px-0.5 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-mono text-[7.5px] cursor-pointer active:scale-90"
              title={`បន្ថយទទឹង (-1mm) បច្ចុប្បន្ន ${curW}mm`}
            >
              ↔-
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('photoWidth', 1)}
              className="px-0.5 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-mono text-[7.5px] cursor-pointer active:scale-90"
              title={`បង្កើនទទឹង (+1mm) បច្ចុប្បន្ន ${curW}mm`}
            >
              ↔+
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('photoHeight', -1)}
              className="px-0.5 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-mono text-[7.5px] cursor-pointer active:scale-90"
              title={`បន្ថយកម្ពស់ (-1mm) បច្ចុប្បន្ន ${curH}mm`}
            >
              ↕-
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('photoHeight', 1)}
              className="px-0.5 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-mono text-[7.5px] cursor-pointer active:scale-90"
              title={`បង្កើនកម្ពស់ (+1mm) បច្ចុប្បន្ន ${curH}mm`}
            >
              ↕+
            </button>
          </div>
        )}
        {(onNudgeElement || onUpdateOffset) && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('photo', -2, 0) : onUpdateOffset?.('photo', (cfg.photoOffsetX || 0) - 2, cfg.photoOffsetY || 0)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលឆ្វេង"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('photo', 0, -2) : onUpdateOffset?.('photo', cfg.photoOffsetX || 0, (cfg.photoOffsetY || 0) - 2)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលឡើង"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('photo', 0, 2) : onUpdateOffset?.('photo', cfg.photoOffsetX || 0, (cfg.photoOffsetY || 0) + 2)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលចុះ"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('photo', 2, 0) : onUpdateOffset?.('photo', (cfg.photoOffsetX || 0) + 2, cfg.photoOffsetY || 0)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលស្តាំ"
            >
              ▶
            </button>
          </div>
        )}
        {onResetElement && (
          <button
            type="button"
            onClick={() => onResetElement('photo')}
            className="px-1 h-4 flex items-center justify-center rounded bg-blue-700/80 hover:bg-blue-500 text-white font-mono text-[7.5px] cursor-pointer ml-0.5 transition-colors"
            title="កំណត់ដើម"
          >
            ↺
          </button>
        )}
      </div>
    );
  };

  // On-card floating controls for Stamp (Resize, Nudge, Reset)
  const renderStampControls = () => {
    if (activeHighlightElement !== 'stamp' || (!onNudgeElement && !onUpdateOffset && !onUpdateSize)) return null;
    const curSize = cfg.stampSize || 52;

    return (
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-xl border border-rose-400/60 z-50 pointer-events-auto whitespace-nowrap text-[9px] font-sans"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-[8px] text-rose-300 px-0.5 font-bold">
          {curSize}px
        </span>
        {onUpdateSize && (
          <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1 mr-0.5">
            <button
              type="button"
              onClick={() => onUpdateSize('stamp', -1)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title={`បង្រួមត្រា (-5px) បច្ចុប្បន្ន ${curSize}px`}
            >
              ➖
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize('stamp', 1)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title={`ពង្រីកត្រា (+5px) បច្ចុប្បន្ន ${curSize}px`}
            >
              ➕
            </button>
          </div>
        )}
        {(onNudgeElement || onUpdateOffset) && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('stamp', -2, 0) : onUpdateOffset?.('stamp', (cfg.stampOffsetX || 0) - 2, cfg.stampOffsetY || 0)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលឆ្វេង"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('stamp', 0, -2) : onUpdateOffset?.('stamp', cfg.stampOffsetX || 0, (cfg.stampOffsetY || 0) - 2)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលឡើង"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('stamp', 0, 2) : onUpdateOffset?.('stamp', cfg.stampOffsetX || 0, (cfg.stampOffsetY || 0) + 2)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលចុះ"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => onNudgeElement ? onNudgeElement('stamp', 2, 0) : onUpdateOffset?.('stamp', (cfg.stampOffsetX || 0) + 2, cfg.stampOffsetY || 0)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
              title="រំកិលស្តាំ"
            >
              ▶
            </button>
          </div>
        )}
        {onResetElement && (
          <button
            type="button"
            onClick={() => onResetElement('stamp')}
            className="px-1 h-4 flex items-center justify-center rounded bg-rose-700/80 hover:bg-rose-500 text-white font-mono text-[7.5px] cursor-pointer ml-0.5 transition-colors"
            title="កំណត់ដើម"
          >
            ↺
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`card-print-container font-kantumruy relative overflow-hidden select-none ${showCutLines ? borderClasses : ''} ${className}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: cardRadius,
        padding: isLandscape ? '3mm 4mm 3mm 4mm' : '3.5mm 4.5mm 3.5mm 4.5mm',
        backgroundColor: cfg.cardBgColor || '#ffffff',
        boxSizing: 'border-box',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {/* Corner Crop Marks for Precision Cutting */}
      {showCutLines && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neutral-400 pointer-events-none z-20" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neutral-400 pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neutral-400 pointer-events-none z-20" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neutral-400 pointer-events-none z-20" />
        </>
      )}

      {/* Decorative inner frame */}
      <div
        className={`w-full h-full rounded-[2px] p-[2.2mm] flex flex-col relative ${getInnerBorderClasses()}`}
        style={{
          borderColor: cfg.innerBorderColor || cfg.primaryColor || '#075985',
          borderRadius: `calc(${cardRadius} - 1.5mm)`,
        }}
      >
        {/* Background Watermark Emblem */}
        {cfg.showWatermark !== false && cfg.watermarkOpacity > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: cfg.watermarkOpacity,
              zIndex: cfg.watermarkZIndex ?? 0,
            }}
          >
            {cfg.watermarkType !== 'moeys-emblem' && school.logo_url ? (
              <img
                src={school.logo_url}
                alt="School Watermark Logo"
                className="object-contain select-none pointer-events-none max-w-[75%] max-h-[75%]"
                style={{
                  width: `${cfg.watermarkSize || (isLandscape ? 120 : 150)}px`,
                  height: `${cfg.watermarkSize || (isLandscape ? 120 : 150)}px`,
                }}
              />
            ) : (
              <MoEYSEmblem size={cfg.watermarkSize || (isLandscape ? 120 : 150)} />
            )}
          </div>
        )}

        {/* Ornamental corner accents if ornamental border selected */}
        {cfg.innerBorderType === 'ornamental' && (
          <>
            <div className="absolute top-0.5 left-0.5 w-3 h-3 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: cfg.secondaryColor || '#b45309' }} />
            <div className="absolute top-0.5 right-0.5 w-3 h-3 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: cfg.secondaryColor || '#b45309' }} />
            <div className="absolute bottom-0.5 left-0.5 w-3 h-3 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: cfg.secondaryColor || '#b45309' }} />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: cfg.secondaryColor || '#b45309' }} />
          </>
        )}

        {/* ======================================================== */}
        {/* KAMRIENG HIGH SCHOOL 100% EXACT MATCH LAYOUT */}
        {/* ======================================================== */}
        {isKamriengLayout ? (
          <div className="flex flex-col h-full justify-between relative z-10">
            {/* Top Header: Logo + Ministry (Left) and Royal Motto + QR (Right) */}
            <div
              onClick={() => onSelectElement?.('header')}
              className={`relative shrink-0 transition-all ${
                activeHighlightElement === 'header'
                  ? 'ring-2 ring-blue-500 rounded p-1 cursor-pointer'
                  : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
              }`}
              style={{
                transform: `translate(0px, ${cfg.headerOffsetY || 0}px) scale(${cfg.headerScale || 1})`,
                transformOrigin: 'top center',
              }}
            >
              <div className="grid grid-cols-[1fr_auto] items-start gap-1">
                {/* Top-Left: MoEYS Logo & School Hierarchy */}
                <div className="flex flex-col items-start min-w-0 pr-1">
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('logo');
                      }
                    }}
                    className={`mb-1 transition-all ${
                      activeHighlightElement === 'logo'
                        ? 'ring-2 ring-blue-500 rounded p-0.5 cursor-pointer'
                        : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                    }`}
                    style={{
                      transform: `translate(${cfg.logoOffsetX || 0}px, ${cfg.logoOffsetY || 0}px) scale(${cfg.logoScale || 1})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt="Logo"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <MoEYSEmblem size={32} />
                    )}
                  </div>
                  <p
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('headerMinistry');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                    className={`font-kantumruy font-bold text-[7.4px] text-slate-800 leading-tight inline-block relative transition-all whitespace-nowrap select-none ${
                      activeHighlightElement === 'headerMinistry'
                        ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                        : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                    }`}
                    style={{
                      transform: `translate(${cfg.headerMinistryOffsetX || 0}px, ${cfg.headerMinistryOffsetY || 0}px)`,
                      fontSize: cfg.headerMinistryFontSize ? `${cfg.headerMinistryFontSize}px` : undefined,
                    }}
                  >
                    {cfg.headerMinistryKhmer || school.ministry_name || 'ក្រសួងអប់រំ យុវជន និងកីឡា'}
                    {renderNudgeToolbar('headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                  </p>
                  <p
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('headerDepartment');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                    className={`font-kantumruy text-[7.0px] text-slate-700 leading-tight mt-[1px] inline-block relative transition-all whitespace-nowrap select-none ${
                      activeHighlightElement === 'headerDepartment'
                        ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                        : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                    }`}
                    style={{
                      transform: `translate(${cfg.headerDepartmentOffsetX || 0}px, ${cfg.headerDepartmentOffsetY || 0}px)`,
                      fontSize: cfg.headerDepartmentFontSize ? `${cfg.headerDepartmentFontSize}px` : undefined,
                    }}
                  >
                    {cfg.headerDepartmentKhmer || school.department_name || 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តបាត់ដំបង'}
                    {renderNudgeToolbar('headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                  </p>
                  <h2
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('headerSchoolName');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                    className={`font-muol text-[8.2px] text-slate-900 leading-tight mt-[1px] inline-block relative transition-all whitespace-nowrap select-none ${
                      activeHighlightElement === 'headerSchoolName'
                        ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                        : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                    }`}
                    style={{
                      transform: `translate(${cfg.headerSchoolNameOffsetX || 0}px, ${cfg.headerSchoolNameOffsetY || 0}px)`,
                      fontSize: cfg.headerSchoolNameFontSize ? `${cfg.headerSchoolNameFontSize}px` : undefined,
                    }}
                  >
                    {cfg.headerSchoolNameKhmer || school.school_name || 'វិទ្យាល័យកំរៀង'}
                    {renderNudgeToolbar('headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                  </h2>
                </div>

                {/* Top-Right: Royal Motto & QR Code */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-center">
                    <h1
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerKingdom');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                      className={`font-muol text-[8.8px] text-blue-950 leading-tight inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerKingdom'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.headerKingdomOffsetX || 0}px, ${cfg.headerKingdomOffsetY || 0}px)`,
                        fontSize: cfg.headerKingdomFontSize ? `${cfg.headerKingdomFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerKingdomKhmer || 'ព្រះរាជាណាចក្រកម្ពុជា'}
                      {renderNudgeToolbar('headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                    </h1>
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerMotto');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                      className={`font-muol text-[7.6px] text-blue-950 leading-tight mt-[1px] inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerMotto'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.headerMottoOffsetX || 0}px, ${cfg.headerMottoOffsetY || 0}px)`,
                        fontSize: cfg.headerMottoFontSize ? `${cfg.headerMottoFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerMottoKhmer || 'ជាតិ សាសនា ព្រះមហាក្សត្រ'}
                      {renderNudgeToolbar('headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                    </p>
                  </div>
                  {/* QR Code Container in Top-Right Corner */}
                  {cfg.showQrCode && (
                    <div
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('qr');
                        }
                      }}
                      className={`mt-1.5 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all ${
                        activeHighlightElement === 'qr'
                          ? 'ring-2 ring-blue-500 cursor-pointer'
                          : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.qrOffsetX || 0}px, ${cfg.qrOffsetY || 0}px)`,
                      }}
                    >
                      <QRCodeSVG value={qrCodeUrl} size={cfg.qrSize || 46} level="M" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title: «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស» & Academic Year */}
              {(cfg.showTitleBanner !== false) && (
                <div className="text-center mt-1 mb-1 transition-all relative">
                  <h3
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('title');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                    className={`font-muol leading-tight inline-block relative transition-all ${
                      activeHighlightElement === 'title'
                        ? 'ring-2 ring-blue-500 rounded px-1 cursor-move z-30 select-none'
                        : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                    }`}
                    style={{
                      color: cfg.titleBannerTextColor || '#b45309',
                      fontSize: `${cfg.titleFontSize || 11.5}px`,
                      transform: `translate(${cfg.titleOffsetX || 0}px, ${cfg.titleOffsetY || 0}px)`,
                    }}
                  >
                    {cfg.headerTitleKhmer || school.card_title || 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស'}
                    {renderNudgeToolbar('title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                  </h3>
                  {(cfg.showSubtitle !== false) && (
                    <div className="block">
                      <p
                        onClick={(e) => {
                          if (onSelectElement) {
                            e.stopPropagation();
                            onSelectElement('subtitle');
                          }
                        }}
                        onMouseDown={(e) => handleStartDrag(e, 'subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                        onTouchStart={(e) => handleStartDrag(e, 'subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                        className={`font-kantumruy font-bold leading-tight mt-[1px] inline-block relative transition-all ${
                          activeHighlightElement === 'subtitle'
                            ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30 select-none'
                            : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                        }`}
                        style={{
                          color: '#2563eb',
                          fontSize: `${cfg.subtitleFontSize || 7.8}px`,
                          transform: `translate(${cfg.subtitleOffsetX || 0}px, ${cfg.subtitleOffsetY || 0}px)`,
                        }}
                      >
                        {cfg.headerSubtitleKhmer || school.academic_year || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
                        {renderNudgeToolbar('subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle: Student Information (2-Column 5-Row Exact Match) */}
            <div
              onClick={() => onSelectElement?.('info')}
              className={`w-full font-kantumruy text-[8.8px] leading-tight space-y-1 my-0.5 transition-all ${
                activeHighlightElement === 'info'
                  ? 'ring-2 ring-blue-500 rounded p-1 cursor-pointer'
                  : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
              }`}
              style={{
                transform: `translate(${cfg.infoOffsetX || 0}px, ${cfg.infoOffsetY || 0}px) scale(${cfg.infoScale || 1.0})`,
                fontSize: `${baseInfoSize}px`,
              }}
            >
              {/* Row 1: Full Name & Gender (Aligned with 'ថ្នាក់') */}
              <div className="grid grid-cols-[1fr_22mm] items-baseline w-full">
                <div className="flex items-baseline min-w-0 pr-1 overflow-visible">
                  <span className="font-semibold text-slate-800 shrink-0">គោត្តនាម និងនាម:</span>
                  <span
                    className={`font-muol text-[#2563eb] ml-1 whitespace-nowrap leading-none ${
                      (student.full_name?.length || 0) > 20
                        ? 'text-[7.8px]'
                        : (student.full_name?.length || 0) > 14
                        ? 'text-[8.5px]'
                        : 'text-[9.3px]'
                    }`}
                  >
                    {student.full_name || '—'}
                  </span>
                </div>
                <div className="flex items-baseline shrink-0">
                  <span className="font-semibold text-slate-800 shrink-0 inline-block w-[9.5mm]">ភេទ:</span>
                  <span className="font-semibold text-[#2563eb] ml-0.5">{student.gender || '—'}</span>
                </div>
              </div>

              {/* Row 2: DOB & Grade (Aligned with 'ភេទ') */}
              <div className="grid grid-cols-[1fr_22mm] items-baseline w-full">
                <div className="flex items-baseline min-w-0 pr-1 overflow-visible">
                  <span className="font-semibold text-slate-800 shrink-0">ថ្ងៃខែឆ្នាំកំណើត:</span>
                  <span className="font-semibold tabular-nums text-[#2563eb] ml-1 whitespace-nowrap overflow-visible">
                    {formatKhmerDob(student.dob, 'digits')}
                  </span>
                </div>
                <div className="flex items-baseline shrink-0">
                  <span className="font-semibold text-slate-800 shrink-0 inline-block w-[9.5mm]">ថ្នាក់:</span>
                  <span className="font-bold text-[#2563eb] ml-0.5">{student.grade || '—'}</span>
                </div>
              </div>

              {/* Row 3: POB (Full Width) */}
              <div className="flex items-baseline truncate min-w-0 w-full">
                <span className="font-semibold text-slate-800 shrink-0">ទីកន្លែងកំណើត:</span>
                <span className="font-medium text-[#2563eb] ml-1 truncate" title={student.pob || ''}>
                  {student.pob || '—'}
                </span>
              </div>

              {/* Row 4: Phone & Father */}
              <div className="flex items-baseline justify-between gap-1 w-full min-w-0">
                <div className="flex items-baseline shrink-0">
                  <span className="font-semibold text-slate-800 shrink-0">លេខទូរស័ព្ទ:</span>
                  <span className="font-mono text-[#2563eb] ml-1 shrink-0">
                    {formatPhoneNumber(student.student_phone || '') || '_________________'}
                  </span>
                </div>
                <div className="flex items-baseline shrink-0 ml-auto pl-1 whitespace-nowrap overflow-visible">
                  <span className="font-semibold text-slate-800 shrink-0">ឈ្មោះឪពុក:</span>
                  <span
                    className="font-medium text-[#2563eb] ml-1 leading-none whitespace-nowrap overflow-visible"
                    style={{
                      fontSize: (student.father_name?.length || 0) > 18
                        ? '7.5px'
                        : (student.father_name?.length || 0) > 14
                        ? '8.0px'
                        : '8.8px',
                    }}
                  >
                    {student.father_name || '—'}
                  </span>
                </div>
              </div>

              {/* Row 5: Student ID & Mother */}
              <div className="flex items-baseline justify-between gap-1 w-full min-w-0">
                <div className="flex items-baseline shrink-0">
                  <span className="font-semibold text-slate-800 shrink-0">អត្តលេខ:</span>
                  <span className="font-mono font-bold text-[#2563eb] ml-1 shrink-0">
                    {student.student_id || '—'}
                  </span>
                </div>
                <div className="flex items-baseline shrink-0 ml-auto pl-1 whitespace-nowrap overflow-visible">
                  <span className="font-semibold text-slate-800 shrink-0">ឈ្មោះម្តាយ:</span>
                  <span
                    className="font-medium text-[#2563eb] ml-1 leading-none whitespace-nowrap overflow-visible"
                    style={{
                      fontSize: (student.mother_name?.length || 0) > 18
                        ? '7.5px'
                        : (student.mother_name?.length || 0) > 14
                        ? '8.0px'
                        : '8.8px',
                    }}
                  >
                    {student.mother_name || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Photo (Bottom-Left) + Dates & Signatures (Bottom-Right) */}
            <div className="relative z-10 mt-auto pt-1 flex items-end justify-between gap-2.5 w-full">
              {/* Bottom-Left: Photo Box (3x4 Frame with 1.5px blue border & placeholder icon) */}
              <div className="relative shrink-0">
                {renderPhotoControls()}
                <div
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement('photo');
                    }
                  }}
                  onMouseDown={(e) => handleStartDrag(e, 'photo', cfg.photoOffsetX || 0, cfg.photoOffsetY || 0)}
                  onTouchStart={(e) => handleStartDrag(e, 'photo', cfg.photoOffsetX || 0, cfg.photoOffsetY || 0)}
                  className={`overflow-hidden flex flex-col items-center justify-center relative transition-all ${
                    student.photo_url
                      ? 'rounded-xl border-[1.5px] bg-slate-50/90 shadow-2xs'
                      : 'rounded-[2px] border-[0.5px] border-dashed border-slate-300 bg-white/60'
                  } ${
                    activeHighlightElement === 'photo'
                      ? 'ring-2 ring-blue-500 cursor-grab active:cursor-grabbing pointer-events-auto'
                      : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                  }`}
                  style={{
                    width: student.photo_url
                      ? `${cfg.photoWidthMm || 27}mm`
                      : `${Math.min(cfg.photoWidthMm ? cfg.photoWidthMm - 11 : 16, 16)}mm`,
                    height: student.photo_url
                      ? `${cfg.photoHeightMm || 36}mm`
                      : `${Math.min(cfg.photoHeightMm ? cfg.photoHeightMm - 15 : 21, 21)}mm`,
                    borderColor: student.photo_url ? (cfg.photoBorderColor || '#60a5fa') : '#94a3b8',
                    zIndex: cfg.photoZIndex ?? 20,
                    transform: `translate(${cfg.photoOffsetX || 0}px, ${cfg.photoOffsetY || 0}px)`,
                  }}
                >
                  {student.photo_url ? (
                    <img
                      src={formatDriveImageUrl(student.photo_url)}
                      alt={student.full_name}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-[10px] transition-transform"
                      style={{
                        transform: `scale(${cfg.photoZoom || 1})`,
                        transformOrigin: 'center center',
                      }}
                      onError={(e) => {
                        const fallback = getDriveImageFallbackUrl(student.photo_url);
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center text-slate-400 p-0.5 select-none pointer-events-none transition-transform"
                      style={{
                        transform: `scale(${cfg.photoZoom || 1})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <svg className="w-3 h-3 text-slate-400 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      <span className="font-kantumruy text-[6.5px] font-semibold text-slate-400 tracking-tight leading-none">
                        3 x 4
                      </span>
                    </div>
                  )}
                </div>

                {/* Photo Stamp (when stampPositionMode === 'photo-corner') */}
                {cfg.showStamp && cfg.stampPositionMode === 'photo-corner' && (
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('stamp');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                    className={`absolute -bottom-2.5 -right-3 select-none transition-all shrink-0 max-w-none max-h-none ${
                      activeHighlightElement === 'stamp'
                        ? 'ring-2 ring-rose-500 rounded-full cursor-grab active:cursor-grabbing p-0.5 pointer-events-auto'
                        : onSelectElement ? 'hover:ring-1 hover:ring-rose-400 cursor-pointer pointer-events-auto' : 'pointer-events-none'
                    }`}
                    style={{
                      width: `${cfg.stampSize || 52}px`,
                      height: `${cfg.stampSize || 52}px`,
                      minWidth: `${cfg.stampSize || 52}px`,
                      minHeight: `${cfg.stampSize || 52}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate(${cfg.stampOffsetX || 0}px, ${cfg.stampOffsetY || 0}px) rotate(${cfg.stampRotation || -6}deg)`,
                      zIndex: cfg.stampZIndex ?? 25,
                      opacity: cfg.stampOpacity ?? 0.88,
                    }}
                  >
                    {renderStampControls()}
                    {school.stamp_url ? (
                      <img
                        src={school.stamp_url}
                        alt="Stamp"
                        referrerPolicy="no-referrer"
                        style={{
                          width: `${cfg.stampSize || 52}px`,
                          height: `${cfg.stampSize || 52}px`,
                          minWidth: `${cfg.stampSize || 52}px`,
                          minHeight: `${cfg.stampSize || 52}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                        }}
                        className="object-contain mix-blend-multiply block max-w-none max-h-none w-full h-full"
                      />
                    ) : (
                      <OfficialRedStamp
                        schoolName={school.school_name || 'វិទ្យាល័យកំរៀង'}
                        principalName={school.principal_name || 'ម៉ិច គន្ធា'}
                        size={cfg.stampSize || 52}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom-Right: Dates + Principal Title + Signature + Stamp + Principal Name */}
              <div className="flex-1 flex flex-col items-end text-right min-w-0">
                {/* Dates */}
                {(cfg.showLunarDate || cfg.showSolarDate) && (
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('date');
                      }
                    }}
                    className={`font-kantumruy text-[6.6px] text-slate-700 leading-[1.38] space-y-[1.5px] mb-0.5 transition-all rounded overflow-visible ${
                      activeHighlightElement === 'date'
                        ? 'ring-2 ring-emerald-500 bg-emerald-50/50 p-0.5 cursor-pointer'
                        : onSelectElement ? 'hover:ring-1 hover:ring-emerald-400 cursor-pointer p-0.5' : ''
                    }`}
                    style={{
                      transform: `translate(${cfg.dateOffsetX || 0}px, ${cfg.dateOffsetY || 0}px)`,
                      fontSize: `${cfg.dateFontSize || 6.6}px`,
                    }}
                  >
                    {cfg.showLunarDate && (
                      <p className="italic leading-[1.42] whitespace-nowrap overflow-visible">
                        {toKhmerDigits(school.issue_date_lunar || 'ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨')}
                      </p>
                    )}
                    {cfg.showSolarDate && (
                      <p className="leading-[1.42] whitespace-nowrap overflow-visible">
                        {toKhmerDigits(school.issue_date_solar || 'ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥')}
                      </p>
                    )}
                  </div>
                )}

                {/* Principal Title, Signature, Stamp & Name Box */}
                <div className="text-center w-[36mm] mt-0.5">
                  {cfg.showPrincipalTitle && (
                    <h4
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('principalTitle');
                        }
                      }}
                      className={`font-muol text-[8.2px] text-slate-900 leading-tight transition-all rounded ${
                        activeHighlightElement === 'principalTitle'
                          ? 'ring-2 ring-indigo-500 bg-indigo-50/50 p-0.5 cursor-pointer'
                          : onSelectElement ? 'hover:ring-1 hover:ring-indigo-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.principalTitleOffsetX || 0}px, ${cfg.principalTitleOffsetY || 0}px)`,
                        fontSize: `${cfg.principalTitleFontSize || 8.2}px`,
                      }}
                    >
                      {cfg.principalTitleText || school.principal_title || 'នាយកវិទ្យាល័យ'}
                    </h4>
                  )}

                  {/* Signature & Stamp Overlay Area */}
                  <div className="relative h-12 flex items-center justify-center my-0.5">
                    {/* Signature */}
                    {cfg.showSignature && (
                      <div
                        onClick={(e) => {
                          if (onSelectElement) {
                            e.stopPropagation();
                            onSelectElement('signature');
                          }
                        }}
                        className={`relative z-10 transition-all ${
                          activeHighlightElement === 'signature'
                            ? 'ring-2 ring-blue-500 rounded p-0.5 cursor-pointer'
                            : onSelectElement ? 'hover:ring-1 hover:ring-blue-400 cursor-pointer' : ''
                        }`}
                        style={{
                          transform: `translate(${cfg.signatureOffsetX || 0}px, ${cfg.signatureOffsetY || 0}px) scale(${cfg.signatureScale || 1})`,
                          zIndex: cfg.signatureZIndex ?? 22,
                        }}
                      >
                        {school.signature_url ? (
                          <img
                            src={school.signature_url}
                            alt="Signature"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            className="h-10 w-auto object-contain mix-blend-multiply"
                          />
                        ) : (
                          <svg viewBox="0 0 160 65" className="h-10 w-28 text-blue-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 20 40 Q 30 15, 45 42 Q 55 58, 65 30 T 80 40 T 95 32 Q 110 25, 125 45 Q 135 55, 145 38" />
                            <path d="M 30 46 C 45 44, 90 40, 135 44" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Stamp (Footer mode) */}
                    {cfg.showStamp && cfg.stampPositionMode !== 'photo-corner' && (
                      <div
                        onClick={(e) => {
                          if (onSelectElement) {
                            e.stopPropagation();
                            onSelectElement('stamp');
                          }
                        }}
                        onMouseDown={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                        onTouchStart={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                        className={`absolute -top-1 left-1/2 -translate-x-1/2 transition-all select-none shrink-0 max-w-none max-h-none ${
                          activeHighlightElement === 'stamp'
                            ? 'ring-2 ring-rose-500 rounded-full cursor-grab active:cursor-grabbing p-0.5 z-40 pointer-events-auto'
                            : onSelectElement ? 'hover:ring-1 hover:ring-rose-400 cursor-pointer z-30 pointer-events-auto' : 'pointer-events-none'
                        }`}
                        style={{
                          width: `${cfg.stampSize || 52}px`,
                          height: `${cfg.stampSize || 52}px`,
                          minWidth: `${cfg.stampSize || 52}px`,
                          minHeight: `${cfg.stampSize || 52}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          transform: `translate(calc(-50% + ${cfg.stampOffsetX || 0}px), ${cfg.stampOffsetY || 0}px) rotate(${cfg.stampRotation || -6}deg)`,
                          zIndex: cfg.stampZIndex ?? 25,
                          opacity: cfg.stampOpacity ?? 0.88,
                        }}
                      >
                        {renderStampControls()}
                        {school.stamp_url ? (
                          <img
                            src={school.stamp_url}
                            alt="Stamp"
                            referrerPolicy="no-referrer"
                            style={{
                              width: `${cfg.stampSize || 52}px`,
                              height: `${cfg.stampSize || 52}px`,
                              minWidth: `${cfg.stampSize || 52}px`,
                              minHeight: `${cfg.stampSize || 52}px`,
                              maxWidth: 'none',
                              maxHeight: 'none',
                            }}
                            className="object-contain mix-blend-multiply block max-w-none max-h-none w-full h-full"
                          />
                        ) : (
                          <OfficialRedStamp
                            schoolName={school.school_name || 'វិទ្យាល័យកំរៀង'}
                            principalName={school.principal_name || 'ម៉ិច គន្ធា'}
                            size={cfg.stampSize || 52}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Principal Name in Red */}
                  {cfg.showPrincipalName && (
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('principalName');
                        }
                      }}
                      className={`font-muol text-[8.2px] leading-tight transition-all rounded ${
                        activeHighlightElement === 'principalName'
                          ? 'ring-2 ring-purple-500 bg-purple-50/50 p-0.5 cursor-pointer'
                          : onSelectElement ? 'hover:ring-1 hover:ring-purple-400 cursor-pointer' : ''
                      }`}
                      style={{
                        color: cfg.principalNameTextColor || '#dc2626',
                        transform: `translate(${cfg.principalNameOffsetX || 0}px, ${cfg.principalNameOffsetY || 0}px)`,
                        fontSize: `${cfg.principalNameFontSize || 8.2}px`,
                      }}
                    >
                      {cfg.principalNameText || school.principal_name || 'ម៉ិច គន្ធា'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD FLEXIBLE CARD LAYOUT */
          /* ======================================================== */
          <>
        {cfg.showHeader && (
          <div
            onClick={() => onSelectElement?.('header')}
            className={`relative z-10 shrink-0 transition-all ${
              activeHighlightElement === 'header'
                ? 'ring-2 ring-blue-500 ring-offset-1 rounded-sm cursor-pointer'
                : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
            }`}
            style={{
              transform: `translate(0px, ${cfg.headerOffsetY || 0}px) scale(${cfg.headerScale || 1})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Top Motto, Logo & School Branding */}
            <div
              className={`items-center mb-1 ${
                cfg.logoPosition === 'center'
                  ? 'flex flex-col text-center'
                  : 'grid grid-cols-[38px_1fr] gap-1 items-start'
              }`}
            >
              {/* Logo / Emblem */}
              <div
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement('logo');
                  }
                }}
                className={`flex items-center justify-center pt-0.5 transition-all ${
                  cfg.logoPosition === 'center' ? 'mb-1' : ''
                } ${
                  activeHighlightElement === 'logo'
                    ? 'ring-2 ring-blue-500 rounded p-0.5 z-20 cursor-pointer'
                    : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                }`}
                style={{
                  transform: `translate(${cfg.logoOffsetX || 0}px, ${cfg.logoOffsetY || 0}px) scale(${cfg.logoScale || 1})`,
                  transformOrigin: cfg.logoPosition === 'center' ? 'center center' : 'left center',
                }}
              >
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt="School Logo"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    style={{
                      width: `${logoDimensions.width}px`,
                      height: `${logoDimensions.height}px`,
                    }}
                    className="object-contain"
                  />
                ) : (
                  <MoEYSEmblem size={logoDimensions.width} />
                )}
              </div>

              {/* Ministry & Kingdom Headers */}
              <div className={cfg.logoPosition === 'center' ? 'text-center w-full' : 'text-center pr-1'}>
                {cfg.showRoyalMotto && (
                  <div className="flex flex-col items-center">
                    <h1
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerKingdom');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                      className={`font-muol text-[9.2px] leading-tight inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerKingdom'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        color: cfg.primaryColor || '#0c4a6e',
                        transform: `translate(${cfg.headerKingdomOffsetX || 0}px, ${cfg.headerKingdomOffsetY || 0}px)`,
                        fontSize: cfg.headerKingdomFontSize ? `${cfg.headerKingdomFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerKingdomKhmer || 'ព្រះរាជាណាចក្រកម្ពុជា'}
                      {renderNudgeToolbar('headerKingdom', cfg.headerKingdomOffsetX || 0, cfg.headerKingdomOffsetY || 0)}
                    </h1>
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerMotto');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                      className={`font-muol text-[7.6px] leading-tight mt-[1px] inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerMotto'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        color: cfg.secondaryColor || '#b45309',
                        transform: `translate(${cfg.headerMottoOffsetX || 0}px, ${cfg.headerMottoOffsetY || 0}px)`,
                        fontSize: cfg.headerMottoFontSize ? `${cfg.headerMottoFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerMottoKhmer || 'ជាតិ សាសនា ព្រះមហាក្សត្រ'}
                      {renderNudgeToolbar('headerMotto', cfg.headerMottoOffsetX || 0, cfg.headerMottoOffsetY || 0)}
                    </p>
                    <div
                      className="w-12 h-[1px] mx-auto my-[2px]"
                      style={{ backgroundColor: cfg.secondaryColor || '#b45309', opacity: 0.7 }}
                    />
                  </div>
                )}

                {cfg.showMinistry && (
                  <div>
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerMinistry');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                      className={`font-kantumruy font-semibold text-[7.5px] text-neutral-800 leading-tight inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerMinistry'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.headerMinistryOffsetX || 0}px, ${cfg.headerMinistryOffsetY || 0}px)`,
                        fontSize: cfg.headerMinistryFontSize ? `${cfg.headerMinistryFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerMinistryKhmer || school.ministry_name || 'ក្រសួងអប់រំ យុវជន និងកីឡា'}
                      {renderNudgeToolbar('headerMinistry', cfg.headerMinistryOffsetX || 0, cfg.headerMinistryOffsetY || 0)}
                    </p>
                  </div>
                )}

                {cfg.showDepartment && (
                  <div>
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerDepartment');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                      className={`font-kantumruy text-[6.8px] text-neutral-600 leading-tight inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerDepartment'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        transform: `translate(${cfg.headerDepartmentOffsetX || 0}px, ${cfg.headerDepartmentOffsetY || 0}px)`,
                        fontSize: cfg.headerDepartmentFontSize ? `${cfg.headerDepartmentFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerDepartmentKhmer || school.department_name || 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម'}
                      {renderNudgeToolbar('headerDepartment', cfg.headerDepartmentOffsetX || 0, cfg.headerDepartmentOffsetY || 0)}
                    </p>
                  </div>
                )}

                {cfg.showSchoolName && (
                  <div>
                    <h2
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('headerSchoolName');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                      className={`font-muol text-[8.5px] leading-tight mt-[1px] inline-block relative transition-all whitespace-nowrap select-none ${
                        activeHighlightElement === 'headerSchoolName'
                          ? 'ring-2 ring-blue-500 rounded px-1 bg-blue-50/50 cursor-move z-30'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                      }`}
                      style={{
                        color: cfg.primaryColor || '#0c4a6e',
                        transform: `translate(${cfg.headerSchoolNameOffsetX || 0}px, ${cfg.headerSchoolNameOffsetY || 0}px)`,
                        fontSize: cfg.headerSchoolNameFontSize ? `${cfg.headerSchoolNameFontSize}px` : undefined,
                      }}
                    >
                      {cfg.headerSchoolNameKhmer || school.school_name || 'វិទ្យាល័យ តាំងក្រូច'}
                      {renderNudgeToolbar('headerSchoolName', cfg.headerSchoolNameOffsetX || 0, cfg.headerSchoolNameOffsetY || 0)}
                    </h2>
                  </div>
                )}
              </div>
            </div>

            {/* Card Title Banner (Customizable background color, toggle show/hide bg, and font sizing) */}
            {(cfg.showTitleBanner !== false) && (
              <div
                className={`text-center my-1 py-1 px-2 rounded-[2px] transition-all relative ${
                  cfg.showTitleBannerBg !== false ? 'shadow-xs' : ''
                } ${
                  cfg.headerStyle === 'gold-accent' && cfg.showTitleBannerBg !== false
                    ? 'border border-amber-400'
                    : ''
                }`}
                style={{
                  background:
                    cfg.showTitleBannerBg === false
                      ? 'transparent'
                      : cfg.headerStyle === 'solid'
                      ? cfg.titleBannerBgColor || cfg.headerBgColorStart || '#075985'
                      : `linear-gradient(135deg, ${cfg.titleBannerBgColor || cfg.headerBgColorStart || '#075985'}, ${cfg.titleBannerBgColorEnd || cfg.headerBgColorEnd || '#1e3a8a'})`,
                  color: cfg.showTitleBannerBg === false ? (cfg.titleBannerTextColor || cfg.primaryColor || '#075985') : '#ffffff',
                  zIndex: cfg.titleZIndex ?? 15,
                }}
              >
                <h3
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement('title');
                    }
                  }}
                  onMouseDown={(e) => handleStartDrag(e, 'title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                  onTouchStart={(e) => handleStartDrag(e, 'title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                  className={`font-muol leading-tight transition-all inline-block relative ${
                    activeHighlightElement === 'title'
                      ? 'ring-2 ring-blue-400 rounded px-1 cursor-move z-30 select-none'
                      : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
                  }`}
                  style={{
                    color: cfg.titleBannerTextColor || cfg.headerTextColor || (cfg.showTitleBannerBg === false ? (cfg.primaryColor || '#075985') : '#fef08a'),
                    fontSize: `${cfg.titleFontSize || 10}px`,
                    transform: `translate(${cfg.titleOffsetX || 0}px, ${cfg.titleOffsetY || 0}px)`,
                  }}
                >
                  {cfg.headerTitleKhmer || school.card_title || 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស'}
                  {renderNudgeToolbar('title', cfg.titleOffsetX || 0, cfg.titleOffsetY || 0)}
                </h3>
                {(cfg.showSubtitle !== false) && (
                  <div className="block">
                    <p
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('subtitle');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                      className={`font-kantumruy font-medium leading-tight mt-[0.5px] opacity-90 transition-all inline-block relative ${
                        activeHighlightElement === 'subtitle'
                          ? 'ring-2 ring-blue-400 rounded px-1 bg-blue-500/20 cursor-move z-30 select-none'
                          : onSelectElement ? 'hover:outline hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
                      }`}
                      style={{
                        color: cfg.showTitleBannerBg === false ? '#4b5563' : '#f3f4f6',
                        fontSize: `${cfg.subtitleFontSize || 7.6}px`,
                        transform: `translate(${cfg.subtitleOffsetX || 0}px, ${cfg.subtitleOffsetY || 0}px)`,
                      }}
                    >
                      {cfg.headerSubtitleKhmer || school.academic_year || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
                      {renderNudgeToolbar('subtitle', cfg.subtitleOffsetX || 0, cfg.subtitleOffsetY || 0)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* BODY CONTENT SECTION (DECOUPLED FIELDS + PHOTO & QR) */}
        {/* ======================================================== */}
        <div
          className="relative z-10 grid items-start w-full flex-1 min-h-0 pt-1 overflow-hidden"
          style={{
            gridTemplateColumns:
              cfg.photoPosition === 'left'
                ? `${cfg.photoWidthMm || (isLandscape ? 24 : 23)}mm 1fr`
                : `1fr ${cfg.photoWidthMm || (isLandscape ? 24 : 23)}mm`,
            gap: isLandscape ? '10px' : '8px',
          }}
        >
          {/* Main Student Fields (Decoupled Slot) */}
          <div
            onClick={() => onSelectElement?.('info')}
            className={`font-kantumruy text-neutral-900 transition-all flex-1 min-w-0 overflow-hidden flex flex-col ${
              cfg.expandInfoToFullCard ? 'h-full justify-between' : ''
            } ${
              cfg.photoPosition === 'left' ? 'order-2' : 'order-1'
            } ${
              activeHighlightElement === 'info'
                ? 'ring-2 ring-blue-500 rounded p-1 cursor-pointer z-10'
                : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-300 cursor-pointer' : ''
            }`}
            style={{
              transform: `translate(${cfg.infoOffsetX || 0}px, ${cfg.infoOffsetY || 0}px) scale(${cfg.infoScale || 1.0})`,
              transformOrigin: cfg.photoPosition === 'left' ? 'top right' : 'top left',
              fontSize: `${baseInfoSize}px`,
              lineHeight: cfg.infoLineSpacing || 1.38,
              width: cfg.infoWidthPercent && cfg.infoWidthPercent !== 100 ? `${cfg.infoWidthPercent}%` : undefined,
              rowGap: `${cfg.infoGapY ?? 3.2}px`,
            }}
          >
            {/* Student ID */}
            {cfg.showStudentId && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelStudentId || 'អត្តលេខ ID'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="font-mono font-bold tracking-wider truncate min-w-0"
                  style={{
                    color: cfg.accentColor || '#1e3a8a',
                    fontSize: `${baseInfoSize * 1.12}px`,
                  }}
                >
                  {student.student_id || '—'}
                </span>
              </div>
            )}

            {/* Student Full Name (Khmer) */}
            {cfg.showFullName && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelFullName || 'គោត្តនាម-នាម'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="font-muol leading-tight whitespace-nowrap overflow-visible"
                  style={{
                    color: cfg.primaryColor || '#0c4a6e',
                    fontSize: `${baseInfoSize * 1.14}px`,
                  }}
                >
                  {student.full_name || '—'}
                </span>
              </div>
            )}

            {/* Latin / English Name (Decoupled & Always consistent) */}
            {cfg.showLatinName && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelLatinName || 'ឈ្មោះឡាតាំង'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="font-semibold uppercase tracking-wide text-neutral-900 truncate min-w-0"
                  style={{ fontSize: `${baseInfoSize * 0.95}px` }}
                >
                  {displayLatinName || '—'}
                </span>
              </div>
            )}

            {/* Gender */}
            {cfg.showGender && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelGender || 'ភេទ'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span className="font-medium text-neutral-900 truncate min-w-0">{student.gender || '—'}</span>
              </div>
            )}

            {/* Date of Birth & Place of Birth (Never wraps or distorts layout) */}
            {(cfg.combineDobPob && cfg.showDob && cfg.showPob) ? (
              <div className="flex items-start min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelDobPob || cfg.labelDob || 'ថ្ងៃខែឆ្នាំកំណើត'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <div className="font-medium text-neutral-900 leading-snug min-w-0 flex flex-wrap gap-x-1">
                  <span className="tabular-nums font-semibold whitespace-nowrap">{formatKhmerDob(student.dob)}</span>
                  {student.pob && (
                    <span className="ml-1 text-neutral-800">{student.pob}</span>
                  )}
                </div>
              </div>
            ) : (
              <>
                {cfg.showDob && (
                  <div className="flex items-baseline min-w-0 w-full" style={{ fontSize: `${baseInfoSize}px` }}>
                    <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                      {cfg.labelDob || 'ថ្ងៃខែឆ្នាំកំណើត'}
                    </span>
                    <span className="mr-1 shrink-0">:</span>
                    <span className="font-medium tabular-nums text-neutral-900 whitespace-nowrap min-w-0">{formatKhmerDob(student.dob)}</span>
                  </div>
                )}

                {cfg.showPob && (
                  <div className="flex items-baseline min-w-0 w-full" style={{ fontSize: `${baseInfoSize}px` }}>
                    <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                      {cfg.labelPob || 'ទីកន្លែងកំណើត'}
                    </span>
                    <span className="mr-1 shrink-0">:</span>
                    <span
                      className="font-medium text-neutral-800 leading-snug truncate min-w-0"
                      style={{ fontSize: `${baseInfoSize * 0.94}px` }}
                      title={student.pob || ''}
                    >
                      {student.pob || '—'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Grade */}
            {cfg.showGradeClass && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelGradeClass || 'ថ្នាក់ទី'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span className="font-bold truncate min-w-0" style={{ color: cfg.primaryColor || '#0c4a6e' }}>
                  {student.grade || '—'}
                </span>
              </div>
            )}

            {/* Parents' Names */}
            {cfg.showParents && (
              <>
                <div className="flex items-start min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                  <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                    {cfg.labelFather || 'ឈ្មោះឪពុក'}
                  </span>
                  <span className="mr-1 shrink-0">:</span>
                  <span
                    className="text-neutral-800 min-w-0 flex-1 leading-snug break-words overflow-visible"
                    style={{
                      fontSize: (student.father_name?.length || 0) > 20
                        ? `${baseInfoSize * 0.82}px`
                        : `${baseInfoSize * 0.92}px`,
                    }}
                  >
                    {student.father_name || '—'}
                  </span>
                </div>
                <div className="flex items-start min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                  <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                    {cfg.labelMother || 'ឈ្មោះម្ដាយ'}
                  </span>
                  <span className="mr-1 shrink-0">:</span>
                  <span
                    className="text-neutral-800 min-w-0 flex-1 leading-snug break-words overflow-visible"
                    style={{
                      fontSize: (student.mother_name?.length || 0) > 20
                        ? `${baseInfoSize * 0.82}px`
                        : `${baseInfoSize * 0.92}px`,
                    }}
                  >
                    {student.mother_name || '—'}
                  </span>
                </div>
              </>
            )}

            {/* Phone Number */}
            {cfg.showPhone && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelPhone || 'ទូរស័ព្ទ'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="font-mono text-neutral-800 truncate min-w-0"
                  style={{ fontSize: `${baseInfoSize * 0.94}px` }}
                >
                  {formatPhoneNumber(student.student_phone || '') || '—'}
                </span>
              </div>
            )}

            {/* Blood Type (Optional) */}
            {cfg.showBloodType && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelBloodType || 'ក្រុមឈាម'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="font-bold text-rose-700 truncate min-w-0"
                  style={{ fontSize: `${baseInfoSize * 0.96}px` }}
                >
                  {student.blood_type || '—'}
                </span>
              </div>
            )}

            {/* Expiry Date (Optional) */}
            {cfg.showExpiryDate && (
              <div className="flex items-baseline min-w-0" style={{ fontSize: `${baseInfoSize}px` }}>
                <span className="shrink-0 font-semibold text-neutral-700 whitespace-nowrap" style={{ minWidth: labelWidth }}>
                  {cfg.labelExpiryDate || 'សុពលភាពដល់'}
                </span>
                <span className="mr-1 shrink-0">:</span>
                <span
                  className="text-neutral-800 truncate min-w-0"
                  style={{ fontSize: `${baseInfoSize * 0.92}px` }}
                >
                  {student.expiry_date || school.academic_year || '—'}
                </span>
              </div>
            )}
          </div>

          {/* Photo & QR Code Column (Decoupled Slot with Fixed Width) */}
          <div
            className={`flex flex-col items-center shrink-0 relative ${
              cfg.photoPosition === 'left' ? 'order-1' : 'order-2'
            }`}
            style={{ width: `${cfg.photoWidthMm || (isLandscape ? 24 : 23)}mm` }}
          >
            {/* Wrapper for photo & photo-corner stamp with layer z-indexes */}
            <div className="relative">
              {renderPhotoControls()}
              {/* Photo 3x4 Box (Independent Fixed Container) */}
              <div
                onClick={() => onSelectElement?.('photo')}
                onMouseDown={(e) => handleStartDrag(e, 'photo', cfg.photoOffsetX || 0, cfg.photoOffsetY || 0)}
                onTouchStart={(e) => handleStartDrag(e, 'photo', cfg.photoOffsetX || 0, cfg.photoOffsetY || 0)}
                className={`overflow-hidden shadow-xs relative flex items-center justify-center shrink-0 transition-all ${
                  student.photo_url
                    ? `border bg-neutral-100 ${getPhotoShapeClass()}`
                    : 'rounded-[2px] border-[0.5px] border-dashed border-slate-300 bg-white/60'
                } ${
                  activeHighlightElement === 'photo'
                    ? 'ring-2 ring-blue-500 ring-offset-1 cursor-grab active:cursor-grabbing pointer-events-auto'
                    : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                }`}
                style={{
                  width: student.photo_url
                    ? `${cfg.photoWidthMm || (isLandscape ? 24 : 23)}mm`
                    : `${Math.min(cfg.photoWidthMm ? cfg.photoWidthMm - 7 : 16, 16)}mm`,
                  height: student.photo_url
                    ? `${cfg.photoHeightMm || 31}mm`
                    : `${Math.min(cfg.photoHeightMm ? cfg.photoHeightMm - 10 : 21, 21)}mm`,
                  transform: `translate(${cfg.photoOffsetX || 0}px, ${cfg.photoOffsetY || 0}px)`,
                  borderColor: student.photo_url ? (cfg.photoBorderColor || '#9ca3af') : '#94a3b8',
                  zIndex: cfg.photoZIndex ?? 20,
                  position: 'relative',
                }}
              >
                {student.photo_url ? (
                  <img
                    src={formatDriveImageUrl(student.photo_url)}
                    alt={student.full_name}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                    style={{
                      transform: `scale(${cfg.photoZoom || 1})`,
                      transformOrigin: 'center center',
                    }}
                    onError={(e) => {
                      const fallback = getDriveImageFallbackUrl(student.photo_url);
                      if (fallback && e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-0.5 select-none pointer-events-none">
                    <svg className="w-3 h-3 text-slate-400 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="font-kantumruy text-[6.5px] font-semibold text-slate-400 tracking-tight leading-none">
                      3 x 4
                    </span>
                  </div>
                )}
              </div>

              {/* Photo-Corner Stamp (when stampPositionMode === 'photo-corner') */}
              {cfg.showStamp && cfg.stampPositionMode === 'photo-corner' && (
                <div
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement('stamp');
                    }
                  }}
                  onMouseDown={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                  onTouchStart={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                  className={`absolute -bottom-3 ${cfg.photoPosition === 'left' ? '-right-3' : '-left-3'} transition-all select-none shrink-0 max-w-none max-h-none ${
                    activeHighlightElement === 'stamp'
                      ? 'ring-2 ring-rose-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto p-0.5'
                      : onSelectElement ? 'pointer-events-auto hover:ring-1 hover:ring-rose-400 cursor-grab' : 'pointer-events-none'
                  }`}
                  style={{
                    width: `${cfg.stampSize || 52}px`,
                    height: `${cfg.stampSize || 52}px`,
                    minWidth: `${cfg.stampSize || 52}px`,
                    minHeight: `${cfg.stampSize || 52}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(${cfg.stampOffsetX || 0}px, ${cfg.stampOffsetY || 0}px) rotate(${cfg.stampRotation || -6}deg)`,
                    transformOrigin: 'center center',
                    opacity: cfg.stampOpacity ?? 0.88,
                    zIndex: cfg.stampZIndex ?? 25,
                  }}
                  title={onSelectElement ? 'ចុច ឬអូសដើម្បីរំកិលត្រាលើរូបថត' : undefined}
                >
                  {renderStampControls()}

                  {school.stamp_url ? (
                    <img
                      src={school.stamp_url}
                      alt="Stamp"
                      referrerPolicy="no-referrer"
                      style={{
                        width: `${cfg.stampSize || 52}px`,
                        height: `${cfg.stampSize || 52}px`,
                        minWidth: `${cfg.stampSize || 52}px`,
                        minHeight: `${cfg.stampSize || 52}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                      }}
                      className="object-contain mix-blend-multiply block max-w-none max-h-none w-full h-full"
                    />
                  ) : (
                    <OfficialRedStamp
                      schoolName={school.school_name}
                      principalName={school.principal_name}
                      size={cfg.stampSize || 52}
                    />
                  )}
                </div>
              )}
            </div>

            {/* QR Code Container (Independent Slot Below Photo) */}
            {cfg.showQrCode && cfg.qrPosition === 'below-photo' && (
              <div
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement('qr');
                  }
                }}
                className={`mt-1 shrink-0 p-0.5 bg-white border border-neutral-300 rounded-[1px] flex flex-col items-center transition-all ${
                  activeHighlightElement === 'qr'
                    ? 'ring-2 ring-blue-500 rounded z-20 cursor-pointer'
                    : onSelectElement ? 'hover:outline-1 hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''
                }`}
                style={{
                  transform: `translate(${cfg.qrOffsetX || 0}px, ${cfg.qrOffsetY || 0}px)`,
                }}
              >
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={cfg.qrSize || 46}
                  level="M"
                />
                <span className="text-[6.2px] font-mono font-semibold text-neutral-600 mt-[1px]">
                  {student.student_id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER / SIGNATURE SECTION (ANCHORED AT BOTTOM) */}
        {/* ======================================================== */}
        {cfg.showFooter && (
          <div
            className="relative z-10 pt-0.5 mt-auto shrink-0 w-full"
            style={{
              transform: `translate(0px, ${cfg.footerOffsetY || 0}px)`,
            }}
          >
            {/* Issue Dates (Independent Slot) */}
            {(cfg.showLunarDate || cfg.showSolarDate) && (
              <div
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement('date');
                  }
                }}
                className={`font-kantumruy text-neutral-600 leading-[1.38] space-y-[1.5px] transition-all rounded overflow-visible ${
                  activeHighlightElement === 'date'
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/50 p-0.5 cursor-pointer pointer-events-auto z-20'
                    : onSelectElement
                    ? 'pointer-events-auto hover:ring-1 hover:ring-emerald-400 cursor-pointer p-0.5'
                    : 'pointer-events-none'
                }`}
                style={{
                  transform: `translate(${cfg.dateOffsetX || 0}px, ${cfg.dateOffsetY || 0}px)`,
                  fontSize: `${cfg.dateFontSize || 6.4}px`,
                }}
              >
                {cfg.showLunarDate && (
                  <p className="text-right italic leading-[1.42] whitespace-nowrap overflow-visible">
                    {toKhmerDigits(school.issue_date_lunar || 'ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨')}
                  </p>
                )}
                {cfg.showSolarDate && (
                  <p className="text-right leading-[1.42] whitespace-nowrap overflow-visible">
                    {toKhmerDigits(school.issue_date_solar || 'ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥')}
                  </p>
                )}
              </div>
            )}

            {/* Principal & Seal Stamp Area */}
            <div className="flex justify-between items-end mt-0.5 w-full">
              {/* Left: Bottom-Left QR code OR Contact info (Decoupled Slot) */}
              <div className="flex flex-col justify-end min-w-[32px] shrink-0">
                {cfg.showQrCode && cfg.qrPosition === 'bottom-left' ? (
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('qr');
                      }
                    }}
                    className={`flex items-center gap-1.5 p-0.5 bg-white/90 rounded transition-all ${
                      activeHighlightElement === 'qr'
                        ? 'ring-2 ring-blue-500 z-20 cursor-pointer pointer-events-auto'
                        : onSelectElement ? 'pointer-events-auto hover:ring-1 hover:ring-blue-400 cursor-pointer' : 'pointer-events-none'
                    }`}
                    style={{
                      transform: `translate(${cfg.qrOffsetX || 0}px, ${cfg.qrOffsetY || 0}px)`,
                    }}
                  >
                    <QRCodeSVG
                      value={qrCodeUrl}
                      size={cfg.qrSize || 32}
                      level="M"
                    />
                    <div className="text-[6.5px] font-mono font-semibold text-neutral-600">
                      <span>{student.student_id}</span>
                    </div>
                  </div>
                ) : (
                  cfg.showFooterContact && school.contact_number && school.contact_number !== '095 858 545' && school.contact_number !== '095858545' && (
                    <div className="text-[6.4px] font-kantumruy text-neutral-600">
                      <p className="font-semibold text-neutral-800">ទំនាក់ទំនង៖</p>
                      <p className="font-mono">{school.contact_number}</p>
                    </div>
                  )
                )}
              </div>

              {/* Right: Principal Stamp & Signature Box (Decoupled Slot) */}
              <div className="relative text-center w-[36mm] shrink-0">
                {cfg.showPrincipalTitle && (
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('principalTitle');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'principalTitle', cfg.principalTitleOffsetX || 0, cfg.principalTitleOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'principalTitle', cfg.principalTitleOffsetX || 0, cfg.principalTitleOffsetY || 0)}
                    className={`transition-all rounded relative select-none ${
                      activeHighlightElement === 'principalTitle'
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/70 p-0.5 cursor-grab active:cursor-grabbing pointer-events-auto z-30 shadow-xs'
                        : onSelectElement
                        ? 'pointer-events-auto hover:ring-1 hover:ring-indigo-400 hover:bg-indigo-50/30 cursor-grab p-0.5'
                        : 'pointer-events-none'
                    }`}
                    style={{
                      transform: `translate(${cfg.principalTitleOffsetX || 0}px, ${cfg.principalTitleOffsetY || 0}px)`,
                    }}
                    title={onSelectElement ? 'ចុច ឬអូសដើម្បីរំកិលទីតាំង «នាយកវិទ្យាល័យ»' : undefined}
                  >
                    {/* On-Card Floating Controls when active */}
                    {activeHighlightElement === 'principalTitle' && (onNudgeElement || onUpdateOffset) && (
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-xl border border-indigo-400/60 z-50 pointer-events-auto whitespace-nowrap text-[9px] font-sans"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono text-[8px] text-indigo-300 px-1">
                          X:{cfg.principalTitleOffsetX || 0} Y:{cfg.principalTitleOffsetY || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalTitle', -2, 0) : onUpdateOffset?.('principalTitle', (cfg.principalTitleOffsetX || 0) - 2, cfg.principalTitleOffsetY || 0)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលឆ្វេង"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalTitle', 0, -2) : onUpdateOffset?.('principalTitle', cfg.principalTitleOffsetX || 0, (cfg.principalTitleOffsetY || 0) - 2)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលឡើង"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalTitle', 0, 2) : onUpdateOffset?.('principalTitle', cfg.principalTitleOffsetX || 0, (cfg.principalTitleOffsetY || 0) + 2)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលចុះ"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalTitle', 2, 0) : onUpdateOffset?.('principalTitle', (cfg.principalTitleOffsetX || 0) + 2, cfg.principalTitleOffsetY || 0)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលស្តាំ"
                        >
                          ▶
                        </button>
                        {onResetElement && (
                          <button
                            type="button"
                            onClick={() => onResetElement('principalTitle')}
                            className="px-1 h-4 flex items-center justify-center rounded bg-indigo-700/80 hover:bg-indigo-500 text-white font-mono text-[7.5px] cursor-pointer ml-0.5 transition-colors"
                            title="កំណត់ដើម (0, 0)"
                          >
                            ↺0
                          </button>
                        )}
                      </div>
                    )}

                    <p
                      className="font-muol leading-tight"
                      style={{
                        color: cfg.primaryColor || '#0c4a6e',
                        fontSize: `${cfg.principalTitleFontSize || 7.3}px`,
                      }}
                    >
                      {cfg.principalTitleText || school.principal_title || 'នាយកវិទ្យាល័យ'}
                    </p>
                  </div>
                )}

                {/* Signature & Stamp Overlay */}
                <div className="relative h-[11mm] flex items-center justify-center my-[-2px]">
                  {/* Official Red Stamp (when stampPositionMode !== 'photo-corner') */}
                  {cfg.showStamp && cfg.stampPositionMode !== 'photo-corner' && (
                    <div
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('stamp');
                        }
                      }}
                      onMouseDown={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                      onTouchStart={(e) => handleStartDrag(e, 'stamp', cfg.stampOffsetX || 0, cfg.stampOffsetY || 0)}
                      className={`absolute right-[-4mm] top-[-3mm] transition-all select-none shrink-0 max-w-none max-h-none ${
                        activeHighlightElement === 'stamp'
                          ? 'ring-2 ring-rose-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto p-0.5'
                          : onSelectElement ? 'pointer-events-auto hover:ring-1 hover:ring-rose-400 cursor-pointer' : 'pointer-events-none'
                      }`}
                      style={{
                        width: `${cfg.stampSize || 52}px`,
                        height: `${cfg.stampSize || 52}px`,
                        minWidth: `${cfg.stampSize || 52}px`,
                        minHeight: `${cfg.stampSize || 52}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        transform: `translate(${cfg.stampOffsetX || 0}px, ${cfg.stampOffsetY || 0}px) rotate(${cfg.stampRotation || -6}deg)`,
                        transformOrigin: 'center center',
                        opacity: cfg.stampOpacity ?? 0.88,
                        zIndex: cfg.stampZIndex ?? 25,
                      }}
                    >
                      {renderStampControls()}
                      {school.stamp_url ? (
                        <img
                          src={school.stamp_url}
                          alt="Stamp"
                          referrerPolicy="no-referrer"
                          style={{
                            width: `${cfg.stampSize || 52}px`,
                            height: `${cfg.stampSize || 52}px`,
                            minWidth: `${cfg.stampSize || 52}px`,
                            minHeight: `${cfg.stampSize || 52}px`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                          }}
                          className="object-contain mix-blend-multiply block max-w-none max-h-none w-full h-full"
                        />
                      ) : (
                        <OfficialRedStamp
                          schoolName={school.school_name}
                          principalName={school.principal_name}
                          size={cfg.stampSize || 52}
                        />
                      )}
                    </div>
                  )}

                  {/* Principal Signature */}
                  {cfg.showSignature && (
                    <div
                      onClick={(e) => {
                        if (onSelectElement) {
                          e.stopPropagation();
                          onSelectElement('signature');
                        }
                      }}
                      className={`relative z-10 transition-all ${
                        activeHighlightElement === 'signature'
                          ? 'ring-2 ring-blue-500 rounded p-1 z-20 cursor-pointer pointer-events-auto'
                          : onSelectElement ? 'pointer-events-auto hover:ring-1 hover:ring-blue-400 cursor-pointer' : 'pointer-events-none'
                      }`}
                      style={{
                        transform: `translate(${cfg.signatureOffsetX || 0}px, ${cfg.signatureOffsetY || 0}px) scale(${cfg.signatureScale || 1})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      {school.signature_url ? (
                        <img
                          src={school.signature_url}
                          alt="Signature"
                          referrerPolicy="no-referrer"
                          className="h-7 object-contain mix-blend-multiply"
                        />
                      ) : (
                        <PrincipalSignature width={75} height={28} />
                      )}
                    </div>
                  )}
                </div>

                {/* Principal Full Name */}
                {cfg.showPrincipalName && (
                  <div
                    onClick={(e) => {
                      if (onSelectElement) {
                        e.stopPropagation();
                        onSelectElement('principalName');
                      }
                    }}
                    onMouseDown={(e) => handleStartDrag(e, 'principalName', cfg.principalNameOffsetX || 0, cfg.principalNameOffsetY || 0)}
                    onTouchStart={(e) => handleStartDrag(e, 'principalName', cfg.principalNameOffsetX || 0, cfg.principalNameOffsetY || 0)}
                    className={`transition-all rounded relative select-none ${
                      activeHighlightElement === 'principalName'
                        ? 'ring-2 ring-purple-500 bg-purple-50/70 p-0.5 cursor-grab active:cursor-grabbing pointer-events-auto z-30 shadow-xs'
                        : onSelectElement
                        ? 'pointer-events-auto hover:ring-1 hover:ring-purple-400 hover:bg-purple-50/30 cursor-grab p-0.5'
                        : 'pointer-events-none'
                    }`}
                    style={{
                      transform: `translate(${cfg.principalNameOffsetX || 0}px, ${cfg.principalNameOffsetY || 0}px)`,
                    }}
                    title={onSelectElement ? 'ចុច ឬអូសដើម្បីរំកិលទីតាំង «ឈ្មោះនាយក»' : undefined}
                  >
                    {/* On-Card Floating Controls when active */}
                    {activeHighlightElement === 'principalName' && (onNudgeElement || onUpdateOffset) && (
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-xl border border-purple-400/60 z-50 pointer-events-auto whitespace-nowrap text-[9px] font-sans"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono text-[8px] text-purple-300 px-1">
                          X:{cfg.principalNameOffsetX || 0} Y:{cfg.principalNameOffsetY || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalName', -2, 0) : onUpdateOffset?.('principalName', (cfg.principalNameOffsetX || 0) - 2, cfg.principalNameOffsetY || 0)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-purple-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលឆ្វេង"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalName', 0, -2) : onUpdateOffset?.('principalName', cfg.principalNameOffsetX || 0, (cfg.principalNameOffsetY || 0) - 2)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-purple-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលឡើង"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalName', 0, 2) : onUpdateOffset?.('principalName', cfg.principalNameOffsetX || 0, (cfg.principalNameOffsetY || 0) + 2)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-purple-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលចុះ"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgeElement ? onNudgeElement('principalName', 2, 0) : onUpdateOffset?.('principalName', (cfg.principalNameOffsetX || 0) + 2, cfg.principalNameOffsetY || 0)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-purple-600 text-white font-bold cursor-pointer transition-colors active:scale-90"
                          title="រំកិលស្តាំ"
                        >
                          ▶
                        </button>
                        {onResetElement && (
                          <button
                            type="button"
                            onClick={() => onResetElement('principalName')}
                            className="px-1 h-4 flex items-center justify-center rounded bg-purple-700/80 hover:bg-purple-500 text-white font-mono text-[7.5px] cursor-pointer ml-0.5 transition-colors"
                            title="កំណត់ដើម (0, 0)"
                          >
                            ↺0
                          </button>
                        )}
                      </div>
                    )}

                    <p
                      className="font-muol leading-tight mt-[1px]"
                      style={{
                        color: cfg.primaryColor || '#0c4a6e',
                        fontSize: `${cfg.principalNameFontSize || 7.6}px`,
                      }}
                    >
                      {cfg.principalNameText || school.principal_name || 'អ៊ុង កងធារ៉ាវុធ'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
