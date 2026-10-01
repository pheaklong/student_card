import React, { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Layers,
  Type,
  UserCheck,
  FileCheck2,
  Printer,
  ChevronRight,
  Download,
  Upload,
  QrCode,
  ShieldCheck,
  Plus,
  Trash2,
  MoveVertical,
  FlipHorizontal,
  Info,
  Move,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  SlidersHorizontal,
  Square,
  ZoomIn,
  Calendar,
} from 'lucide-react';
import { SchoolSettings, Student, CardTemplateConfig, TemplatePresetId } from '../types';
import { StudentCard } from './StudentCard';
import {
  DEFAULT_TEMPLATE_CONFIG,
  TEMPLATE_PRESETS,
  getEffectiveTemplateConfig,
} from '../lib/templatePresets';
import { MoEYSEmblem } from './CambodianEmblems';

interface CardTemplateEditorViewProps {
  school: SchoolSettings;
  students: Student[];
  onSaveTemplate: (newTemplate: CardTemplateConfig) => Promise<void>;
  onGoToPrint: () => void;
}

export type EditorTab =
  | 'layers'
  | 'positioning'
  | 'title'
  | 'dimensions'
  | 'presets'
  | 'style'
  | 'header'
  | 'fields'
  | 'photo'
  | 'footer'
  | 'backside';

export type SelectableElement =
  | 'card'
  | 'photo'
  | 'info'
  | 'logo'
  | 'header'
  | 'headerKingdom'
  | 'headerMotto'
  | 'headerMinistry'
  | 'headerDepartment'
  | 'headerSchoolName'
  | 'title'
  | 'subtitle'
  | 'stamp'
  | 'signature'
  | 'qr'
  | 'date'
  | 'principalTitle'
  | 'principalName';

export const CardTemplateEditorView: React.FC<CardTemplateEditorViewProps> = ({
  school,
  students,
  onSaveTemplate,
  onGoToPrint,
}) => {
  const [template, setTemplate] = useState<CardTemplateConfig>(
    getEffectiveTemplateConfig(school.template_config)
  );
  const [activeTab, setActiveTab] = useState<EditorTab>('positioning');
  const [selectedElement, setSelectedElement] = useState<SelectableElement>('photo');
  const [nudgeStep, setNudgeStep] = useState<number>(2);
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'mm'>('cm');
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [previewBackSide, setPreviewBackSide] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [showCutLines, setShowCutLines] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected student for preview
  const currentStudent = students[previewStudentIndex] || students[0] || {
    id: 'sample-1',
    student_id: 'ID-5997',
    full_name: 'សុខ ចាន់ដារ៉ា',
    latin_name: 'SOK CHANDARA',
    gender: 'ប្រុស',
    dob: '១៥-០៨-២០០៨',
    pob: 'ភូមិពាមរក៍ ស្រុកពាមរក៍ ខេត្តព្រៃវែង',
    grade: '11B',
    class_number: '8',
    father_name: 'សុខ គឹមហុង',
    mother_name: 'ឡុង ស្រីមុំ',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-5997',
    phone_number: '097 554 321',
    blood_type: 'O+',
    expiry_date: '៣១ សីហា ២០២៦',
  };

  const handleUpdate = (updates: Partial<CardTemplateConfig>) => {
    const next = {
      ...template,
      presetId: 'custom' as TemplatePresetId,
      ...updates,
    };
    setTemplate(next);
    onSaveTemplate(next);
  };

  const handleApplyPreset = (presetId: TemplatePresetId) => {
    const found = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      const next: CardTemplateConfig = {
        ...template,
        ...found.config,
        presetId,
      };
      setTemplate(next);
      onSaveTemplate(next);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់គំរូប័ណ្ណទៅស្តង់ដារដើមវិញមែនទេ?')) {
      const next = { ...DEFAULT_TEMPLATE_CONFIG };
      setTemplate(next);
      onSaveTemplate(next);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTemplate(template);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Save template failed:', e);
      alert('មានបញ្ហាក្នុងការរក្សាទុកគំរូ');
    } finally {
      setIsSaving(false);
    }
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `template_${template.presetId}_${Date.now()}.json`);
    dlAnchor.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setTemplate(getEffectiveTemplateConfig(parsed));
          alert('បានបញ្ចូលការកំណត់គំរូដោយជោគជ័យ!');
        }
      } catch (err) {
        alert('ឯកសារ JSON មិនត្រឹមត្រូវឡើយ!');
      }
    };
    reader.readAsText(file);
  };

  // Backside rules management
  const handleAddRule = () => {
    const newRules = [...template.backsideRules, 'បទបញ្ជាថ្មី...'];
    handleUpdate({ backsideRules: newRules });
  };

  const handleUpdateRule = (index: number, value: string) => {
    const newRules = [...template.backsideRules];
    newRules[index] = value;
    handleUpdate({ backsideRules: newRules });
  };

  const handleDeleteRule = (index: number) => {
    const newRules = template.backsideRules.filter((_, i) => i !== index);
    handleUpdate({ backsideRules: newRules });
  };

  // Quick bilingual labels helper
  const handleSetBilingualLabels = () => {
    handleUpdate({
      labelStudentId: 'អត្តលេខ / ID',
      labelFullName: 'គោត្តនាម-នាម / Name',
      labelLatinName: 'ឡាតាំង / Latin Name',
      labelGender: 'ភេទ / Sex',
      labelDob: 'ថ្ងៃខែឆ្នាំកំណើត / DOB',
      labelPob: 'ទីកន្លែងកំណើត / POB',
      labelGradeClass: 'ថ្នាក់ទី / Class',
      labelFather: 'ឪពុក / Father',
      labelMother: 'ម្ដាយ / Mother',
      labelPhone: 'ទូរស័ព្ទ / Phone',
      labelBloodType: 'ក្រុមឈាម / Blood',
      labelExpiryDate: 'សុពលភាព / Expire',
      showLatinName: true,
    });
  };

  const handleSetKhmerOnlyLabels = () => {
    handleUpdate({
      labelStudentId: 'អត្តលេខ ID',
      labelFullName: 'គោត្តនាម-នាម',
      labelLatinName: 'អក្សរឡាតាំង',
      labelGender: 'ភេទ',
      labelDob: 'ថ្ងៃខែឆ្នាំកំណើត',
      labelPob: 'ទីកន្លែងកំណើត',
      labelDobPob: 'ថ្ងៃខែឆ្នាំ និងទីកន្លែងកំណើត',
      combineDobPob: true,
      labelGradeClass: 'ថ្នាក់ទី',
      labelFather: 'ឈ្មោះឪពុក',
      labelMother: 'ឈ្មោះម្ដាយ',
      labelPhone: 'ទូរស័ព្ទ',
      labelBloodType: 'ក្រុមឈាម',
      labelExpiryDate: 'សុពលភាពដល់',
    });
  };

  const handleNudge = (dx: number, dy: number) => {
    if (selectedElement === 'logo') {
      handleUpdate({
        logoOffsetX: (template.logoOffsetX || 0) + dx,
        logoOffsetY: (template.logoOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'header') {
      handleUpdate({
        headerOffsetY: (template.headerOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'headerKingdom') {
      handleUpdate({
        headerKingdomOffsetX: (template.headerKingdomOffsetX || 0) + dx,
        headerKingdomOffsetY: (template.headerKingdomOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'headerMotto') {
      handleUpdate({
        headerMottoOffsetX: (template.headerMottoOffsetX || 0) + dx,
        headerMottoOffsetY: (template.headerMottoOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'headerMinistry') {
      handleUpdate({
        headerMinistryOffsetX: (template.headerMinistryOffsetX || 0) + dx,
        headerMinistryOffsetY: (template.headerMinistryOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'headerDepartment') {
      handleUpdate({
        headerDepartmentOffsetX: (template.headerDepartmentOffsetX || 0) + dx,
        headerDepartmentOffsetY: (template.headerDepartmentOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'headerSchoolName') {
      handleUpdate({
        headerSchoolNameOffsetX: (template.headerSchoolNameOffsetX || 0) + dx,
        headerSchoolNameOffsetY: (template.headerSchoolNameOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'photo') {
      handleUpdate({
        photoOffsetX: (template.photoOffsetX || 0) + dx,
        photoOffsetY: (template.photoOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'info') {
      handleUpdate({
        infoOffsetX: (template.infoOffsetX || 0) + dx,
        infoOffsetY: (template.infoOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'stamp') {
      handleUpdate({
        stampOffsetX: (template.stampOffsetX || 0) + dx,
        stampOffsetY: (template.stampOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'signature') {
      handleUpdate({
        signatureOffsetX: (template.signatureOffsetX || 0) + dx,
        signatureOffsetY: (template.signatureOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'qr') {
      handleUpdate({
        qrOffsetX: (template.qrOffsetX || 0) + dx,
        qrOffsetY: (template.qrOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'date') {
      handleUpdate({
        dateOffsetX: (template.dateOffsetX || 0) + dx,
        dateOffsetY: (template.dateOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'principalTitle') {
      handleUpdate({
        principalTitleOffsetX: (template.principalTitleOffsetX || 0) + dx,
        principalTitleOffsetY: (template.principalTitleOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'title') {
      handleUpdate({
        titleOffsetX: (template.titleOffsetX || 0) + dx,
        titleOffsetY: (template.titleOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'subtitle') {
      handleUpdate({
        subtitleOffsetX: (template.subtitleOffsetX || 0) + dx,
        subtitleOffsetY: (template.subtitleOffsetY || 0) + dy,
      });
    } else if (selectedElement === 'principalName') {
      handleUpdate({
        principalNameOffsetX: (template.principalNameOffsetX || 0) + dx,
        principalNameOffsetY: (template.principalNameOffsetY || 0) + dy,
      });
    }
  };

  const handleResetElement = () => {
    if (selectedElement === 'logo') {
      handleUpdate({ logoOffsetX: 0, logoOffsetY: 0, logoScale: 1 });
    } else if (selectedElement === 'header') {
      handleUpdate({ headerOffsetY: 0, headerScale: 1 });
    } else if (selectedElement === 'headerKingdom') {
      handleUpdate({ headerKingdomOffsetX: 0, headerKingdomOffsetY: 0 });
    } else if (selectedElement === 'headerMotto') {
      handleUpdate({ headerMottoOffsetX: 0, headerMottoOffsetY: 0 });
    } else if (selectedElement === 'headerMinistry') {
      handleUpdate({ headerMinistryOffsetX: 0, headerMinistryOffsetY: 0 });
    } else if (selectedElement === 'headerDepartment') {
      handleUpdate({ headerDepartmentOffsetX: 0, headerDepartmentOffsetY: 0 });
    } else if (selectedElement === 'headerSchoolName') {
      handleUpdate({ headerSchoolNameOffsetX: 0, headerSchoolNameOffsetY: 0 });
    } else if (selectedElement === 'title') {
      handleUpdate({ titleOffsetX: 0, titleOffsetY: 0, titleFontSize: 10 });
    } else if (selectedElement === 'subtitle') {
      handleUpdate({ subtitleOffsetX: 0, subtitleOffsetY: 0, subtitleFontSize: 7.6 });
    } else if (selectedElement === 'photo') {
      handleUpdate({ photoOffsetX: 0, photoOffsetY: 0, photoWidthMm: 23, photoHeightMm: 31, photoZoom: 1 });
    } else if (selectedElement === 'info') {
      handleUpdate({ infoOffsetX: 0, infoOffsetY: 0, infoFontSize: 8.3, infoLineSpacing: 1.35, infoLabelWidth: 23 });
    } else if (selectedElement === 'stamp') {
      handleUpdate({ stampOffsetX: 0, stampOffsetY: 0, stampSize: 52, stampRotation: -6, stampOpacity: 0.88 });
    } else if (selectedElement === 'signature') {
      handleUpdate({ signatureOffsetX: 0, signatureOffsetY: 0, signatureScale: 1 });
    } else if (selectedElement === 'qr') {
      handleUpdate({ qrOffsetX: 0, qrOffsetY: 0, qrSize: 46 });
    } else if (selectedElement === 'date') {
      handleUpdate({ dateOffsetX: 0, dateOffsetY: 0, dateFontSize: 6.4 });
    } else if (selectedElement === 'principalTitle') {
      handleUpdate({ principalTitleOffsetX: 0, principalTitleOffsetY: 0, principalTitleFontSize: 7.3 });
    } else if (selectedElement === 'principalName') {
      handleUpdate({ principalNameOffsetX: 0, principalNameOffsetY: 0, principalNameFontSize: 7.6 });
    }
  };

  const handleSetElementOffset = (element: string, offsetX: number, offsetY: number) => {
    if (element === 'title') {
      handleUpdate({
        titleOffsetX: Math.max(-80, Math.min(80, offsetX)),
        titleOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'subtitle') {
      handleUpdate({
        subtitleOffsetX: Math.max(-80, Math.min(80, offsetX)),
        subtitleOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'headerKingdom') {
      handleUpdate({
        headerKingdomOffsetX: Math.max(-80, Math.min(80, offsetX)),
        headerKingdomOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'headerMotto') {
      handleUpdate({
        headerMottoOffsetX: Math.max(-80, Math.min(80, offsetX)),
        headerMottoOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'headerMinistry') {
      handleUpdate({
        headerMinistryOffsetX: Math.max(-80, Math.min(80, offsetX)),
        headerMinistryOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'headerDepartment') {
      handleUpdate({
        headerDepartmentOffsetX: Math.max(-80, Math.min(80, offsetX)),
        headerDepartmentOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'headerSchoolName') {
      handleUpdate({
        headerSchoolNameOffsetX: Math.max(-80, Math.min(80, offsetX)),
        headerSchoolNameOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'principalTitle') {
      handleUpdate({
        principalTitleOffsetX: Math.max(-80, Math.min(80, offsetX)),
        principalTitleOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'principalName') {
      handleUpdate({
        principalNameOffsetX: Math.max(-80, Math.min(80, offsetX)),
        principalNameOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'date') {
      handleUpdate({
        dateOffsetX: Math.max(-80, Math.min(80, offsetX)),
        dateOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'stamp') {
      handleUpdate({
        stampOffsetX: Math.max(-100, Math.min(100, offsetX)),
        stampOffsetY: Math.max(-100, Math.min(100, offsetY)),
      });
    } else if (element === 'signature') {
      handleUpdate({
        signatureOffsetX: Math.max(-80, Math.min(80, offsetX)),
        signatureOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'photo') {
      handleUpdate({
        photoOffsetX: Math.max(-80, Math.min(80, offsetX)),
        photoOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    } else if (element === 'logo') {
      handleUpdate({
        logoOffsetX: Math.max(-80, Math.min(80, offsetX)),
        logoOffsetY: Math.max(-60, Math.min(60, offsetY)),
      });
    }
  };

  const handleResetElementByName = (element: string) => {
    if (element === 'title') {
      handleUpdate({ titleOffsetX: 0, titleOffsetY: 0 });
    } else if (element === 'subtitle') {
      handleUpdate({ subtitleOffsetX: 0, subtitleOffsetY: 0 });
    } else if (element === 'headerKingdom') {
      handleUpdate({ headerKingdomOffsetX: 0, headerKingdomOffsetY: 0 });
    } else if (element === 'headerMotto') {
      handleUpdate({ headerMottoOffsetX: 0, headerMottoOffsetY: 0 });
    } else if (element === 'headerMinistry') {
      handleUpdate({ headerMinistryOffsetX: 0, headerMinistryOffsetY: 0 });
    } else if (element === 'headerDepartment') {
      handleUpdate({ headerDepartmentOffsetX: 0, headerDepartmentOffsetY: 0 });
    } else if (element === 'headerSchoolName') {
      handleUpdate({ headerSchoolNameOffsetX: 0, headerSchoolNameOffsetY: 0 });
    } else if (element === 'principalTitle') {
      handleUpdate({ principalTitleOffsetX: 0, principalTitleOffsetY: 0 });
    } else if (element === 'principalName') {
      handleUpdate({ principalNameOffsetX: 0, principalNameOffsetY: 0 });
    } else if (element === 'stamp') {
      handleUpdate({ stampOffsetX: 0, stampOffsetY: 0 });
    } else if (element === 'signature') {
      handleUpdate({ signatureOffsetX: 0, signatureOffsetY: 0 });
    } else if (element === 'date') {
      handleUpdate({ dateOffsetX: 0, dateOffsetY: 0 });
    } else {
      handleResetElement();
    }
  };

  const handleUpdateElementSize = (element: string, delta: number) => {
    if (element === 'photo' || element === 'photoZoom') {
      const curZoom = template.photoZoom || 1;
      const newZoom = Math.max(0.4, Math.min(3.5, parseFloat((curZoom + delta * 0.05).toFixed(2))));
      handleUpdate({ photoZoom: newZoom });
    } else if (element === 'photoWidth') {
      const curW = template.photoWidthMm || (template.cardLayoutMode === 'kamrieng-official' ? 27 : 23);
      handleUpdate({ photoWidthMm: Math.max(15, Math.min(65, curW + delta)) });
    } else if (element === 'photoHeight') {
      const curH = template.photoHeightMm || (template.cardLayoutMode === 'kamrieng-official' ? 36 : 31);
      handleUpdate({ photoHeightMm: Math.max(20, Math.min(85, curH + delta)) });
    } else if (element === 'stamp' || element === 'stampSize') {
      const curSize = template.stampSize || 52;
      handleUpdate({ stampSize: Math.max(20, Math.min(350, curSize + delta * 5)) });
    } else if (element === 'qr') {
      const curSize = template.qrSize || 46;
      handleUpdate({ qrSize: Math.max(24, Math.min(120, curSize + delta * 2)) });
    } else if (element === 'logo') {
      const curScale = template.logoScale || 1;
      handleUpdate({ logoScale: Math.max(0.3, Math.min(3.0, parseFloat((curScale + delta * 0.05).toFixed(2)))) });
    } else if (element === 'header' || element === 'headerScale') {
      const curScale = template.headerScale || 1;
      handleUpdate({ headerScale: Math.max(0.5, Math.min(2.5, parseFloat((curScale + delta * 0.05).toFixed(2)))) });
    } else if (element === 'info' || element === 'infoScale') {
      const curScale = template.infoScale || 1.0;
      handleUpdate({ infoScale: Math.max(0.6, Math.min(2.0, parseFloat((curScale + delta * 0.05).toFixed(2)))) });
    } else if (element === 'headerKingdom') {
      const cur = template.headerKingdomFontSize || 8.8;
      handleUpdate({ headerKingdomFontSize: Math.max(5.0, Math.min(22.0, parseFloat((cur + delta * 0.3).toFixed(1)))) });
    } else if (element === 'headerMotto') {
      const cur = template.headerMottoFontSize || 7.6;
      handleUpdate({ headerMottoFontSize: Math.max(4.5, Math.min(20.0, parseFloat((cur + delta * 0.3).toFixed(1)))) });
    } else if (element === 'headerMinistry') {
      const cur = template.headerMinistryFontSize || 7.5;
      handleUpdate({ headerMinistryFontSize: Math.max(5.0, Math.min(20.0, parseFloat((cur + delta * 0.3).toFixed(1)))) });
    } else if (element === 'headerDepartment') {
      const cur = template.headerDepartmentFontSize || 7.0;
      handleUpdate({ headerDepartmentFontSize: Math.max(5.0, Math.min(20.0, parseFloat((cur + delta * 0.3).toFixed(1)))) });
    } else if (element === 'headerSchoolName') {
      const cur = template.headerSchoolNameFontSize || 8.5;
      handleUpdate({ headerSchoolNameFontSize: Math.max(5.5, Math.min(24.0, parseFloat((cur + delta * 0.3).toFixed(1)))) });
    } else if (element === 'title') {
      const cur = template.titleFontSize || 10;
      handleUpdate({ titleFontSize: Math.max(6.0, Math.min(26.0, parseFloat((cur + delta * 0.5).toFixed(1)))) });
    } else if (element === 'subtitle') {
      const cur = template.subtitleFontSize || 6.5;
      handleUpdate({ subtitleFontSize: Math.max(5.0, Math.min(20.0, parseFloat((cur + delta * 0.4).toFixed(1)))) });
    }
  };

  // Keyboard arrow keys listener for fine-tuning positioning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : nudgeStep;
        if (e.key === 'ArrowUp') handleNudge(0, -step);
        if (e.key === 'ArrowDown') handleNudge(0, step);
        if (e.key === 'ArrowLeft') handleNudge(-step, 0);
        if (e.key === 'ArrowRight') handleNudge(step, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, nudgeStep, template]);

  const CARD_SIZE_PRESETS = [
    {
      name: 'កម្ពុជាស្តង់ដារ (MoEYS Standard)',
      desc: '៩.២ x ១២.៨ សង់ទីម៉ែត្រ (៩២ x ១២៨ មម)',
      width: 92,
      height: 128,
      radius: 3,
      orientation: 'portrait' as const,
    },
    {
      name: 'កាត ATM / CR80 ផ្តេក (Bank Card)',
      desc: '៨.៥៦ x ៥.៤ សង់ទីម៉ែត្រ (៨៥.៦ x ៥៤ មម)',
      width: 85.6,
      height: 54,
      radius: 3.18,
      orientation: 'landscape' as const,
    },
    {
      name: 'កាត CR80 បញ្ឈរ (Vertical CR80)',
      desc: '៥.៤ x ៨.៥៦ សង់ទីម៉ែត្រ (៥៤ x ៨៥.៦ មម)',
      width: 54,
      height: 85.6,
      radius: 3.18,
      orientation: 'portrait' as const,
    },
    {
      name: 'កាតសន្និសីទ / Badge (Badge 100x70)',
      desc: '១០.០ x ៧.០ សង់ទីម៉ែត្រ (១០០ x ៧០ មម)',
      width: 100,
      height: 70,
      radius: 4,
      orientation: 'landscape' as const,
    },
    {
      name: 'កាតហោប៉ៅតូច (Pocket ID 65x95)',
      desc: '៦.៥ x ៩.៥ សង់ទីម៉ែត្រ (៦៥ x ៩៥ មម)',
      width: 65,
      height: 95,
      radius: 3,
      orientation: 'portrait' as const,
    },
  ];

  const formatDimension = (mmVal: number, unit: 'cm' | 'mm' = dimensionUnit) => {
    if (unit === 'cm') {
      const cm = mmVal / 10;
      return `${Number.isInteger(cm) ? cm : cm.toFixed(1)} cm`;
    }
    return `${mmVal} mm`;
  };

  return (
    <div className="space-y-5">
      {/* Studio Header & Action Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs font-kantumruy flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                កម្មវិធីកែសម្រួលគំរូប័ណ្ណសិស្ស (ID Card Template Studio)
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {template.presetId}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                កែសម្រួលប្លង់ ពណ៌ ស្លាកព័ត៌មាន ត្រា-ហត្ថលេខា និងគំរូប័ណ្ណតាមចិត្តចង់បាន
                ជាមួយនឹងការមើលឃើញផ្ទាល់ (Live Preview)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export / Import JSON */}
          <button
            onClick={handleExportJSON}
            title="ទាញយកការកំណត់ជា JSON (Export)"
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            title="បញ្ចូលការកំណត់ពី JSON (Import)"
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ស្តង់ដារដើម</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            title="រក្សាទុក និងកំណត់គំរូនេះជា Default សម្រាប់គ្រប់ឧបករណ៍ (ទូរស័ព្ទ ថេប្លេត កុំព្យូទ័រ) ពេលស្កេន QR Code"
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200 active:scale-95'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>បានកំណត់ជា Default គ្រប់ឧបករណ៍!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{isSaving ? 'កំពុងកំណត់...' : 'កំណត់ជា Default គ្រប់ឧបករណ៍'}</span>
              </>
            )}
          </button>

          <button
            onClick={async () => {
              await onSaveTemplate(template);
              onGoToPrint();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>បោះពុម្ព A4</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-kantumruy">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONTROLS & TABS (7 cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick 100% Kamrieng Match Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-600 text-white rounded-lg shadow-xs text-base">
                ✨
              </span>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <span>គំរូវិទ្យាល័យកំរៀង (100% Match)</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                    ដូចរូបភាព ១០០%
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  QR នៅខាងលើស្ដាំ • ព័ត៌មានអក្សរខៀវ • រូបថតនៅបាតឆ្វេង • ហត្ថលេខានៅបាតស្ដាំ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleApplyPreset('kamrieng-official')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 ${
                template.presetId === 'kamrieng-official'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 hover:border-amber-400 shadow-2xs'
              }`}
            >
              {template.presetId === 'kamrieng-official' ? '✓ កំពុងប្រើប្រាស់' : 'អនុវត្តគំរូនេះ (1-Click)'}
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="bg-white border border-neutral-200 rounded-xl p-1 shadow-xs flex flex-wrap gap-1 text-xs">
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'layers'
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-300" />
              <span>គ្រប់គ្រង Layer</span>
            </button>

            <button
              onClick={() => setActiveTab('positioning')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'positioning'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Move className="w-3.5 h-3.5 text-amber-300" />
              <span>រំកិល & ពង្រីកបង្រួម</span>
            </button>

            <button
              onClick={() => setActiveTab('title')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'title'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-amber-500" />
              <span>«ប័ណ្ណសម្គាល់ខ្លួន»</span>
            </button>

            <button
              onClick={() => setActiveTab('dimensions')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'dimensions'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>ទំហំកាត & ប្លង់</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>គំរូស្រេច (Presets)</span>
            </button>

            <button
              onClick={() => setActiveTab('style')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'style'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>ពណ៌ & ស៊ុម</span>
            </button>

            <button
              onClick={() => setActiveTab('header')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ក្បាលប័ណ្ណ</span>
            </button>

            <button
              onClick={() => setActiveTab('fields')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'fields'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>ព័ត៌មានសិស្ស</span>
            </button>

            <button
              onClick={() => setActiveTab('photo')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'photo'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>រូបថត & QR</span>
            </button>

            <button
              onClick={() => setActiveTab('footer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'footer'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>ត្រា & ហត្ថលេខា</span>
            </button>

            <button
              onClick={() => setActiveTab('backside')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'backside'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>ខ្នងប័ណ្ណ</span>
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">

            {/* ======================================================== */}
            {/* TAB: POSITIONING & SCALING (រំកិល & ពង្រីកបង្រួម) */}
            {/* ======================================================== */}
            {activeTab === 'positioning' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Move className="w-4 h-4 text-blue-600" />
                      រំកិលទីតាំង និងពង្រីកបង្រួមធាតុនីមួយៗ (Interactive Move & Scale)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      ជ្រើសរើសធាតុណាមួយ រួចចុចប៊ូតុងព្រួញរំកិល ឬអូសរបារទំហំខាងក្រោម (ឬចុចផ្ទាល់លើកាតនៅខាងស្តាំ)
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                    Live Nudge Pad
                  </span>
                </div>

                {/* Element Picker Pills */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">
                    ជ្រើសរើសធាតុដែលត្រូវកែសម្រួល (Select Element to Move/Scale)៖
                  </label>

                  {/* Category 1: Header Words & Titles */}
                  <div className="mb-2.5">
                    <span className="block text-[11px] font-bold text-blue-900 mb-1">
                      🏛️ ផ្នែកក្បាលប័ណ្ណ & ចំណងជើង (Header Words & Title)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedElement('headerKingdom')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'headerKingdom'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ព្រះរាជាណាចក្រកម្ពុជា"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">👑 ព្រះរាជាណាចក្រកម្ពុជា</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('headerMotto')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'headerMotto'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ជាតិ សាសនា ព្រះមហាក្សត្រ"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">🇰🇭 ជាតិ សាសនា...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('headerMinistry')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'headerMinistry'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ក្រសួងអប់រំ យុវជន និងកីឡា"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">🏢 ក្រសួងអប់រំ...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('headerDepartment')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'headerDepartment'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="មន្ទីរអប់រំ យុវជន និងកីឡា..."
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="truncate">🏬 មន្ទីរអប់រំ...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('headerSchoolName')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'headerSchoolName'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ឈ្មោះវិទ្យាល័យ / សាលា"
                      >
                        <Type className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="truncate">🏫 ឈ្មោះវិទ្យាល័យ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('title')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'title'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ប័ណ្ណសម្គាល់ខ្លួនសិស្ស"
                      >
                        <Type className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">🏷️ «ប័ណ្ណសម្គាល់ខ្លួន»</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('subtitle')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'subtitle'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ឆ្នាំសិក្សា ២០២៥-២០២៧ (ចំណងជើងរង)"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">📅 ឆ្នាំសិក្សា (Year)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('logo')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'logo'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ផ្លាកសញ្ញា Logo"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="truncate">👑 ផ្លាកសញ្ញា Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('header')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'header'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                        title="ក្បាលប័ណ្ណទាំងមូល (Header Block)"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="truncate">🏛️ ក្បាលប័ណ្ណទាំងមូល</span>
                      </button>
                    </div>
                  </div>

                  {/* Category 2: Body & Footer Elements */}
                  <div>
                    <span className="block text-[11px] font-bold text-neutral-700 mb-1">
                      👤 ផ្នែកតួ & បាតប័ណ្ណ (Body & Footer Elements)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedElement('photo')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'photo'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>👤 រូបថត 3x4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('info')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'info'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>📝 ព័ត៌មាន Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('qr')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'qr'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>📱 កូដ QR Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('stamp')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'stamp'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>🔴 ត្រាក្រហម Stamp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('signature')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'signature'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>✍️ ហត្ថលេខា Signature</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('date')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'date'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📅 ថ្ងៃខែ (Date)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('principalTitle')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'principalTitle'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>🎓 នាយកវិទ្យាល័យ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedElement('principalName')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all ${
                          selectedElement === 'principalName'
                            ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>👨‍💼 ឈ្មោះនាយក</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4-Way Direction Nudge Pad */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-neutral-800">
                        ឧបករណ៍រំកិលទិសដៅ ៤ ទិស (4-Way Direction Nudge)
                      </span>
                    </div>

                    {/* Step size selector */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-neutral-500 text-[11px] mr-1">ជំហានរំកិល៖</span>
                      {[1, 2, 5, 10].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setNudgeStep(step)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                            nudgeStep === step
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {step}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Directional Pad Center */}
                  <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                    {/* UP */}
                    <button
                      type="button"
                      onClick={() => handleNudge(0, -nudgeStep)}
                      title="រំកិលឡើងលើ"
                      className="w-12 h-10 bg-white border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 rounded-lg shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>

                    {/* LEFT - RESET - RIGHT */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleNudge(-nudgeStep, 0)}
                        title="រំកិលទៅឆ្វេង"
                        className="w-12 h-10 bg-white border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 rounded-lg shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleResetElement}
                        title="កំណត់ទីតាំងដើមឡើងវិញ"
                        className="px-3 h-10 bg-white border border-neutral-300 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 rounded-lg shadow-xs flex items-center gap-1 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                        <span>កំណត់ដើម (0,0)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNudge(nudgeStep, 0)}
                        title="រំកិលទៅស្តាំ"
                        className="w-12 h-10 bg-white border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 rounded-lg shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* DOWN */}
                    <button
                      type="button"
                      onClick={() => handleNudge(0, nudgeStep)}
                      title="រំកិលចុះក្រោម"
                      className="w-12 h-10 bg-white border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 rounded-lg shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Current Coordinates readout */}
                  <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      ធាតុសកម្ម៖{' '}
                      <strong className="text-neutral-800 uppercase">{selectedElement}</strong>
                    </span>
                    <div className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded border border-neutral-200">
                      <span>
                        X Offset:{' '}
                        <strong>
                          {selectedElement === 'logo'
                            ? template.logoOffsetX || 0
                            : selectedElement === 'headerKingdom'
                            ? template.headerKingdomOffsetX || 0
                            : selectedElement === 'headerMotto'
                            ? template.headerMottoOffsetX || 0
                            : selectedElement === 'headerMinistry'
                            ? template.headerMinistryOffsetX || 0
                            : selectedElement === 'headerDepartment'
                            ? template.headerDepartmentOffsetX || 0
                            : selectedElement === 'headerSchoolName'
                            ? template.headerSchoolNameOffsetX || 0
                            : selectedElement === 'title'
                            ? template.titleOffsetX || 0
                            : selectedElement === 'subtitle'
                            ? template.subtitleOffsetX || 0
                            : selectedElement === 'photo'
                            ? template.photoOffsetX || 0
                            : selectedElement === 'info'
                            ? template.infoOffsetX || 0
                            : selectedElement === 'stamp'
                            ? template.stampOffsetX || 0
                            : selectedElement === 'signature'
                            ? template.signatureOffsetX || 0
                            : selectedElement === 'qr'
                            ? template.qrOffsetX || 0
                            : selectedElement === 'date'
                            ? template.dateOffsetX || 0
                            : selectedElement === 'principalTitle'
                            ? template.principalTitleOffsetX || 0
                            : selectedElement === 'principalName'
                            ? template.principalNameOffsetX || 0
                            : 0}
                          px
                        </strong>
                      </span>
                      <span className="mx-2">|</span>
                      <span>
                        Y Offset:{' '}
                        <strong>
                          {selectedElement === 'logo'
                            ? template.logoOffsetY || 0
                            : selectedElement === 'header'
                            ? template.headerOffsetY || 0
                            : selectedElement === 'headerKingdom'
                            ? template.headerKingdomOffsetY || 0
                            : selectedElement === 'headerMotto'
                            ? template.headerMottoOffsetY || 0
                            : selectedElement === 'headerMinistry'
                            ? template.headerMinistryOffsetY || 0
                            : selectedElement === 'headerDepartment'
                            ? template.headerDepartmentOffsetY || 0
                            : selectedElement === 'headerSchoolName'
                            ? template.headerSchoolNameOffsetY || 0
                            : selectedElement === 'title'
                            ? template.titleOffsetY || 0
                            : selectedElement === 'subtitle'
                            ? template.subtitleOffsetY || 0
                            : selectedElement === 'photo'
                            ? template.photoOffsetY || 0
                            : selectedElement === 'info'
                            ? template.infoOffsetY || 0
                            : selectedElement === 'stamp'
                            ? template.stampOffsetY || 0
                            : selectedElement === 'signature'
                            ? template.signatureOffsetY || 0
                            : selectedElement === 'qr'
                            ? template.qrOffsetY || 0
                            : selectedElement === 'date'
                            ? template.dateOffsetY || 0
                            : selectedElement === 'principalTitle'
                            ? template.principalTitleOffsetY || 0
                            : selectedElement === 'principalName'
                            ? template.principalNameOffsetY || 0
                            : 0}
                          px
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sliders for Selected Element */}
                <div className="space-y-4 pt-1">
                  {/* PHOTO CONTROLS */}
                  {selectedElement === 'photo' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        កំណត់រូបថត 3x4 (Photo Sizing & Position)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Photo Width */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទទឹងរូបថត (Width):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {((template.photoWidthMm || 23) / 10).toFixed(1)} cm ({template.photoWidthMm || 23} mm)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="16"
                            max="36"
                            step="1"
                            value={template.photoWidthMm || 23}
                            onChange={(e) =>
                              handleUpdate({ photoWidthMm: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Photo Height */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">កម្ពស់រូបថត (Height):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {((template.photoHeightMm || 31) / 10).toFixed(1)} cm ({template.photoHeightMm || 31} mm)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="22"
                            max="48"
                            step="1"
                            value={template.photoHeightMm || 31}
                            onChange={(e) =>
                              handleUpdate({ photoHeightMm: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Photo Zoom */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ពង្រីក/បង្រួមរូប (Zoom):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {Math.round((template.photoZoom || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.4"
                            max="3.5"
                            step="0.05"
                            value={template.photoZoom || 1}
                            onChange={(e) =>
                              handleUpdate({ photoZoom: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Photo Shape */}
                        <div>
                          <span className="block font-medium text-neutral-700 mb-1">
                            រាងកញ្ចក់រូបថត (Shape):
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 'rectangle', label: '3x4 កែង' },
                              { id: 'rounded', label: 'ជ្រុងមូល' },
                              { id: 'oval', label: 'រាងពងក្រពើ' },
                            ].map((shape) => (
                              <button
                                key={shape.id}
                                type="button"
                                onClick={() =>
                                  handleUpdate({ photoShape: shape.id as any })
                                }
                                className={`py-1 text-[11px] rounded border font-medium transition-colors ${
                                  template.photoShape === shape.id
                                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                                }`}
                              >
                                {shape.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INFO CONTROLS */}
                  {selectedElement === 'info' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-blue-600" />
                        កំណត់អក្សរព័ត៌មានសិស្ស (Student Info Typography & Sizing)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        {/* Font Size with Enlarge/Shrink Controls */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរ (Font Size):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdate({ infoFontSize: Math.max(6.5, Number(((template.infoFontSize || 10) - 0.5).toFixed(1))) })}
                                className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-[10px] font-bold text-neutral-700"
                                title="បន្ថយទំហំអក្សរ"
                              >
                                A-
                              </button>
                              <span className="font-mono font-bold text-blue-600 min-w-[36px] text-center">
                                {template.infoFontSize || 10} px
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdate({ infoFontSize: Math.min(18.0, Number(((template.infoFontSize || 10) + 0.5).toFixed(1))) })}
                                className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-[10px] font-bold text-neutral-700"
                                title="ពង្រីកទំហំអក្សរ"
                              >
                                A+
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="7.0"
                            max="16.0"
                            step="0.2"
                            value={template.infoFontSize || 10}
                            onChange={(e) =>
                              handleUpdate({ infoFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {[8.5, 9.5, 10.5, 11.5, 13.0].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => handleUpdate({ infoFontSize: size })}
                                className={`px-1.5 py-0.5 text-[9.5px] rounded border transition-colors ${
                                  (template.infoFontSize || 10) === size
                                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                {size}px
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Full Card Auto-fit & Row Gap */}
                        <div className="sm:col-span-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-blue-900 block">ពង្រីកព័ត៌មានឱ្យពេញកាត (Full Card Auto-fit)</span>
                            <span className="text-[10px] text-neutral-500">ពង្រីកអក្សរ និងចន្លោះគម្លាតជួរឱ្យសមល្មមពេញផ្ទៃកាត</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (template.expandInfoToFullCard) {
                                handleUpdate({
                                  expandInfoToFullCard: false,
                                  infoFontSize: 10,
                                  infoGapY: 3.2,
                                  infoScale: 1.0,
                                });
                              } else {
                                handleUpdate({
                                  expandInfoToFullCard: true,
                                  infoFontSize: 11.5,
                                  infoGapY: 4.8,
                                  infoScale: 1.05,
                                });
                              }
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded border cursor-pointer ${
                              template.expandInfoToFullCard
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            {template.expandInfoToFullCard ? '✓ បានពង្រីកពេញ' : 'ពង្រីកពេញកាត'}
                          </button>
                        </div>

                        {/* Row Gap */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">គម្លាតចន្លោះជួរ (Row Gap):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.infoGapY ?? 3.2} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="8.0"
                            step="0.5"
                            value={template.infoGapY ?? 3.2}
                            onChange={(e) =>
                              handleUpdate({ infoGapY: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Overall Zoom / Scale */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ពង្រីកសរុប (Overall Zoom):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {Math.round((template.infoScale || 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="2.0"
                            step="0.05"
                            value={template.infoScale || 1.0}
                            onChange={(e) =>
                              handleUpdate({ infoScale: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Line Spacing */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">គម្លាតជួរ (Line Height):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.infoLineSpacing || 1.35}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={template.infoLineSpacing || 1.35}
                            onChange={(e) =>
                              handleUpdate({ infoLineSpacing: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Label Column Width */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទទឹងស្លាក (Label Width):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.infoLabelWidth || 27} mm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="36"
                            step="1"
                            value={template.infoLabelWidth || 27}
                            onChange={(e) =>
                              handleUpdate({ infoLabelWidth: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* POB Quick Switch in Inspector */}
                        <div className="sm:col-span-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-neutral-800 block">ទីកន្លែងកំណើត (POB)៖</span>
                            <span className="text-[10px] text-neutral-500">
                              {template.pobPlacement !== 'inline' ? 'លាតសន្ធឹងពេញទទឹងកាត (តែមួយជួរ)' : 'ក្នុងជួរព័ត៌មានក្បែររូបថត'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdate({
                                pobPlacement: template.pobPlacement === 'inline' ? 'full-width' : 'inline',
                                pobSingleLine: true,
                              });
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                          >
                            {template.pobPlacement !== 'inline' ? 'ប្ដូរទៅក្បែររូបវិញ' : '↔️ លាតពេញទទឹងកាត'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOGO CONTROLS */}
                  {selectedElement === 'logo' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        កំណត់ផ្លាកសញ្ញា / និមិត្តសញ្ញា (Logo Size & Positioning)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Logo Scale */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំពង្រីក Logo (Scale):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {Math.round((template.logoScale || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.3"
                            max="3.0"
                            step="0.05"
                            value={template.logoScale || 1}
                            onChange={(e) =>
                              handleUpdate({ logoScale: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Logo Position */}
                        <div>
                          <span className="block font-medium text-neutral-700 mb-1">
                            ទីតាំង Logo:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate({ logoPosition: 'left' })}
                              className={`py-1 text-xs rounded border font-medium ${
                                template.logoPosition === 'left'
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              ខាងឆ្វេង (Left)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ logoPosition: 'center' })}
                              className={`py-1 text-xs rounded border font-medium ${
                                template.logoPosition === 'center'
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              កណ្តាល (Center)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HEADER CONTROLS */}
                  {selectedElement === 'header' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        កំណត់ក្បាលប័ណ្ណ (Header Sizing & Offsets)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Header Scale */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ពង្រីកក្បាលប័ណ្ណ (Scale):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {Math.round((template.headerScale || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.5"
                            step="0.05"
                            value={template.headerScale || 1}
                            onChange={(e) =>
                              handleUpdate({ headerScale: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Header Y Offset */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិលលើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.headerOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={template.headerOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TITLE BANNER & TEXT («ប័ណ្ណសម្គាល់ខ្លួនសិស្ស») CONTROLS */}
                  {selectedElement === 'title' && (
                    <div className="space-y-4 bg-amber-50/40 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Type className="w-4 h-4 text-amber-600" />
                          <span>កំណត់អក្សរ និងផ្ទៃពណ៌ «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស»</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('title')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            បើកផ្ទាំងពេញ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate({
                                titleOffsetX: 0,
                                titleOffsetY: 0,
                                titleFontSize: 10,
                                showTitleBannerBg: true,
                              })
                            }
                            className="text-[11px] text-amber-800 hover:text-amber-950 bg-white border border-amber-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      {/* Background Banner Toggle & Color */}
                      <div className="bg-white p-3 rounded-lg border border-amber-200/70 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-800">
                            ផ្ទៃពណ៌ខៀវខាងក្រោយ (Banner Background)៖
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={template.showTitleBannerBg !== false}
                              onChange={(e) =>
                                handleUpdate({ showTitleBannerBg: e.target.checked })
                              }
                              className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                            />
                            <span className="font-semibold text-neutral-700">
                              {template.showTitleBannerBg !== false ? 'បង្ហាញផ្ទៃពណ៌' : 'លាក់ផ្ទៃពណ៌ (Transparent)'}
                            </span>
                          </label>
                        </div>

                        {template.showTitleBannerBg !== false && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                                ពណ៌ផ្ទៃគោល (Start Color)៖
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={template.titleBannerBgColor || template.headerBgColorStart || '#075985'}
                                  onChange={(e) =>
                                    handleUpdate({ titleBannerBgColor: e.target.value })
                                  }
                                  className="w-8 h-8 rounded border border-neutral-300 cursor-pointer"
                                />
                                <span className="font-mono text-[11px] text-neutral-700">
                                  {template.titleBannerBgColor || template.headerBgColorStart || '#075985'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                                ពណ៌ផ្ទៃបន្ទាប់ (End Color)៖
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={template.titleBannerBgColorEnd || template.headerBgColorEnd || '#1e3a8a'}
                                  onChange={(e) =>
                                    handleUpdate({ titleBannerBgColorEnd: e.target.value })
                                  }
                                  className="w-8 h-8 rounded border border-neutral-300 cursor-pointer"
                                />
                                <span className="font-mono text-[11px] text-neutral-700">
                                  {template.titleBannerBgColorEnd || template.headerBgColorEnd || '#1e3a8a'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Font Size & Text Color */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-200/70 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-neutral-800">ទំហំអក្សរ (Font Size)៖</span>
                            <span className="font-mono font-bold text-amber-700">
                              {(template.titleFontSize || 10).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="6"
                            max="22"
                            step="0.5"
                            value={template.titleFontSize || 10}
                            onChange={(e) =>
                              handleUpdate({ titleFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-neutral-800 mb-1">
                            ពណ៌អក្សរ (Text Color)៖
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={template.titleBannerTextColor || template.headerTextColor || (template.showTitleBannerBg === false ? '#075985' : '#fef08a')}
                              onChange={(e) =>
                                handleUpdate({ titleBannerTextColor: e.target.value })
                              }
                              className="w-8 h-8 rounded border border-neutral-300 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-neutral-700">
                              {template.titleBannerTextColor || template.headerTextColor || (template.showTitleBannerBg === false ? '#075985' : '#fef08a')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sliders X and Y */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-200/70 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-neutral-800">រំកិលឆ្វេង-ស្តាំ (Offset X)៖</span>
                            <span className="font-mono font-bold text-amber-700">
                              {template.titleOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.titleOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ titleOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-neutral-800">រំកិលលើ-ក្រោម (Offset Y)៖</span>
                            <span className="font-mono font-bold text-amber-700">
                              {template.titleOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={template.titleOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ titleOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTITLE / ACADEMIC YEAR CONTROLS */}
                  {selectedElement === 'subtitle' && (
                    <div className="space-y-4 bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>កំណត់ពាក្យ «ឆ្នាំសិក្សា ២០២៥-២០២៧» (Academic Year / Subtitle)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('title')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងចំណងជើង ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('subtitle')}
                            className="text-[11px] text-blue-800 hover:text-blue-950 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      {/* Text edit for year */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          ខ្លឹមសារអក្សរឆ្នាំសិក្សា (Academic Year Text)៖
                        </label>
                        <input
                          type="text"
                          value={template.headerSubtitleKhmer}
                          onChange={(e) => handleUpdate({ headerSubtitleKhmer: e.target.value })}
                          placeholder={school.academic_year || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
                          className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-1.5 bg-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {/* Subtitle Font Size */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរ (Font Size):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {(template.subtitleFontSize || 7.6).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="14"
                            step="0.2"
                            value={template.subtitleFontSize || 7.6}
                            onChange={(e) =>
                              handleUpdate({ subtitleFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Subtitle X Offset */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.subtitleOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.subtitleOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ subtitleOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Subtitle Y Offset */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.subtitleOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.subtitleOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ subtitleOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KINGDOM TITLE CONTROLS */}
                  {selectedElement === 'headerKingdom' && (
                    <div className="space-y-4 bg-sky-50/50 border border-sky-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-600" />
                          <span>កំណត់ពាក្យ «ព្រះរាជាណាចក្រកម្ពុជា» (Kingdom Title)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងក្បាលប័ណ្ណ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('headerKingdom')}
                            className="text-[11px] text-sky-800 hover:text-sky-950 bg-white border border-sky-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-sky-600">
                              {template.headerKingdomOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerKingdomOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ headerKingdomOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-sky-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-sky-600">
                              {template.headerKingdomOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.headerKingdomOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerKingdomOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-sky-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរ (Font Size):</span>
                            <span className="font-mono font-bold text-sky-600">
                              {(template.headerKingdomFontSize || 8.8).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.0"
                            max="22.0"
                            step="0.2"
                            value={template.headerKingdomFontSize || 8.8}
                            onChange={(e) =>
                              handleUpdate({ headerKingdomFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-sky-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">អត្ថបទ (កែប្រែលើកាត)៖</span>
                          </div>
                          <input
                            type="text"
                            value={template.headerKingdomKhmer ?? ''}
                            onChange={(e) => handleUpdate({ headerKingdomKhmer: e.target.value })}
                            placeholder="ព្រះរាជាណាចក្រកម្ពុជា"
                            className="w-full text-xs px-2.5 py-1.5 border border-sky-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOTTO CONTROLS */}
                  {selectedElement === 'headerMotto' && (
                    <div className="space-y-4 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>កំណត់ពាក្យ «ជាតិ សាសនា ព្រះមហាក្សត្រ» (Royal Motto)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងក្បាលប័ណ្ណ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('headerMotto')}
                            className="text-[11px] text-amber-800 hover:text-amber-950 bg-white border border-amber-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-amber-600">
                              {template.headerMottoOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerMottoOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ headerMottoOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-amber-600">
                              {template.headerMottoOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.headerMottoOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerMottoOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរ (Font Size):</span>
                            <span className="font-mono font-bold text-amber-600">
                              {(template.headerMottoFontSize || 7.6).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="4.5"
                            max="20.0"
                            step="0.2"
                            value={template.headerMottoFontSize || 7.6}
                            onChange={(e) =>
                              handleUpdate({ headerMottoFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">អត្ថបទ (កែប្រែលើកាត)៖</span>
                          </div>
                          <input
                            type="text"
                            value={template.headerMottoKhmer ?? ''}
                            onChange={(e) => handleUpdate({ headerMottoKhmer: e.target.value })}
                            placeholder="ជាតិ សាសនា ព្រះមហាក្សត្រ"
                            className="w-full text-xs px-2.5 py-1.5 border border-amber-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MINISTRY CONTROLS */}
                  {selectedElement === 'headerMinistry' && (
                    <div className="space-y-4 bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>កំណត់ពាក្យ «ក្រសួងអប់រំ យុវជន និងកីឡា» (Ministry Line)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងក្បាលប័ណ្ណ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('headerMinistry')}
                            className="text-[11px] text-blue-800 hover:text-blue-950 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.headerMinistryOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerMinistryOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ headerMinistryOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.headerMinistryOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.headerMinistryOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerMinistryOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរក្រសួង (Font Size):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {(template.headerMinistryFontSize || 7.5).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.0"
                            max="20.0"
                            step="0.2"
                            value={template.headerMinistryFontSize || 7.5}
                            onChange={(e) =>
                              handleUpdate({ headerMinistryFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">អត្ថបទក្រសួង (កែប្រែលើកាត)៖</span>
                          </div>
                          <input
                            type="text"
                            value={template.headerMinistryKhmer ?? ''}
                            onChange={(e) => handleUpdate({ headerMinistryKhmer: e.target.value })}
                            placeholder={school.ministry_name || 'ក្រសួងអប់រំ យុវជន និងកីឡា'}
                            className="w-full text-xs px-2.5 py-1.5 border border-blue-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DEPARTMENT CONTROLS */}
                  {selectedElement === 'headerDepartment' && (
                    <div className="space-y-4 bg-indigo-50/50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>កំណត់ពាក្យ «មន្ទីរអប់រំ យុវជន និងកីឡា...» (Department Line)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងក្បាលប័ណ្ណ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('headerDepartment')}
                            className="text-[11px] text-indigo-800 hover:text-indigo-950 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-indigo-600">
                              {template.headerDepartmentOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            step="1"
                            value={template.headerDepartmentOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ headerDepartmentOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-indigo-600">
                              {template.headerDepartmentOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.headerDepartmentOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerDepartmentOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរមន្ទីរ (Font Size):</span>
                            <span className="font-mono font-bold text-indigo-600">
                              {(template.headerDepartmentFontSize || 7.0).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.0"
                            max="14.0"
                            step="0.2"
                            value={template.headerDepartmentFontSize || 7.0}
                            onChange={(e) =>
                              handleUpdate({ headerDepartmentFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">អត្ថបទមន្ទីរ (កែប្រែលើកាត)៖</span>
                          </div>
                          <input
                            type="text"
                            value={template.headerDepartmentKhmer ?? ''}
                            onChange={(e) => handleUpdate({ headerDepartmentKhmer: e.target.value })}
                            placeholder={school.department_name || 'មន្ទីរអប់រំ យុវជន និងកីឡា...'}
                            className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                        <span>✓</span>
                        <span>ពាក្យ «មន្ទីរអប់រំ យុវជន និងកីឡា» ត្រូវបានកំណត់ឱ្យបង្ហាញតែ ១ បន្ទាត់ជានិច្ច (Single line nowrap មិនបាក់ជួរ)</span>
                      </div>
                    </div>
                  )}

                  {/* SCHOOL NAME CONTROLS */}
                  {selectedElement === 'headerSchoolName' && (
                    <div className="space-y-4 bg-purple-50/50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Type className="w-4 h-4 text-purple-600" />
                          <span>កំណត់ «ឈ្មោះវិទ្យាល័យ / សាលា» (School Name Line)</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-xs cursor-pointer font-medium"
                          >
                            ផ្ទាំងក្បាលប័ណ្ណ ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('headerSchoolName')}
                            className="text-[11px] text-purple-800 hover:text-purple-950 bg-white border border-purple-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                          >
                            ↺ កំណត់ដើម
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល ឆ្វេង-ស្តាំ (X Offset):</span>
                            <span className="font-mono font-bold text-purple-600">
                              {template.headerSchoolNameOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerSchoolNameOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ headerSchoolNameOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិល លើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-purple-600">
                              {template.headerSchoolNameOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={template.headerSchoolNameOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ headerSchoolNameOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំអក្សរឈ្មោះសាលា (Font Size):</span>
                            <span className="font-mono font-bold text-purple-600">
                              {(template.headerSchoolNameFontSize || 8.5).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.5"
                            max="24.0"
                            step="0.2"
                            value={template.headerSchoolNameFontSize || 8.5}
                            onChange={(e) =>
                              handleUpdate({ headerSchoolNameFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ឈ្មោះសាលា (កែប្រែលើកាត)៖</span>
                          </div>
                          <input
                            type="text"
                            value={template.headerSchoolNameKhmer ?? ''}
                            onChange={(e) => handleUpdate({ headerSchoolNameKhmer: e.target.value })}
                            placeholder={school.school_name || 'វិទ្យាល័យ...'}
                            className="w-full text-xs px-2.5 py-1.5 border border-purple-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAMP CONTROLS */}
                  {selectedElement === 'stamp' && (
                    <div className="space-y-4 bg-white border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-rose-600" />
                          កំណត់ត្រាក្រហមរដ្ឋបាល (Official Stamp Sizing & Angle)
                        </h4>
                        <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                          គាំទ្រទំហំធំរហូតដល់ 180px
                        </span>
                      </div>

                      {/* Stamp Visibility Toggle Button Group */}
                      <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-lg space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950 flex items-center gap-1.5">
                            <span>🔘 ស្ថានភាពត្រា (បង្ហាញត្រាក៏បាន អត់បង្ហាញក៏បាន)៖</span>
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            template.showStamp !== false
                              ? 'bg-rose-600 text-white'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {template.showStamp !== false ? 'កំពុងបង្ហាញ' : 'កំពុងលាក់'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate({ showStamp: true })}
                            className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              template.showStamp !== false
                                ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                                : 'bg-white border-rose-200 text-neutral-700 hover:bg-rose-100/60'
                            }`}
                          >
                            <span>🔴</span>
                            <span>បង្ហាញត្រា (Show Stamp)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate({ showStamp: false })}
                            className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              template.showStamp === false
                                ? 'bg-neutral-800 text-white border-neutral-800 font-bold shadow-xs'
                                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            <span>⚪</span>
                            <span>អត់បង្ហាញត្រា (Hide Stamp)</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          * ជ្រើសរើស <strong>«បង្ហាញត្រា»</strong> ប្រសិនបើចង់បោះពុម្ពមានត្រាក្រហមស្វ័យប្រវត្ត ឬ <strong>«អត់បង្ហាញត្រា»</strong> ប្រសិនបើសាលាចង់វាយត្រាមេដៃ ឬត្រាខាផ្ទាល់លើកាត។
                        </p>
                      </div>

                      {/* Stamp Placement Mode & Layer Ordering */}
                      <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-lg space-y-2.5 text-xs">
                        <span className="font-bold text-rose-950 block">
                          📍 ទីតាំងបោះត្រា និងកម្រិត Layer (Placement & Layer Stacking)៖
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate({
                                stampPositionMode: 'photo-corner',
                                stampZIndex: 30,
                                photoZIndex: 20,
                              })
                            }
                            className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                              template.stampPositionMode === 'photo-corner' && (template.stampZIndex || 25) >= (template.photoZIndex || 20)
                                ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                                : 'bg-white border-rose-200 text-neutral-800 hover:bg-rose-100/50'
                            }`}
                          >
                            <span className="block font-semibold">🔴 បោះត្រាលើរូបថត (Stamp on Top)</span>
                            <span className="text-[10px] opacity-80 block">ត្រានៅពីលើរូបថត (Z-Index: 30)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate({
                                stampPositionMode: 'photo-corner',
                                photoZIndex: 30,
                                stampZIndex: 20,
                              })
                            }
                            className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                              template.stampPositionMode === 'photo-corner' && (template.photoZIndex || 20) > (template.stampZIndex || 25)
                                ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                : 'bg-white border-purple-200 text-neutral-800 hover:bg-purple-100/50'
                            }`}
                          >
                            <span className="block font-semibold">👤 ដាក់រូបថតនៅពីមុខត្រា (Photo in Front)</span>
                            <span className="text-[10px] opacity-80 block">រូបថតនៅពីមុខត្រា (Z-Index: 30)</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-neutral-600">ឬដាក់ត្រានៅបាតកាតធម្មតា៖</span>
                          <button
                            type="button"
                            onClick={() => handleUpdate({ stampPositionMode: 'footer' })}
                            className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                              template.stampPositionMode !== 'photo-corner'
                                ? 'bg-neutral-800 text-white border-neutral-800 font-bold'
                                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            ✍️ នៅបាតកាតជិតហត្ថលេខា (Footer)
                          </button>
                        </div>
                      </div>

                      {/* Quick Stamp Size Presets */}
                      <div>
                        <span className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
                          ទំហំត្រារហ័ស (Quick Stamp Size Presets)៖
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'តូច 50px', size: 50 },
                            { label: 'ស្តង់ដារ 70px', size: 70 },
                            { label: 'មធ្យម 95px', size: 95 },
                            { label: 'ធំ 120px', size: 120 },
                            { label: 'ធំផ្លូវការ 150px', size: 150 },
                            { label: 'ធំខ្លាំង 190px', size: 190 },
                            { label: 'ធំបំផុត 240px', size: 240 },
                            { label: 'យក្ស 300px', size: 300 },
                          ].map((item) => (
                            <button
                              key={item.size}
                              type="button"
                              onClick={() => handleUpdate({ stampSize: item.size })}
                              className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all ${
                                (template.stampSize || 52) === item.size
                                  ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        {/* Stamp Size */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">ទំហំត្រា (Size):</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="20"
                                max="350"
                                value={template.stampSize || 52}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) handleUpdate({ stampSize: Math.max(20, Math.min(350, val)) });
                                }}
                                className="w-14 text-right font-mono font-bold text-rose-600 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="300"
                            step="2"
                            value={template.stampSize || 52}
                            onChange={(e) =>
                              handleUpdate({ stampSize: parseInt(e.target.value) })
                            }
                            className="w-full accent-rose-600"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>30px</span>
                            <span>165px</span>
                            <span>300px</span>
                          </div>
                        </div>

                        {/* Stamp Rotation */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">មុំបង្វិល (Rotation):</span>
                            <span className="font-mono font-bold text-rose-600">
                              {template.stampRotation || -6}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-45"
                            max="45"
                            step="1"
                            value={template.stampRotation || -6}
                            onChange={(e) =>
                              handleUpdate({ stampRotation: parseInt(e.target.value) })
                            }
                            className="w-full accent-rose-600"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>-45°</span>
                            <span>0°</span>
                            <span>+45°</span>
                          </div>
                        </div>

                        {/* Stamp Opacity */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">កម្រិតដិតច្បាស់ (Opacity):</span>
                            <span className="font-mono font-bold text-rose-600">
                              {Math.round((template.stampOpacity ?? 0.88) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="1.0"
                            step="0.05"
                            value={template.stampOpacity ?? 0.88}
                            onChange={(e) =>
                              handleUpdate({ stampOpacity: parseFloat(e.target.value) })
                            }
                            className="w-full accent-rose-600"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>20%</span>
                            <span>60%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Wide Offset Range for Large Stamp */}
                      <div className="pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">រំកិលឆ្វេង-ស្តាំ (Offset X):</span>
                            <span className="font-mono font-bold text-rose-600">
                              {template.stampOffsetX || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            step="2"
                            value={template.stampOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ stampOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-rose-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-neutral-700">រំកិលលើ-ក្រោម (Offset Y):</span>
                            <span className="font-mono font-bold text-rose-600">
                              {template.stampOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            step="2"
                            value={template.stampOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ stampOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SIGNATURE CONTROLS */}
                  {selectedElement === 'signature' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-blue-600" />
                        កំណត់ហត្ថលេខា (Director Signature Sizing & Scale)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Signature Scale */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ពង្រីកហត្ថលេខា (Scale):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {Math.round((template.signatureScale || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.8"
                            step="0.05"
                            value={template.signatureScale || 1}
                            onChange={(e) =>
                              handleUpdate({ signatureScale: parseFloat(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Signature Y Offset */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">រំកិលលើ-ក្រោម (Y Offset):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.signatureOffsetY || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={template.signatureOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ signatureOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR CONTROLS */}
                  {selectedElement === 'qr' && (
                    <div className="space-y-3.5 bg-white border border-neutral-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        កំណត់កូដ QR (QR Code Sizing & Positioning)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* QR Size */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-neutral-700">ទំហំកូដ QR (Size):</span>
                            <span className="font-mono font-bold text-blue-600">
                              {template.qrSize || 46} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="28"
                            max="64"
                            step="2"
                            value={template.qrSize || 46}
                            onChange={(e) =>
                              handleUpdate({ qrSize: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* QR Position */}
                        <div>
                          <span className="block font-medium text-neutral-700 mb-1">
                            ទីតាំងកូដ QR:
                          </span>
                          <select
                            value={template.qrPosition}
                            onChange={(e) =>
                              handleUpdate({ qrPosition: e.target.value as any })
                            }
                            className="w-full border border-neutral-300 rounded px-2.5 py-1.5 bg-white text-xs"
                          >
                            <option value="below-photo">ក្រោមកញ្ចក់រូបថត 3x4 (ស្តង់ដារ)</option>
                            <option value="bottom-left">ជ្រុងឆ្វេងក្រោម</option>
                            <option value="backside-only">ខ្នងក្រោយកាត</option>
                            <option value="hidden">លាក់កូដ QR</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DATE CONTROLS */}
                  {selectedElement === 'date' && (
                    <div className="space-y-4 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                        <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>កំណត់ទីតាំង និងទំហំអក្សរ ថ្ងៃខែ (Date Positioning & Font Size)</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleUpdate({ dateOffsetX: 0, dateOffsetY: 0, dateFontSize: 6.4 })}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-xs"
                        >
                          កំណត់ដើម (Reset)
                        </button>
                      </div>

                      {/* Offset Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* X Offset */}
                        <div className="bg-white p-3 rounded-lg border border-emerald-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឆ្វេង-ស្តាំ (Offset X)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-80"
                                max="80"
                                value={template.dateOffsetX || 0}
                                onChange={(e) =>
                                  handleUpdate({ dateOffsetX: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-emerald-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.dateOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ dateOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        {/* Y Offset */}
                        <div className="bg-white p-3 rounded-lg border border-emerald-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឡើង-ចុះ (Offset Y)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-50"
                                max="50"
                                value={template.dateOffsetY || 0}
                                onChange={(e) =>
                                  handleUpdate({ dateOffsetY: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-emerald-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.dateOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ dateOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Font Size & Quick Presets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-white p-3 rounded-lg border border-emerald-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">ទំហំអក្សរថ្ងៃខែ (Font Size)៖</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {(template.dateFontSize || 6.4).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="4.5"
                            max="10"
                            step="0.2"
                            value={template.dateFontSize || 6.4}
                            onChange={(e) =>
                              handleUpdate({ dateFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        {/* Quick Align Presets */}
                        <div className="bg-white p-3 rounded-lg border border-emerald-200/70">
                          <span className="block font-semibold text-neutral-800 mb-1.5">
                            ទីតាំងរហ័ស (Quick Presets)៖
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdate({ dateOffsetX: 0, dateOffsetY: 0 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-emerald-100 text-neutral-700 font-medium"
                            >
                              ស្តង់ដារ (0, 0)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ dateOffsetY: (template.dateOffsetY || 0) - 4 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-emerald-100 text-neutral-700 font-medium"
                            >
                              ⬆️ ឡើងលើ 4px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ dateOffsetY: (template.dateOffsetY || 0) + 4 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-emerald-100 text-neutral-700 font-medium"
                            >
                              ⬇️ ចុះក្រោម 4px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ dateOffsetX: (template.dateOffsetX || 0) - 8 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-emerald-100 text-neutral-700 font-medium"
                            >
                              ⬅️ ឆ្វេង 8px
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-wrap gap-3 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.showLunarDate}
                            onChange={(e) => handleUpdate({ showLunarDate: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                          />
                          <span>បង្ហាញកាលបរិច្ឆេទចន្ទគតិ (Lunar Date)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.showSolarDate}
                            onChange={(e) => handleUpdate({ showSolarDate: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                          />
                          <span>បង្ហាញកាលបរិច្ឆេទសុរិយគតិ (Solar Date)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* PRINCIPAL NAME (អ៊ុង កងធារ៉ាវុធ) CONTROLS */}
                  {selectedElement === 'principalName' && (
                    <div className="space-y-4 bg-purple-50/50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-purple-600" />
                          <span>កំណត់ទីតាំង និងទំហំឈ្មោះនាយក (អ៊ុង កងធារ៉ាវុធ)</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleUpdate({ principalNameOffsetX: 0, principalNameOffsetY: 0, principalNameFontSize: 7.6 })}
                          className="text-[11px] text-purple-700 hover:text-purple-900 bg-white border border-purple-200 px-2 py-0.5 rounded shadow-xs"
                        >
                          កំណត់ដើម (Reset)
                        </button>
                      </div>

                      {/* Name Text Input */}
                      <div className="bg-white p-3 rounded-lg border border-purple-200/70 text-xs">
                        <label className="block font-semibold text-neutral-800 mb-1">
                          ឈ្មោះនាយកសាលា (Principal Name)៖
                        </label>
                        <input
                          type="text"
                          value={template.principalNameText !== undefined && template.principalNameText !== '' ? template.principalNameText : (school.principal_name || 'អ៊ុង កងធារ៉ាវុធ')}
                          onChange={(e) => handleUpdate({ principalNameText: e.target.value })}
                          placeholder="ឧ. អ៊ុង កងធារ៉ាវុធ"
                          className="w-full text-xs font-muol border border-neutral-300 rounded px-3 py-1.5 bg-white text-neutral-800 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      {/* Offset Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* X Offset */}
                        <div className="bg-white p-3 rounded-lg border border-purple-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឆ្វេង-ស្តាំ (Offset X)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-80"
                                max="80"
                                value={template.principalNameOffsetX || 0}
                                onChange={(e) =>
                                  handleUpdate({ principalNameOffsetX: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-purple-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-purple-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.principalNameOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ principalNameOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>

                        {/* Y Offset */}
                        <div className="bg-white p-3 rounded-lg border border-purple-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឡើង-ចុះ (Offset Y)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-50"
                                max="50"
                                value={template.principalNameOffsetY || 0}
                                onChange={(e) =>
                                  handleUpdate({ principalNameOffsetY: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-purple-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-purple-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.principalNameOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ principalNameOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>
                      </div>

                      {/* Font Size & Quick Align */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-white p-3 rounded-lg border border-purple-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">ទំហំអក្សរឈ្មោះ (Font Size)៖</span>
                            <span className="font-mono font-bold text-purple-700">
                              {(template.principalNameFontSize || 7.6).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.5"
                            max="12"
                            step="0.2"
                            value={template.principalNameFontSize || 7.6}
                            onChange={(e) =>
                              handleUpdate({ principalNameFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-purple-600"
                          />
                        </div>

                        {/* Quick Align Presets */}
                        <div className="bg-white p-3 rounded-lg border border-purple-200/70">
                          <span className="block font-semibold text-neutral-800 mb-1.5">
                            ទីតាំងរហ័ស (Quick Presets)៖
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalNameOffsetX: 0, principalNameOffsetY: 0 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-purple-100 text-neutral-700 font-medium"
                            >
                              កណ្តាលដើម (0, 0)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalNameOffsetY: (template.principalNameOffsetY || 0) - 3 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-purple-100 text-neutral-700 font-medium"
                            >
                              ⬆️ ឡើងលើ 3px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalNameOffsetY: (template.principalNameOffsetY || 0) + 4 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-purple-100 text-neutral-700 font-medium"
                            >
                              ⬇️ ចុះក្រោម 4px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalNameOffsetX: (template.principalNameOffsetX || 0) - 5 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-purple-100 text-neutral-700 font-medium"
                            >
                              ⬅️ ឆ្វេង 5px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalNameOffsetX: (template.principalNameOffsetX || 0) + 5 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-purple-100 text-neutral-700 font-medium"
                            >
                              ➡️ ស្តាំ 5px
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Title & Name Toggles */}
                      <div className="flex flex-wrap gap-3 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.showPrincipalName}
                            onChange={(e) => handleUpdate({ showPrincipalName: e.target.checked })}
                            className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                          />
                          <span>បង្ហាញឈ្មោះនាយក (Show Principal Name)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.showPrincipalTitle}
                            onChange={(e) => handleUpdate({ showPrincipalTitle: e.target.checked })}
                            className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                          />
                          <span>បង្ហាញតួនាទីនាយក (Show Title: នាយកវិទ្យាល័យ)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* PRINCIPAL TITLE (នាយកវិទ្យាល័យ) CONTROLS */}
                  {selectedElement === 'principalTitle' && (
                    <div className="space-y-4 bg-indigo-50/50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          <span>កំណត់ទីតាំង និងទំហំតួនាទីនាយក (នាយកវិទ្យាល័យ)</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleUpdate({ principalTitleOffsetX: 0, principalTitleOffsetY: 0, principalTitleFontSize: 7.3 })}
                          className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                        >
                          កំណត់ដើម (Reset)
                        </button>
                      </div>

                      {/* Title Text Input & Presets */}
                      <div className="bg-white p-3 rounded-lg border border-indigo-200/70 text-xs space-y-2">
                        <label className="block font-semibold text-neutral-800">
                          អត្ថបទតួនាទី (Principal Title Text)៖
                        </label>
                        <input
                          type="text"
                          value={template.principalTitleText !== undefined && template.principalTitleText !== '' ? template.principalTitleText : (school.principal_title || 'នាយកវិទ្យាល័យ')}
                          onChange={(e) => handleUpdate({ principalTitleText: e.target.value })}
                          placeholder="ឧ. នាយកវិទ្យាល័យ"
                          className="w-full text-xs font-muol border border-neutral-300 rounded px-3 py-1.5 bg-white text-neutral-800 focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-neutral-500 mr-1 self-center">គំរូតួនាទីរហ័ស៖</span>
                          {['នាយកវិទ្យាល័យ', 'នាយកសាលា', 'នាយិកាវិទ្យាល័យ', 'ចាងហ្វាងសិក្សា', 'ប្រធានការិយាល័យ'].map((titlePreset) => (
                            <button
                              key={titlePreset}
                              type="button"
                              onClick={() => handleUpdate({ principalTitleText: titlePreset })}
                              className={`px-2 py-0.5 text-[10.5px] rounded border transition-colors cursor-pointer ${
                                (template.principalTitleText || school.principal_title || 'នាយកវិទ្យាល័យ') === titlePreset
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700'
                              }`}
                            >
                              {titlePreset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Offset Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* X Offset */}
                        <div className="bg-white p-3 rounded-lg border border-indigo-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឆ្វេង-ស្តាំ (Offset X)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-80"
                                max="80"
                                value={template.principalTitleOffsetX || 0}
                                onChange={(e) =>
                                  handleUpdate({ principalTitleOffsetX: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-indigo-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-indigo-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.principalTitleOffsetX || 0}
                            onChange={(e) =>
                              handleUpdate({ principalTitleOffsetX: parseInt(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Y Offset */}
                        <div className="bg-white p-3 rounded-lg border border-indigo-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">រំកិលឡើង-ចុះ (Offset Y)៖</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-50"
                                max="50"
                                value={template.principalTitleOffsetY || 0}
                                onChange={(e) =>
                                  handleUpdate({ principalTitleOffsetY: parseInt(e.target.value) || 0 })
                                }
                                className="w-14 text-right font-mono font-bold text-indigo-700 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-indigo-50/30"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.principalTitleOffsetY || 0}
                            onChange={(e) =>
                              handleUpdate({ principalTitleOffsetY: parseInt(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      </div>

                      {/* Font Size & Quick Align */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-white p-3 rounded-lg border border-indigo-200/70">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-neutral-800">ទំហំអក្សរតួនាទី (Font Size)៖</span>
                            <span className="font-mono font-bold text-indigo-700">
                              {(template.principalTitleFontSize || 7.3).toFixed(1)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5.0"
                            max="12.0"
                            step="0.2"
                            value={template.principalTitleFontSize || 7.3}
                            onChange={(e) =>
                              handleUpdate({ principalTitleFontSize: parseFloat(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Quick Align Presets */}
                        <div className="bg-white p-3 rounded-lg border border-indigo-200/70">
                          <span className="block font-semibold text-neutral-800 mb-1.5">
                            ទីតាំងរហ័ស (Quick Presets)៖
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalTitleOffsetX: 0, principalTitleOffsetY: 0 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-indigo-100 text-neutral-700 font-medium cursor-pointer"
                            >
                              កណ្តាលដើម (0, 0)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalTitleOffsetY: (template.principalTitleOffsetY || 0) - 3 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-indigo-100 text-neutral-700 font-medium cursor-pointer"
                            >
                              ⬆️ ឡើងលើ 3px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalTitleOffsetY: (template.principalTitleOffsetY || 0) + 3 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-indigo-100 text-neutral-700 font-medium cursor-pointer"
                            >
                              ⬇️ ចុះក្រោម 3px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalTitleOffsetX: (template.principalTitleOffsetX || 0) - 5 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-indigo-100 text-neutral-700 font-medium cursor-pointer"
                            >
                              ⬅️ ឆ្វេង 5px
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ principalTitleOffsetX: (template.principalTitleOffsetX || 0) + 5 })}
                              className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-indigo-100 text-neutral-700 font-medium cursor-pointer"
                            >
                              ➡️ ស្តាំ 5px
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Title Toggle */}
                      <div className="flex flex-wrap gap-3 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.showPrincipalTitle}
                            onChange={(e) => handleUpdate({ showPrincipalTitle: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                          />
                          <span>បង្ហាញតួនាទីនាយកវិទ្យាល័យ (Show Principal Title)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: LAYERS MANAGEMENT (គ្រប់គ្រង Layer & លំដាប់ជាន់) */}
            {/* ======================================================== */}
            {activeTab === 'layers' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      គ្រប់គ្រង Layer និងលំដាប់ជាន់មុខក្រោយ (Layer Stacking & Ordering)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      កំណត់លំដាប់ជាន់ (Z-Index) នៃធាតុនីមួយៗនៅលើកាត។ Layer ណាមានលេខខ្ពស់ជាង នឹងនៅពីមុខគេ។
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate({
                        photoZIndex: 20,
                        stampZIndex: 25,
                        signatureZIndex: 15,
                        qrZIndex: 10,
                        titleZIndex: 20,
                        infoZIndex: 10,
                        headerZIndex: 15,
                        watermarkZIndex: 2,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    កំណត់ Layer ទៅលំនាំដើម
                  </button>
                </div>

                {/* SPECIAL HIGHLIGHT: Photo & Stamp Layering */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/50 rounded-xl border border-indigo-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                        <FileCheck2 className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">
                          លំដាប់ជាន់រវាង រូបថតសិស្ស និង ត្រាសាលា (Photo vs Stamp Layering)
                        </h4>
                        <p className="text-[11px] text-neutral-600">
                          រៀបចំឱ្យត្រាវាយពីលើរូបថត ឬឱ្យរូបថតនៅពីមុខត្រា
                        </p>
                      </div>
                    </div>

                    {/* Stamp Placement Mode */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-indigo-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-neutral-600 px-1.5">ទីតាំងត្រា៖</span>
                      <button
                        type="button"
                        onClick={() => handleUpdate({ stampPositionMode: 'photo-corner' })}
                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                          template.stampPositionMode === 'photo-corner'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        📌 លើ/ក្បែររូបថតសិស្ស
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate({ stampPositionMode: 'footer' })}
                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                          template.stampPositionMode === 'footer' || !template.stampPositionMode
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        📄 ខាងក្រោមកាត (កាលបរិច្ឆេទ)
                      </button>
                    </div>
                  </div>

                  {/* 2 Big Choice Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: Stamp on top of Photo */}
                    <div
                      onClick={() => {
                        handleUpdate({
                          stampZIndex: Math.max((template.photoZIndex || 20) + 5, 25),
                          photoZIndex: Math.min(template.photoZIndex || 20, 20),
                        });
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        (template.stampZIndex ?? 25) > (template.photoZIndex ?? 20)
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/80 border-neutral-200 hover:border-indigo-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            ✓
                          </span>
                          <span className="text-xs font-bold text-neutral-900">
                            ត្រានៅពីមុខរូបថត (Stamp on Top)
                          </span>
                        </div>
                        {(template.stampZIndex ?? 25) > (template.photoZIndex ?? 20) && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            កំពុងជ្រើស
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-2">
                        ត្រាសាលានៅជាន់ពីលើ វាយកាត់ពីលើគែមរូបថតសិស្ស (ត្រាពិតប្រាកដ)
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-neutral-500 bg-neutral-50 px-2 py-1 rounded">
                        <span>Stamp z-index: <strong className="text-indigo-600">{template.stampZIndex ?? 25}</strong></span>
                        <span>&gt;</span>
                        <span>Photo z-index: <strong className="text-neutral-700">{template.photoZIndex ?? 20}</strong></span>
                      </div>
                    </div>

                    {/* Option 2: Photo in front of Stamp */}
                    <div
                      onClick={() => {
                        handleUpdate({
                          photoZIndex: Math.max((template.stampZIndex ?? 20) + 5, 25),
                          stampZIndex: Math.min(template.stampZIndex ?? 20, 15),
                        });
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        (template.photoZIndex ?? 20) > (template.stampZIndex ?? 25)
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/80 border-neutral-200 hover:border-indigo-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            📷
                          </span>
                          <span className="text-xs font-bold text-neutral-900">
                            រូបថតនៅពីមុខគេ (Photo in Front)
                          </span>
                        </div>
                        {(template.photoZIndex ?? 20) > (template.stampZIndex ?? 25) && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            កំពុងជ្រើស
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-2">
                        រូបថតសិស្សនៅជាន់លើ មិនមានត្រាបាំងពីមុខឡើយ (រូបថតច្បាស់ 100%)
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-neutral-500 bg-neutral-50 px-2 py-1 rounded">
                        <span>Photo z-index: <strong className="text-indigo-600">{template.photoZIndex ?? 20}</strong></span>
                        <span>&gt;</span>
                        <span>Stamp z-index: <strong className="text-neutral-700">{template.stampZIndex ?? 25}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Layers Table / Stack Control */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5">
                    បញ្ជីស្រទាប់ទាំងអស់លើកាត (All Card Layer Stacking Order)
                  </h4>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'photo',
                        name: 'រូបថតសិស្ស (Student Photo)',
                        icon: '📷',
                        zKey: 'photoZIndex' as const,
                        zVal: template.photoZIndex ?? 20,
                        showKey: 'showPhoto' as const,
                        showVal: template.showPhoto !== false,
                      },
                      {
                        id: 'stamp',
                        name: 'ត្រាសាលា (School Stamp)',
                        icon: '🔴',
                        zKey: 'stampZIndex' as const,
                        zVal: template.stampZIndex ?? 25,
                        showKey: 'showStamp' as const,
                        showVal: template.showStamp !== false,
                      },
                      {
                        id: 'title',
                        name: 'ចំណងជើង «ប័ណ្ណសម្គាល់ខ្លួន» (Title Banner & Text)',
                        icon: '🏷️',
                        zKey: 'titleZIndex' as const,
                        zVal: template.titleZIndex ?? 20,
                        showKey: 'showTitleBanner' as const,
                        showVal: template.showTitleBanner !== false,
                      },
                      {
                        id: 'signature',
                        name: 'ហត្ថលេខា (Signature)',
                        icon: '✍️',
                        zKey: 'signatureZIndex' as const,
                        zVal: template.signatureZIndex ?? 15,
                        showKey: 'showSignature' as const,
                        showVal: template.showSignature !== false,
                      },
                      {
                        id: 'qr',
                        name: 'QR Code (កូដសម្គាល់)',
                        icon: '📱',
                        zKey: 'qrZIndex' as const,
                        zVal: template.qrZIndex ?? 10,
                        showKey: 'showQrCode' as const,
                        showVal: template.showQrCode !== false,
                      },
                      {
                        id: 'info',
                        name: 'ព័ត៌មានលម្អិតសិស្ស (Student Info Grid)',
                        icon: '📝',
                        zKey: 'infoZIndex' as const,
                        zVal: template.infoZIndex ?? 10,
                        showKey: null,
                        showVal: true,
                      },
                      {
                        id: 'header',
                        name: 'ក្បាលសំបុត្រ/Header (School Header Banner)',
                        icon: '🏛️',
                        zKey: 'headerZIndex' as const,
                        zVal: template.headerZIndex ?? 15,
                        showKey: 'showHeader' as const,
                        showVal: template.showHeader !== false,
                      },
                      {
                        id: 'watermark',
                        name: 'រូបសញ្ញាព្រាលផ្ទៃក្រោយ (Watermark Logo)',
                        icon: '💧',
                        zKey: 'watermarkZIndex' as const,
                        zVal: template.watermarkZIndex ?? 2,
                        showKey: 'showWatermark' as const,
                        showVal: template.showWatermark !== false,
                      },
                    ]
                      .sort((a, b) => b.zVal - a.zVal)
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 hover:border-indigo-300 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-mono font-bold text-xs">
                              {index + 1}
                            </span>
                            <span className="text-base">{item.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-neutral-900">{item.name}</p>
                              <p className="text-[11px] text-neutral-500">
                                Layer #{index + 1} • z-index:{' '}
                                <span className="font-mono font-bold text-indigo-600">{item.zVal}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Visibility toggle */}
                            {item.showKey && (
                              <button
                                type="button"
                                onClick={() => handleUpdate({ [item.showKey!]: !item.showVal })}
                                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                                  item.showVal
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                                }`}
                                title={item.showVal ? 'លាក់ Layer' : 'បង្ហាញ Layer'}
                              >
                                {item.showVal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                {item.showVal ? 'បង្ហាញ' : 'លាក់'}
                              </button>
                            )}

                            {/* Bring Forward / Send Backward buttons */}
                            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => handleUpdate({ [item.zKey]: Math.max(1, item.zVal - 1) })}
                                className="px-2 py-1 text-xs font-bold text-neutral-600 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer"
                                title="ទម្លាក់ជាន់ក្រោយ (-1)"
                              >
                                ⬇️ ថយក្រោយ
                              </button>
                              <span className="px-2 font-mono text-xs font-bold text-neutral-800 border-x border-neutral-200">
                                {item.zVal}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdate({ [item.zKey]: item.zVal + 1 })}
                                className="px-2 py-1 text-xs font-bold text-neutral-600 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer"
                                title="លើកជាន់មុខ (+1)"
                              >
                                ⬆️ មកមុខ
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: TITLE BANNER & TEXT (ចំណងជើង «ប័ណ្ណសម្គាល់ខ្លួន» & ពណ៌ផ្ទៃ) */}
            {/* ======================================================== */}
            {activeTab === 'title' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-600" />
                      កំណត់ពាក្យ «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស» និងពណ៌ផ្ទៃ Banner
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      ប្តូរពណ៌ផ្ទៃខៀវ (ឬលុបផ្ទៃពណ៌ឱ្យនៅត្រឹមអក្សរ) ប្តូរទំហំអក្សរ និងរំកិលទីតាំងឡើងចុះឆ្វេងស្តាំ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate({
                        showTitleBanner: true,
                        showTitleBannerBg: true,
                        titleBannerBgColor: '#1e40af',
                        titleBannerBgColorEnd: '#2563eb',
                        titleBannerTextColor: '#ffffff',
                        titleFontSize: 10,
                        titleOffsetX: 0,
                        titleOffsetY: 0,
                        showSubtitle: true,
                        subtitleFontSize: 6.5,
                        subtitleOffsetX: 0,
                        subtitleOffsetY: 0,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    កំណត់ទៅលំនាំដើម
                  </button>
                </div>

                {/* 1. Background Blue Banner Toggle & Color */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">
                        ពណ៌ផ្ទៃខៀវនៅខាងក្រោយអក្សរ (Banner Background Color)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        អាចកំណត់ឱ្យបង្ហាញផ្ទៃពណ៌ ឬកំណត់ឱ្យអត់ពណ៌ផ្ទៃ (Transparent)
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.showTitleBannerBg !== false}
                        onChange={(e) => handleUpdate({ showTitleBannerBg: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-xs font-bold text-neutral-700">
                        {template.showTitleBannerBg !== false ? 'បង្ហាញផ្ទៃពណ៌' : 'អត់ពណ៌ផ្ទៃ (Transparent)'}
                      </span>
                    </label>
                  </div>

                  {template.showTitleBannerBg !== false && (
                    <div className="space-y-3 pt-2 border-t border-neutral-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            ពណ៌ខាងឆ្វេង (Start Color)៖
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={template.titleBannerBgColor || '#1e40af'}
                              onChange={(e) => handleUpdate({ titleBannerBgColor: e.target.value })}
                              className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={template.titleBannerBgColor || '#1e40af'}
                              onChange={(e) => handleUpdate({ titleBannerBgColor: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            ពណ៌ខាងស្តាំ (End Color Gradient)៖
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={template.titleBannerBgColorEnd || '#2563eb'}
                              onChange={(e) => handleUpdate({ titleBannerBgColorEnd: e.target.value })}
                              className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={template.titleBannerBgColorEnd || '#2563eb'}
                              onChange={(e) => handleUpdate({ titleBannerBgColorEnd: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Color Presets */}
                      <div>
                        <span className="block text-[11px] font-bold text-neutral-600 mb-1.5">
                          ពណ៌គំរូរហ័ស (Preset Colors)៖
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'ខៀវស្តង់ដារ', bg: '#1e40af', end: '#2563eb', text: '#ffffff' },
                            { name: 'ខៀវចាស់ Navy', bg: '#0f172a', end: '#1e293b', text: '#ffffff' },
                            { name: 'ក្រហម Royal', bg: '#991b1b', end: '#dc2626', text: '#ffffff' },
                            { name: 'បៃតង Emerald', bg: '#065f46', end: '#059669', text: '#ffffff' },
                            { name: 'ស្វាយ Purple', bg: '#581c87', end: '#7e22ce', text: '#ffffff' },
                            { name: 'មាស Gold', bg: '#854d0e', end: '#ca8a04', text: '#ffffff' },
                            { name: 'ផ្ទៃខ្មៅ Sleek', bg: '#18181b', end: '#27272a', text: '#ffffff' },
                          ].map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                handleUpdate({
                                  titleBannerBgColor: c.bg,
                                  titleBannerBgColorEnd: c.end,
                                  titleBannerTextColor: c.text,
                                  showTitleBannerBg: true,
                                })
                              }
                              className="px-2.5 py-1 text-xs rounded-lg font-medium border border-neutral-200 hover:shadow-xs flex items-center gap-1.5 bg-white cursor-pointer"
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full"
                                style={{ background: `linear-gradient(to right, ${c.bg}, ${c.end})` }}
                              />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Title Text Typography & Color */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold text-neutral-900">
                    ទំហំ និង ពណ៌អក្សរ «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស»
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Font Size Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-neutral-700">ទំហំអក្សរ (Font Size)៖</span>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {(template.titleFontSize || 10).toFixed(1)} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="24"
                        step="0.5"
                        value={template.titleFontSize || 10}
                        onChange={(e) => handleUpdate({ titleFontSize: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>តូច (6px)</span>
                        <span>ស្តង់ដារ (10px)</span>
                        <span>ធំ (24px)</span>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        ពណ៌អក្សរ (Text Color)៖
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={template.titleBannerTextColor || '#ffffff'}
                          onChange={(e) => handleUpdate({ titleBannerTextColor: e.target.value })}
                          className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={template.titleBannerTextColor || '#ffffff'}
                          onChange={(e) => handleUpdate({ titleBannerTextColor: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Move / Nudge Controls */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">
                        រំកិលទីតាំងអក្សរ (Move / Nudge Offset)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        ចុចប៊ូតុងទិសដៅ ឬអូសរបារដើម្បីរំកិលអក្សរតាមចិត្ត
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdate({ titleOffsetX: 0, titleOffsetY: 0 })}
                      className="px-2.5 py-1 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                    >
                      កណ្តាលដើម (0, 0)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* 4-way Nudge Pad */}
                    <div className="flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => handleUpdate({ titleOffsetY: (template.titleOffsetY || 0) - 2 })}
                        className="p-2 bg-white hover:bg-indigo-50 border border-neutral-300 hover:border-indigo-400 rounded-lg text-neutral-700 shadow-2xs cursor-pointer mb-1"
                        title="ឡើងលើ 2px"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate({ titleOffsetX: (template.titleOffsetX || 0) - 2 })}
                          className="p-2 bg-white hover:bg-indigo-50 border border-neutral-300 hover:border-indigo-400 rounded-lg text-neutral-700 shadow-2xs cursor-pointer"
                          title="ទៅឆ្វេង 2px"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-[10px] text-indigo-700 text-center font-mono">
                          X:{template.titleOffsetX || 0}<br/>Y:{template.titleOffsetY || 0}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdate({ titleOffsetX: (template.titleOffsetX || 0) + 2 })}
                          className="p-2 bg-white hover:bg-indigo-50 border border-neutral-300 hover:border-indigo-400 rounded-lg text-neutral-700 shadow-2xs cursor-pointer"
                          title="ទៅស្តាំ 2px"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdate({ titleOffsetY: (template.titleOffsetY || 0) + 2 })}
                        className="p-2 bg-white hover:bg-indigo-50 border border-neutral-300 hover:border-indigo-400 rounded-lg text-neutral-700 shadow-2xs cursor-pointer mt-1"
                        title="ចុះក្រោម 2px"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-neutral-700">រំកិល ផ្តេក (X Offset)៖</span>
                          <span className="font-mono font-bold text-indigo-600">{template.titleOffsetX || 0} px</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          step="1"
                          value={template.titleOffsetX || 0}
                          onChange={(e) => handleUpdate({ titleOffsetX: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-neutral-700">រំកិល បញ្ឈរ (Y Offset)៖</span>
                          <span className="font-mono font-bold text-indigo-600">{template.titleOffsetY || 0} px</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          step="1"
                          value={template.titleOffsetY || 0}
                          onChange={(e) => handleUpdate({ titleOffsetY: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Subtitle "STUDENT IDENTITY CARD" / Academic Year Controls */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">
                        ចំណងជើងរង / ឆ្នាំសិក្សា (Academic Year / Subtitle)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        បើក/បិទ, កែសម្រួលទំហំអក្សរ និងរំកិលទីតាំង X/Y ដោយសេរី
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.showSubtitle !== false}
                        onChange={(e) => handleUpdate({ showSubtitle: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-xs font-bold text-neutral-700">
                        {template.showSubtitle !== false ? 'បង្ហាញ' : 'លាក់'}
                      </span>
                    </label>
                  </div>

                  {template.showSubtitle !== false && (
                    <div className="pt-2 space-y-3 border-t border-neutral-100">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-neutral-700">ទំហំអក្សររង / ឆ្នាំសិក្សា៖</span>
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {(template.subtitleFontSize || 6.5).toFixed(1)} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          step="0.5"
                          value={template.subtitleFontSize || 6.5}
                          onChange={(e) => handleUpdate({ subtitleFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      {/* Custom Subtitle / Academic Year Text Override */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          អត្ថបទឆ្នាំសិក្សា / ចំណងជើងរង (ឧ. ឆ្នាំសិក្សា ២០២៥ -២០២៧)៖
                        </label>
                        <input
                          type="text"
                          value={template.headerSubtitleKhmer ?? ''}
                          onChange={(e) => handleUpdate({ headerSubtitleKhmer: e.target.value })}
                          placeholder={school.academic_year ? `ឆ្នាំសិក្សា ${school.academic_year}` : 'STUDENT IDENTITY CARD'}
                          className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                        <span className="text-[10px] text-neutral-400">
                          ប្រសិនបើទុកទំនេរ ប្រព័ន្ធនឹងយកតាមព័ត៌មានឆ្នាំសិក្សារបស់សាលាដោយស្វ័យប្រវត្តិ
                        </span>
                      </div>

                      {/* Subtitle / Academic Year X & Y Offsets */}
                      <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <span>↔️ ↕️</span>
                            <span>រំកិលទីតាំងឆ្នាំសិក្សា (X / Y Offset)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetElementByName('subtitle')}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold underline"
                          >
                            កំណត់ឡើងវិញ (0, 0)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                              <span>ឆ្វេង ⇄ ស្ដាំ (X)</span>
                              <span className="font-mono font-bold text-indigo-700">
                                {(template.subtitleOffsetX || 0) > 0 ? `+${template.subtitleOffsetX}` : (template.subtitleOffsetX || 0)} px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              step="1"
                              value={template.subtitleOffsetX || 0}
                              onChange={(e) => handleUpdate({ subtitleOffsetX: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                              <span>លើ ⇅ ក្រោម (Y)</span>
                              <span className="font-mono font-bold text-indigo-700">
                                {(template.subtitleOffsetY || 0) > 0 ? `+${template.subtitleOffsetY}` : (template.subtitleOffsetY || 0)} px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              step="1"
                              value={template.subtitleOffsetY || 0}
                              onChange={(e) => handleUpdate({ subtitleOffsetY: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>

                        {/* 4-way nudge buttons */}
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdate({ subtitleOffsetX: (template.subtitleOffsetX || 0) - 1 })}
                            className="px-2 py-1 bg-white border border-indigo-200 rounded text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 shadow-2xs"
                            title="រំកិលទៅឆ្វេង 1px"
                          >
                            ◀ ឆ្វេង
                          </button>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdate({ subtitleOffsetY: (template.subtitleOffsetY || 0) - 1 })}
                              className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 shadow-2xs"
                              title="រំកិលឡើងលើ 1px"
                            >
                              ▲ លើ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate({ subtitleOffsetY: (template.subtitleOffsetY || 0) + 1 })}
                              className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 shadow-2xs"
                              title="រំកិលចុះក្រោម 1px"
                            >
                              ▼ ក្រោម
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdate({ subtitleOffsetX: (template.subtitleOffsetX || 0) + 1 })}
                            className="px-2 py-1 bg-white border border-indigo-200 rounded text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 shadow-2xs"
                            title="រំកិលទៅស្ដាំ 1px"
                          >
                            ស្ដាំ ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: CARD DIMENSIONS & LAYOUT (ទំហំកាត & ប្លង់) */}
            {/* ======================================================== */}
            {activeTab === 'dimensions' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-emerald-600" />
                      កំណត់ទំហំកាត និងទិសដៅប្លង់ (Card Dimensions & Orientation)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      ជ្រើសរើសខ្នាតគិតជា <strong className="text-neutral-800">សង់ទីម៉ែត្រ (cm)</strong> ឬ <strong className="text-neutral-800">មីលីម៉ែត្រ (mm)</strong> តាមតម្រូវការជាក់ស្តែង
                    </p>
                  </div>
                  
                  {/* Unit Selector (cm vs mm) */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold text-neutral-700">ខ្នាតរង្វាស់៖</span>
                    <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => setDimensionUnit('cm')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          dimensionUnit === 'cm'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        cm (សង់ទីម៉ែត្រ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDimensionUnit('mm')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          dimensionUnit === 'mm'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        mm (មីលីម៉ែត្រ)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Standard Size Presets */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">
                    គំរូទំហំស្តង់ដារដែលពេញនិយម (Standard Size Presets)៖
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CARD_SIZE_PRESETS.map((preset, idx) => {
                      const currentW = template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92);
                      const currentH = template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128);
                      const isCurrent = Math.abs(currentW - preset.width) < 0.5 && Math.abs(currentH - preset.height) < 0.5;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            handleUpdate({
                              cardWidthMm: preset.width,
                              cardHeightMm: preset.height,
                              cardBorderRadiusMm: preset.radius,
                              orientation: preset.orientation,
                            });
                          }}
                          className={`cursor-pointer p-3 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                                {preset.name}
                                {isCurrent && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                )}
                              </p>
                              <p className="text-[11px] text-neutral-500 mt-0.5">{preset.desc}</p>
                            </div>
                            <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                              {dimensionUnit === 'cm'
                                ? `${(preset.width / 10).toFixed(1)}x${(preset.height / 10).toFixed(1)} cm`
                                : `${preset.width}x${preset.height} mm`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Manual Dimension Sliders & Inputs */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      កំណត់ទំហំផ្ទាល់ខ្លួន (Custom Card Sizing in {dimensionUnit.toUpperCase()})
                    </h4>
                    <span className="text-[11px] text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                      {dimensionUnit === 'cm' ? 'បញ្ចូលជា សង់ទីម៉ែត្រ (cm)' : 'បញ្ចូលជា មីលីម៉ែត្រ (mm)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Card Width */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-neutral-700">ទទឹងកាត (Width):</span>
                        <div className="flex items-center gap-1">
                          {dimensionUnit === 'cm' ? (
                            <>
                              <input
                                type="number"
                                min="4.5"
                                max="18.0"
                                step="0.1"
                                value={((template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)) / 10).toFixed(1)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdate({ cardWidthMm: Math.round(val * 10) });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">cm</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                min="45"
                                max="180"
                                step="1"
                                value={template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdate({ cardWidthMm: val });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">mm</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {dimensionUnit === 'cm' ? (
                        <input
                          type="range"
                          min="4.5"
                          max="18.0"
                          step="0.1"
                          value={(template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)) / 10}
                          onChange={(e) =>
                            handleUpdate({ cardWidthMm: Math.round(parseFloat(e.target.value) * 10) })
                          }
                          className="w-full accent-emerald-600"
                        />
                      ) : (
                        <input
                          type="range"
                          min="45"
                          max="180"
                          step="1"
                          value={template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)}
                          onChange={(e) =>
                            handleUpdate({ cardWidthMm: parseInt(e.target.value) })
                          }
                          className="w-full accent-emerald-600"
                        />
                      )}

                      <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-mono">
                        <span>{dimensionUnit === 'cm' ? '4.5 cm' : '45 mm'}</span>
                        <span className="text-emerald-700 font-semibold">
                          ≈ {dimensionUnit === 'cm'
                            ? `${template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)} mm`
                            : `${((template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)) / 10).toFixed(1)} cm`}
                        </span>
                        <span>{dimensionUnit === 'cm' ? '18.0 cm' : '180 mm'}</span>
                      </div>
                    </div>

                    {/* Card Height */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-neutral-700">កម្ពស់កាត (Height):</span>
                        <div className="flex items-center gap-1">
                          {dimensionUnit === 'cm' ? (
                            <>
                              <input
                                type="number"
                                min="4.5"
                                max="18.0"
                                step="0.1"
                                value={((template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)) / 10).toFixed(1)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdate({ cardHeightMm: Math.round(val * 10) });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">cm</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                min="45"
                                max="180"
                                step="1"
                                value={template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdate({ cardHeightMm: val });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">mm</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {dimensionUnit === 'cm' ? (
                        <input
                          type="range"
                          min="4.5"
                          max="18.0"
                          step="0.1"
                          value={(template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)) / 10}
                          onChange={(e) =>
                            handleUpdate({ cardHeightMm: Math.round(parseFloat(e.target.value) * 10) })
                          }
                          className="w-full accent-emerald-600"
                        />
                      ) : (
                        <input
                          type="range"
                          min="45"
                          max="180"
                          step="1"
                          value={template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)}
                          onChange={(e) =>
                            handleUpdate({ cardHeightMm: parseInt(e.target.value) })
                          }
                          className="w-full accent-emerald-600"
                        />
                      )}

                      <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-mono">
                        <span>{dimensionUnit === 'cm' ? '4.5 cm' : '45 mm'}</span>
                        <span className="text-emerald-700 font-semibold">
                          ≈ {dimensionUnit === 'cm'
                            ? `${template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)} mm`
                            : `${((template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)) / 10).toFixed(1)} cm`}
                        </span>
                        <span>{dimensionUnit === 'cm' ? '18.0 cm' : '180 mm'}</span>
                      </div>
                    </div>

                    {/* Corner Radius */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-neutral-700">កម្រិតជ្រុងមូល (Radius):</span>
                        <div className="flex items-center gap-1">
                          {dimensionUnit === 'cm' ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="1.5"
                                step="0.05"
                                value={((template.cardBorderRadiusMm ?? 3) / 10).toFixed(2)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    handleUpdate({ cardBorderRadiusMm: Math.round(val * 10 * 10) / 10 });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">cm</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="15"
                                step="0.5"
                                value={template.cardBorderRadiusMm ?? 3}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    handleUpdate({ cardBorderRadiusMm: val });
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-emerald-700 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                              />
                              <span className="text-[11px] text-neutral-500 font-bold">mm</span>
                            </>
                          )}
                        </div>
                      </div>

                      {dimensionUnit === 'cm' ? (
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={(template.cardBorderRadiusMm ?? 3) / 10}
                          onChange={(e) =>
                            handleUpdate({ cardBorderRadiusMm: parseFloat(e.target.value) * 10 })
                          }
                          className="w-full accent-emerald-600"
                        />
                      ) : (
                        <input
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          value={template.cardBorderRadiusMm ?? 3}
                          onChange={(e) =>
                            handleUpdate({ cardBorderRadiusMm: parseFloat(e.target.value) })
                          }
                          className="w-full accent-emerald-600"
                        />
                      )}

                      <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-mono">
                        <span>{dimensionUnit === 'cm' ? '0 cm' : '0 mm'}</span>
                        <span className="text-emerald-700 font-semibold">
                          ≈ {dimensionUnit === 'cm'
                            ? `${template.cardBorderRadiusMm ?? 3} mm`
                            : `${((template.cardBorderRadiusMm ?? 3) / 10).toFixed(1)} cm`}
                        </span>
                        <span>{dimensionUnit === 'cm' ? '1.5 cm' : '15 mm'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orientation Switcher */}
                  <div className="pt-2 border-t border-neutral-200">
                    <span className="block text-xs font-medium text-neutral-700 mb-2">
                      ទិសដៅប្លង់កាត (Card Orientation):
                    </span>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => handleUpdate({ orientation: 'portrait' })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          template.orientation === 'portrait'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <MoveVertical className="w-4 h-4" />
                        <span>ប្លង់បញ្ឈរ (Portrait)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdate({ orientation: 'landscape' })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          template.orientation === 'landscape'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        <span>ប្លង់ផ្តេក (Landscape)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Print Sheet Advice Box */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Printer className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-950">ការបោះពុម្ពលើសន្លឹក A4 (Print Compatibility):</p>
                    <p className="text-emerald-800 text-[11px] leading-relaxed">
                      ទំហំកាតបច្ចុប្បន្ន <strong>{template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)}mm x {template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)}mm</strong> ត្រូវគ្នាយ៉ាងល្អឥតខ្ចោះជាមួយមុខងារបោះពុម្ពជាក្រុម ៦ ឬ ៨ កាតក្នុងមួយសន្លឹក A4 ដោយមានបន្ទាត់កាត់ច្បាស់លាស់។
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* ======================================================== */}
            {/* TAB 1: PRESETS */}
            {/* ======================================================== */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ជ្រើសរើសគំរូកាតដែលបានរៀបចំទុកស្រេច (Cambodian ID Card Presets)
                  </h3>
                  <span className="text-xs text-neutral-500">ចុចលើគំរូដើម្បីអនុវត្តភ្លាមៗ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TEMPLATE_PRESETS.map((preset) => {
                    const isSelected = template.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Top banner visual bar */}
                        <div
                          className={`h-2.5 w-full rounded-md bg-gradient-to-r ${preset.previewBg} mb-3`}
                        />

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-neutral-900 group-hover:text-blue-700 transition-colors">
                              {preset.nameKhmer}
                            </h4>
                            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                              {preset.nameEn}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>កាតស្តង់ដារ ៩២ x ១២៨ មម</span>
                          <span className="font-semibold text-blue-600 group-hover:underline">
                            {isSelected ? 'កំពុងប្រើប្រាស់' : 'ជ្រើសរើសយក'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: STYLES, COLORS & FRAME */}
            {/* ======================================================== */}
            {activeTab === 'style' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  រចនាបថប្លង់ ទិសដៅកាត និងស៊ុមតុបតែង
                </h3>

                {/* Orientation Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-2">
                    ទម្រង់ទិសដៅកាត (Orientation)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdate({ orientation: 'portrait' })}
                      className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                        template.orientation === 'portrait'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-6 h-8 border-2 border-current rounded-[1px] flex items-center justify-center text-[7px]">
                        92x128
                      </div>
                      <div>
                        <div className="text-xs font-bold">បញ្ឈរ (Portrait - ស្តង់ដារ)</div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          ស័ក្តិសមសម្រាប់ A4 (៦ ឬ ៨ ប័ណ្ណ/សន្លឹក)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdate({ orientation: 'landscape' })}
                      className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                        template.orientation === 'landscape'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-8 h-6 border-2 border-current rounded-[1px] flex items-center justify-center text-[7px]">
                        128x92
                      </div>
                      <div>
                        <div className="text-xs font-bold">ផ្តេក (Landscape)</div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          ទម្រង់ប័ណ្ណទូលាយបែបសហសម័យ
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Inner Border Frame Style */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-2">
                    រចនាបថស៊ុមខាងក្នុង (Inner Border Frame)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'single', name: 'បន្ទាត់ទោល (Single)' },
                      { id: 'double', name: 'បន្ទាត់ភ្លោះ (Double)' },
                      { id: 'ornamental', name: 'ក្បាច់ខ្មែរ (Ornamental)' },
                      { id: 'minimal', name: 'ឆ្មារស្រាល (Minimal)' },
                    ].map((border) => (
                      <button
                        key={border.id}
                        type="button"
                        onClick={() => handleUpdate({ innerBorderType: border.id as any })}
                        className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                          template.innerBorderType === border.id
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {border.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      ពណ៌ចម្បង (Primary Color - ក្បាលប័ណ្ណ & ចំណងជើង)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.primaryColor}
                        onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                        className="w-10 h-9 p-0.5 border border-neutral-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={template.primaryColor}
                        onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                        className="w-full text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      ពណ៌រង (Secondary / Gold Accent Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.secondaryColor}
                        onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                        className="w-10 h-9 p-0.5 border border-neutral-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={template.secondaryColor}
                        onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                        className="w-full text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      ពណ៌ផ្ទៃបាតកាត (Card Background Tint)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.cardBgColor || '#ffffff'}
                        onChange={(e) => handleUpdate({ cardBgColor: e.target.value })}
                        className="w-10 h-9 p-0.5 border border-neutral-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={template.cardBgColor || '#ffffff'}
                        onChange={(e) => handleUpdate({ cardBgColor: e.target.value })}
                        className="w-full text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      ពណ៌ស៊ុមខាងក្នុង (Inner Border Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.innerBorderColor || template.primaryColor}
                        onChange={(e) => handleUpdate({ innerBorderColor: e.target.value })}
                        className="w-10 h-9 p-0.5 border border-neutral-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={template.innerBorderColor || template.primaryColor}
                        onChange={(e) => handleUpdate({ innerBorderColor: e.target.value })}
                        className="w-full text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Watermark opacity */}
                <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-neutral-800">
                    <span>កម្រិតព្រាលនិមិត្តសញ្ញាផ្ទៃក្រោយ (Watermark Emblem Opacity)</span>
                    <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {Math.round(template.watermarkOpacity * 100)}%
                    </span>
                  </div>

                  {/* Watermark Emblem Source Selector */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdate({ watermarkType: 'school-logo' })}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        template.watermarkType !== 'moeys-emblem'
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[8px] text-neutral-400 font-mono">Logo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[11px]">Logo សាលា (School Logo)</div>
                        <div className="text-[9.5px] text-neutral-500 truncate">
                          {school.logo_url ? 'បានកំណត់ពីសាលា' : 'ប្រើ Logo សាលា'}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdate({ watermarkType: 'moeys-emblem' })}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        template.watermarkType === 'moeys-emblem'
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                        <MoEYSEmblem size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[11px]">ព្រះរាជសញ្ញា (MoEYS)</div>
                        <div className="text-[9.5px] text-neutral-500 truncate">ត្រាសញ្ញាជាតិក្រសួង</div>
                      </div>
                    </button>
                  </div>

                  {/* Watermark Opacity Slider */}
                  <input
                    type="range"
                    min="0"
                    max="0.30"
                    step="0.01"
                    value={template.watermarkOpacity}
                    onChange={(e) => handleUpdate({ watermarkOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>បិទ (0%)</span>
                    <span>ស្រាល (5%)</span>
                    <span>មធ្យម (15%)</span>
                    <span>ច្បាស់ (30%)</span>
                  </div>

                  {/* Watermark Size Slider */}
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-neutral-700">
                    <span className="font-medium">ទំហំ Watermark:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="70"
                        max="240"
                        step="5"
                        value={template.watermarkSize || 130}
                        onChange={(e) => handleUpdate({ watermarkSize: parseInt(e.target.value) })}
                        className="w-28 accent-blue-600"
                      />
                      <span className="font-mono text-[10px] text-neutral-500 w-9 text-right">
                        {template.watermarkSize || 130}px
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: HEADER & BRANDING */}
            {/* ======================================================== */}
            {activeTab === 'header' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  កំណត់ផ្នែកក្បាលប័ណ្ណ និងបដាចំណងជើង
                </h3>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showRoyalMotto}
                      onChange={(e) => handleUpdate({ showRoyalMotto: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>ពាក្យស្លោក «ព្រះរាជាណាចក្រកម្ពុជា»</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showMinistry}
                      onChange={(e) => handleUpdate({ showMinistry: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញ «ក្រសួងអប់រំ យុវជន និងកីឡា»</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showDepartment}
                      onChange={(e) => handleUpdate({ showDepartment: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញ «មន្ទីរអប់រំខេត្ត...»</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showSchoolName}
                      onChange={(e) => handleUpdate({ showSchoolName: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញ «ឈ្មោះវិទ្យាល័យ»</span>
                  </label>
                </div>

                {/* Header Banner Settings */}
                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ចំណងជើងប័ណ្ណ (Card Title)
                      </label>
                      <input
                        type="text"
                        value={template.headerTitleKhmer}
                        onChange={(e) => handleUpdate({ headerTitleKhmer: e.target.value })}
                        placeholder="ប័ណ្ណសម្គាល់ខ្លួនសិស្ស"
                        className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ចំណងជើងរង / ឆ្នាំសិក្សា (Subtitle / Year)
                      </label>
                      <input
                        type="text"
                        value={template.headerSubtitleKhmer}
                        onChange={(e) => handleUpdate({ headerSubtitleKhmer: e.target.value })}
                        placeholder={school.academic_year || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-1.5"
                      />
                    </div>
                  </div>

                  {/* Banner Style & Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        រចនាបថបដា (Banner Style)
                      </label>
                      <select
                        value={template.headerStyle}
                        onChange={(e) => handleUpdate({ headerStyle: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="gradient">ពណ៌ជម្រាល (Gradient)</option>
                        <option value="solid">ពណ៌ទោល (Solid)</option>
                        <option value="gold-accent">ស៊ុមទឹកមាស (Gold Accent)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ពណ៌ចាប់ផ្តើមបដា (Banner Start)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={template.headerBgColorStart}
                          onChange={(e) => handleUpdate({ headerBgColorStart: e.target.value })}
                          className="w-8 h-8 p-0.5 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.headerBgColorStart}
                          onChange={(e) => handleUpdate({ headerBgColorStart: e.target.value })}
                          className="w-full text-xs font-mono border border-neutral-300 rounded-md px-2 py-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ពណ៌បញ្ចប់បដា (Banner End)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={template.headerBgColorEnd}
                          onChange={(e) => handleUpdate({ headerBgColorEnd: e.target.value })}
                          className="w-8 h-8 p-0.5 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.headerBgColorEnd}
                          onChange={(e) => handleUpdate({ headerBgColorEnd: e.target.value })}
                          className="w-full text-xs font-mono border border-neutral-300 rounded-md px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Layout */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទីតាំងរូបសញ្ញា Logo
                      </label>
                      <select
                        value={template.logoPosition}
                        onChange={(e) => handleUpdate({ logoPosition: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="left">ខាងឆ្វេង (ស្តង់ដារ)</option>
                        <option value="center">កណ្តាលខាងលើ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទំហំ Logo
                      </label>
                      <select
                        value={template.logoSize}
                        onChange={(e) => handleUpdate({ logoSize: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="small">តូច (30px)</option>
                        <option value="medium">មធ្យម (38px)</option>
                        <option value="large">ធំ (46px)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Individual Header Words Positioning */}
                <div className="space-y-4 pt-4 border-t border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Move className="w-4 h-4 text-blue-600" />
                        <span>រំកិលទីតាំងពាក្យនីមួយៗនៅក្បាលប័ណ្ណ (Move Individual Header Words & Year)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        កំណត់គម្លាតរំកិលឆ្វេង-ស្តាំ (X) និងលើ-ក្រោម (Y) ដាច់ដោយឡែកពីគ្នាសម្រាប់ពាក្យនីមួយៗ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          headerKingdomOffsetX: 0,
                          headerKingdomOffsetY: 0,
                          headerMottoOffsetX: 0,
                          headerMottoOffsetY: 0,
                          headerMinistryOffsetX: 0,
                          headerMinistryOffsetY: 0,
                          headerDepartmentOffsetX: 0,
                          headerDepartmentOffsetY: 0,
                          headerSchoolNameOffsetX: 0,
                          headerSchoolNameOffsetY: 0,
                          subtitleOffsetX: 0,
                          subtitleOffsetY: 0,
                        })
                      }
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-300 font-medium cursor-pointer"
                    >
                      ↺ កំណត់ដើមទាំងអស់
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Word 1: ព្រះរាជាណាចក្រកម្ពុជា */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800">👑 «ព្រះរាជាណាចក្រកម្ពុជា»</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('headerKingdom')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerKingdomOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerKingdomOffsetX || 0}
                            onChange={(e) => handleUpdate({ headerKingdomOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerKingdomOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.headerKingdomOffsetY || 0}
                            onChange={(e) => handleUpdate({ headerKingdomOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/80">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700 font-medium">ទំហំអក្សរ (Font Size)៖</span>
                          <span className="font-mono font-bold text-sky-700">{(template.headerKingdomFontSize || 8.8).toFixed(1)} px</span>
                        </div>
                        <input
                          type="range"
                          min="5.0"
                          max="22.0"
                          step="0.2"
                          value={template.headerKingdomFontSize || 8.8}
                          onChange={(e) => handleUpdate({ headerKingdomFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-sky-600"
                        />
                      </div>
                    </div>

                    {/* Word 2: ជាតិ សាសនា ព្រះមហាក្សត្រ */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800">🇰🇭 «ជាតិ សាសនា ព្រះមហាក្សត្រ»</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('headerMotto')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerMottoOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerMottoOffsetX || 0}
                            onChange={(e) => handleUpdate({ headerMottoOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerMottoOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.headerMottoOffsetY || 0}
                            onChange={(e) => handleUpdate({ headerMottoOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/80">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700 font-medium">ទំហំអក្សរ (Font Size)៖</span>
                          <span className="font-mono font-bold text-amber-700">{(template.headerMottoFontSize || 7.6).toFixed(1)} px</span>
                        </div>
                        <input
                          type="range"
                          min="4.5"
                          max="20.0"
                          step="0.2"
                          value={template.headerMottoFontSize || 7.6}
                          onChange={(e) => handleUpdate({ headerMottoFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-amber-600"
                        />
                      </div>
                    </div>

                    {/* Word 3: ក្រសួងអប់រំ យុវជន និងកីឡា */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800">🏢 «ក្រសួងអប់រំ យុវជន និងកីឡា»</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('headerMinistry')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerMinistryOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerMinistryOffsetX || 0}
                            onChange={(e) => handleUpdate({ headerMinistryOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerMinistryOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.headerMinistryOffsetY || 0}
                            onChange={(e) => handleUpdate({ headerMinistryOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/80">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700 font-medium">ទំហំអក្សរក្រសួង (Font Size)៖</span>
                          <span className="font-mono font-bold text-blue-700">{(template.headerMinistryFontSize || 7.5).toFixed(1)} px</span>
                        </div>
                        <input
                          type="range"
                          min="5.0"
                          max="20.0"
                          step="0.2"
                          value={template.headerMinistryFontSize || 7.5}
                          onChange={(e) => handleUpdate({ headerMinistryFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    {/* Word 4: មន្ទីរអប់រំ... */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800">🏬 «មន្ទីរអប់រំ យុវជន និងកីឡា...»</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('headerDepartment')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerDepartmentOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerDepartmentOffsetX || 0}
                            onChange={(e) => handleUpdate({ headerDepartmentOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerDepartmentOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.headerDepartmentOffsetY || 0}
                            onChange={(e) => handleUpdate({ headerDepartmentOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/80">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700 font-medium">ទំហំអក្សរមន្ទីរ (Font Size)៖</span>
                          <span className="font-mono font-bold text-blue-600">{(template.headerDepartmentFontSize || 7.0).toFixed(1)} px</span>
                        </div>
                        <input
                          type="range"
                          min="5.0"
                          max="14.0"
                          step="0.2"
                          value={template.headerDepartmentFontSize || 7.0}
                          onChange={(e) => handleUpdate({ headerDepartmentFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        ✓ បង្ហាញលើ ១ បន្ទាត់ជានិច្ច (Single line nowrap មិនបាក់ជួរ)
                      </div>
                    </div>

                    {/* Word 5: ឈ្មោះវិទ្យាល័យ */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800">🏫 «ឈ្មោះវិទ្យាល័យ / សាលា»</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('headerSchoolName')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerSchoolNameOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.headerSchoolNameOffsetX || 0}
                            onChange={(e) => handleUpdate({ headerSchoolNameOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.headerSchoolNameOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.headerSchoolNameOffsetY || 0}
                            onChange={(e) => handleUpdate({ headerSchoolNameOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/80">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700 font-medium">ទំហំអក្សរឈ្មោះសាលា (Font Size)៖</span>
                          <span className="font-mono font-bold text-purple-700">{(template.headerSchoolNameFontSize || 8.5).toFixed(1)} px</span>
                        </div>
                        <input
                          type="range"
                          min="5.5"
                          max="24.0"
                          step="0.2"
                          value={template.headerSchoolNameFontSize || 8.5}
                          onChange={(e) => handleUpdate({ headerSchoolNameFontSize: parseFloat(e.target.value) })}
                          className="w-full accent-purple-600"
                        />
                      </div>
                    </div>

                    {/* Word 6: ឆ្នាំសិក្សា ២០២៥-២០២៧ */}
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">📅 «ឆ្នាំសិក្សា ២០២៥-២០២៧» (Subtitle)</span>
                        <button
                          type="button"
                          onClick={() => handleResetElementByName('subtitle')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          កំណត់ដើម (0, 0)
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">ឆ្វេង-ស្តាំ (X):</span>
                            <span className="font-mono font-bold text-blue-600">{template.subtitleOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            step="1"
                            value={template.subtitleOffsetX || 0}
                            onChange={(e) => handleUpdate({ subtitleOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-neutral-600">លើ-ក្រោម (Y):</span>
                            <span className="font-mono font-bold text-blue-600">{template.subtitleOffsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={template.subtitleOffsetY || 0}
                            onChange={(e) => handleUpdate({ subtitleOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: STUDENT FIELDS & LABELS */}
            {/* ======================================================== */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Type className="w-4 h-4 text-blue-600" />
                      គ្រប់គ្រងព័ត៌មានបង្ហាញ និងកែប្រែឈ្មោះស្លាក (Fields & Labels)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      បើក/បិទព័ត៌មានសិស្ស និងកែសម្រួលពាក្យសម្គាល់តាមតម្រូវការ
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSetBilingualLabels}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                    >
                      Bilingual (ខ្មែរ+អង់គ្លេស)
                    </button>
                    <button
                      type="button"
                      onClick={handleSetKhmerOnlyLabels}
                      className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-md transition-colors"
                    >
                      ខ្មែរសុទ្ធ
                    </button>
                  </div>
                </div>

                  {/* Prominent Student Info Font Size & Typography Control */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        A±
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">
                          ពង្រីក / សារេព័ត៌មានសិស្សឱ្យពេញកាត (Student Info Sizing & Layout)
                        </h4>
                        <p className="text-[10px] text-neutral-500">
                          សារេទំហំអក្សរ គម្លាតជួរ និងពង្រីកឱ្យពេញលំហកាតបានយ៉ាងងាយស្រួល
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded-lg shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdate({ infoFontSize: Math.max(6.5, Number(((template.infoFontSize || 10) - 0.5).toFixed(1))) })}
                        className="w-6 h-6 flex items-center justify-center rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer"
                        title="បន្ថយទំហំអក្សរ (-0.5px)"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-blue-700 min-w-[46px] text-center text-xs">
                        {template.infoFontSize || 10} px
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdate({ infoFontSize: Math.min(18.0, Number(((template.infoFontSize || 10) + 0.5).toFixed(1))) })}
                        className="w-6 h-6 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        title="ពង្រីកទំហំអក្សរ (+0.5px)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Expand to Full Card Feature */}
                  <div className="p-2.5 bg-white border border-blue-300 rounded-lg flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <span>✨ ពង្រីកព័ត៌មានឱ្យពេញកាតស្វ័យប្រវត្ត (Auto-Fit Full Card)</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        ពង្រីកអក្សរ និងចន្លោះគម្លាតជួរឱ្យពេញលំហកាតស្អាតសមល្មម មិនទទេ
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate({
                            infoFontSize: 11.5,
                            infoGapY: 4.8,
                            infoLineSpacing: 1.45,
                            infoScale: 1.05,
                            expandInfoToFullCard: true,
                          });
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          template.expandInfoToFullCard
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        {template.expandInfoToFullCard ? '✓ បានពង្រីកពេញ' : 'ពង្រីកពេញកាត'}
                      </button>
                      {template.expandInfoToFullCard && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdate({
                              infoFontSize: 10,
                              infoGapY: 3.2,
                              infoLineSpacing: 1.38,
                              infoScale: 1.0,
                              expandInfoToFullCard: false,
                            });
                          }}
                          className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 cursor-pointer"
                          title="កំណត់ទំហំធម្មតាវិញ"
                        >
                          ធម្មតា
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Range Slider for Font Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-600 font-medium">
                      <span>ទំហំអក្សរ (Font Size):</span>
                      <span className="font-mono text-blue-700 font-bold">{template.infoFontSize || 10} px</span>
                    </div>
                    <input
                      type="range"
                      min="7.0"
                      max="16.0"
                      step="0.2"
                      value={template.infoFontSize || 10}
                      onChange={(e) => handleUpdate({ infoFontSize: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 h-2 bg-blue-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-neutral-600 mr-1">ទំហំគំរូ៖</span>
                    {[
                      { size: 8.5, label: 'ស្តង់ដារ (8.5px)' },
                      { size: 9.5, label: 'មធ្យម (9.5px)' },
                      { size: 10.5, label: 'ធំល្មម (10.5px)' },
                      { size: 11.5, label: 'ធំពេញកាត (11.5px)' },
                      { size: 12.5, label: 'ធំច្បាស់ (12.5px)' },
                      { size: 14.0, label: 'ធំពិសេស (14px)' },
                    ].map((item) => (
                      <button
                        key={item.size}
                        type="button"
                        onClick={() => handleUpdate({ infoFontSize: item.size })}
                        className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                          Math.abs((template.infoFontSize || 10) - item.size) < 0.05
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Advanced Spacing Sliders (Row Gap & Scale) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-neutral-700">
                        <span className="font-medium">គម្លាតចន្លោះជួរ (Row Gap):</span>
                        <span className="font-mono font-bold text-blue-600">
                          {template.infoGapY ?? 3.2} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={template.infoGapY ?? 3.2}
                        onChange={(e) => handleUpdate({ infoGapY: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600 h-1.5 bg-blue-200 rounded cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                        <span>ជិតគ្នា (1px)</span>
                        <span>ឃ្លាតល្មម (4px)</span>
                        <span>ពេញកាត (8px)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 text-neutral-700">
                        <span className="font-medium">ពង្រីកសរុប (Overall Zoom):</span>
                        <span className="font-mono font-bold text-blue-600">
                          {Math.round((template.infoScale || 1.0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.0"
                        step="0.05"
                        value={template.infoScale || 1.0}
                        onChange={(e) => handleUpdate({ infoScale: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600 h-1.5 bg-blue-200 rounded cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                        <span>60%</span>
                        <span>100%</span>
                        <span>200% (ធំខ្លាំង)</span>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Option to combine DOB and POB or Full-Width POB */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-900">
                      <input
                        type="checkbox"
                        checked={Boolean(template.combineDobPob)}
                        onChange={(e) => handleUpdate({ combineDobPob: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <span>ដាក់ថ្ងៃខែឆ្នាំកំណើត និងទីកន្លែងកំណើត ក្នុងបន្ទាត់តែមួយ (Combine DOB & POB)</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      សន្សំកន្លែង
                    </span>
                  </div>

                  {Boolean(template.combineDobPob) ? (
                    <div className="space-y-1.5 pt-1 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-600 shrink-0">ស្លាកបង្ហាញ៖</span>
                        <input
                          type="text"
                          value={template.labelDobPob || 'ថ្ងៃខែឆ្នាំកំណើត'}
                          onChange={(e) => handleUpdate({ labelDobPob: e.target.value })}
                          placeholder="ថ្ងៃខែឆ្នាំកំណើត"
                          className="flex-1 text-xs border border-neutral-300 rounded px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-neutral-500">គំរូស្លាក៖</span>
                        {[
                          'ថ្ងៃខែឆ្នាំកំណើត',
                          'ថ្ងៃខែ-ទីកន្លែងកំណើត',
                          'ថ្ងៃខែឆ្នាំ និងទីកន្លែងកំណើត',
                        ].map((txt) => (
                          <button
                            key={txt}
                            type="button"
                            onClick={() => handleUpdate({ labelDobPob: txt })}
                            className={`px-2 py-0.5 rounded border transition-colors ${
                              (template.labelDobPob || 'ថ្ងៃខែឆ្នាំកំណើត') === txt
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* POB Standalone Full-Width Options */
                    <div className="pt-1.5 border-t border-emerald-200/70 space-y-2">
                      <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                        <span>ទម្រង់បង្ហាញ «ទីកន្លែងកំណើត» (POB Display Mode)៖</span>
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-semibold px-2 py-0.5 rounded">
                          {template.pobPlacement !== 'inline' ? 'លាតសន្ធឹងពេញទទឹងកាត' : 'ក្នុងប្រឡោះព័ត៌មាន'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdate({ pobPlacement: 'full-width', pobSingleLine: true })}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            template.pobPlacement !== 'inline'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                              : 'bg-white text-neutral-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <span>↔️ លាតសន្ធឹងពេញទទឹងកាត</span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${template.pobPlacement !== 'inline' ? 'text-emerald-100' : 'text-neutral-500'}`}>
                            ដាក់ក្រោមរូបថត លាតសន្ធឹងបានវែងអតិបរមា
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdate({ pobPlacement: 'inline' })}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            template.pobPlacement === 'inline'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                              : 'bg-white text-neutral-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <span>📋 ក្នុងជួរព័ត៌មានក្បែររូប</span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${template.pobPlacement === 'inline' ? 'text-emerald-100' : 'text-neutral-500'}`}>
                            ស្ថិតក្នុងជួរទូទៅជាមួយ ឈ្មោះ ភេទ ថ្នាក់...
                          </p>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-emerald-900">
                          <input
                            type="checkbox"
                            checked={template.pobSingleLine !== false}
                            onChange={(e) => handleUpdate({ pobSingleLine: e.target.checked })}
                            className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600"
                          />
                          <span>រក្សាទុកតែមួយជួរ (Single line មិនបាក់ជួរ)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Field List Configuration */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {[
                    {
                      key: 'showStudentId',
                      labelKey: 'labelStudentId',
                      name: 'អត្តលេខសិស្ស (Student ID)',
                      defaultLabel: 'អត្តលេខ ID',
                    },
                    {
                      key: 'showFullName',
                      labelKey: 'labelFullName',
                      name: 'គោត្តនាម-នាម (Full Name)',
                      defaultLabel: 'គោត្តនាម-នាម',
                    },
                    {
                      key: 'showLatinName',
                      labelKey: 'labelLatinName',
                      name: 'ឈ្មោះអក្សរឡាតាំង (Latin Name)',
                      defaultLabel: 'ឈ្មោះឡាតាំង',
                    },
                    {
                      key: 'showGender',
                      labelKey: 'labelGender',
                      name: 'ភេទ (Gender)',
                      defaultLabel: 'ភេទ',
                    },
                    {
                      key: 'showDob',
                      labelKey: 'labelDob',
                      name: 'ថ្ងៃខែឆ្នាំកំណើត (DOB)',
                      defaultLabel: 'ថ្ងៃខែឆ្នាំកំណើត',
                    },
                    {
                      key: 'showPob',
                      labelKey: 'labelPob',
                      name: 'ទីកន្លែងកំណើត (POB)',
                      defaultLabel: 'ទីកន្លែងកំណើត',
                    },
                    {
                      key: 'showGradeClass',
                      labelKey: 'labelGradeClass',
                      name: 'ថ្នាក់ទី (Grade)',
                      defaultLabel: 'ថ្នាក់ទី',
                    },
                    {
                      key: 'showParents',
                      labelKey: 'labelFather',
                      name: 'ឈ្មោះឪពុក និងម្ដាយ (Parents)',
                      defaultLabel: 'ឈ្មោះឪពុក',
                    },
                    {
                      key: 'showPhone',
                      labelKey: 'labelPhone',
                      name: 'លេខទូរស័ព្ទ (Phone Number)',
                      defaultLabel: 'ទូរស័ព្ទ',
                    },
                    {
                      key: 'showBloodType',
                      labelKey: 'labelBloodType',
                      name: 'ក្រុមឈាម (Blood Group)',
                      defaultLabel: 'ក្រុមឈាម',
                    },
                    {
                      key: 'showExpiryDate',
                      labelKey: 'labelExpiryDate',
                      name: 'កាលបរិច្ឆេទផុតកំណត់ (Expiry Date)',
                      defaultLabel: 'សុពលភាពដល់',
                    },
                  ].map((field) => {
                    const isChecked = (template as any)[field.key];
                    const labelVal = (template as any)[field.labelKey] || field.defaultLabel;

                    return (
                      <div
                        key={field.key}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-colors ${
                          isChecked
                            ? 'border-neutral-200 bg-neutral-50/70'
                            : 'border-neutral-200/60 bg-neutral-100/40 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-neutral-800 shrink-0 w-48">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleUpdate({ [field.key]: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                          />
                          <span>{field.name}</span>
                        </label>

                        {/* Custom Label Input */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] text-neutral-400">ស្លាក៖</span>
                          <input
                            type="text"
                            value={labelVal}
                            disabled={!isChecked}
                            onChange={(e) => handleUpdate({ [field.labelKey]: e.target.value })}
                            className="w-full text-xs border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: PHOTO & QR CODE */}
            {/* ======================================================== */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  កំណត់ទម្រង់រូបថតសិស្ស 3x4 និងកូដ QR
                </h3>

                {/* Photo Dimensions, Scaling & Zoom Controls */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      ទំហំ និងការពង្រីក/បង្រួមរូបថត (Photo Dimensions & Zoom)
                    </h4>
                    <span className="text-[10px] text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                      ស្តង់ដារ 3x4 ឬ ទំហំសេរី
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
                      ទំហំរហ័ស (Quick Size Presets)៖
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '3x4 ស្តង់ដារ (23x31mm)', w: 23, h: 31 },
                        { label: '3x4 វិទ្យាល័យកំរៀង (27x36mm)', w: 27, h: 36 },
                        { label: '3x4 ធំ (28x38mm)', w: 28, h: 38 },
                        { label: '4x6 ស្តង់ដារ (35x45mm)', w: 35, h: 45 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleUpdate({ photoWidthMm: item.w, photoHeightMm: item.h })}
                          className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all ${
                            (template.photoWidthMm || (template.cardLayoutMode === 'kamrieng-official' ? 27 : 23)) === item.w &&
                            (template.photoHeightMm || (template.cardLayoutMode === 'kamrieng-official' ? 36 : 31)) === item.h
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Width */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-neutral-800">ទទឹង (Width):</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="15"
                            max="45"
                            value={template.photoWidthMm || (template.cardLayoutMode === 'kamrieng-official' ? 27 : 23)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) handleUpdate({ photoWidthMm: Math.max(15, Math.min(45, val)) });
                            }}
                            className="w-12 text-right font-mono font-bold text-blue-600 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-white"
                          />
                          <span className="text-[10px] text-neutral-500 font-mono">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="45"
                        step="1"
                        value={template.photoWidthMm || (template.cardLayoutMode === 'kamrieng-official' ? 27 : 23)}
                        onChange={(e) => handleUpdate({ photoWidthMm: parseInt(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>15mm</span>
                        <span>27mm</span>
                        <span>45mm</span>
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-neutral-800">កម្ពស់ (Height):</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="20"
                            max="55"
                            value={template.photoHeightMm || (template.cardLayoutMode === 'kamrieng-official' ? 36 : 31)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) handleUpdate({ photoHeightMm: Math.max(20, Math.min(55, val)) });
                            }}
                            className="w-12 text-right font-mono font-bold text-blue-600 border border-neutral-300 rounded px-1 py-0.5 text-xs bg-white"
                          />
                          <span className="text-[10px] text-neutral-500 font-mono">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="55"
                        step="1"
                        value={template.photoHeightMm || (template.cardLayoutMode === 'kamrieng-official' ? 36 : 31)}
                        onChange={(e) => handleUpdate({ photoHeightMm: parseInt(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>20mm</span>
                        <span>36mm</span>
                        <span>55mm</span>
                      </div>
                    </div>

                    {/* Zoom */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-neutral-800">ពង្រីក/បង្រួម (Zoom):</span>
                        <span className="font-mono font-bold text-blue-600">
                          {Math.round((template.photoZoom || 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="3.5"
                        step="0.05"
                        value={template.photoZoom || 1}
                        onChange={(e) => handleUpdate({ photoZoom: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>40%</span>
                        <span>100%</span>
                        <span>350% (ធំខ្លាំង)</span>
                      </div>
                    </div>
                  </div>

                  {/* Zoom presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-neutral-600 font-medium">Zoom រហ័ស៖</span>
                    {[0.8, 1.0, 1.25, 1.5, 2.0, 2.5].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => handleUpdate({ photoZoom: z })}
                        className={`px-2 py-0.5 text-[10px] rounded border font-mono ${
                          (template.photoZoom || 1) === z
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-blue-50'
                        }`}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleUpdate({ photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
                      className="ml-auto px-2 py-0.5 text-[10px] rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                    >
                      កំណត់ដើម (100%)
                    </button>
                  </div>
                </div>

                {/* Photo settings */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទីតាំងរូបថត (Photo Position)
                      </label>
                      <select
                        value={template.photoPosition}
                        onChange={(e) => handleUpdate({ photoPosition: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="right">ខាងស្តាំ (ស្តង់ដារកម្ពុជា)</option>
                        <option value="left">ខាងឆ្វេង</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទម្រង់ជ្រុងរូបថត (Corner Style)
                      </label>
                      <select
                        value={template.photoShape}
                        onChange={(e) => handleUpdate({ photoShape: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="rect-3x4">ជ្រុងកែងស្រួច (3x4 ស្តង់ដារ)</option>
                        <option value="rounded">ជ្រុងមូលស្រាល (Rounded 8px)</option>
                        <option value="oval">រង្វង់មូល (Circular/Oval)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ពណ៌ស៊ុមរូបថត (Photo Border Color)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={template.photoBorderColor || '#9ca3af'}
                          onChange={(e) => handleUpdate({ photoBorderColor: e.target.value })}
                          className="w-8 h-8 p-0.5 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.photoBorderColor || '#9ca3af'}
                          onChange={(e) => handleUpdate({ photoBorderColor: e.target.value })}
                          className="w-full text-xs font-mono border border-neutral-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer w-full text-xs">
                        <input
                          type="checkbox"
                          checked={template.showPhotoBadge}
                          onChange={(e) => handleUpdate({ showPhotoBadge: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                        />
                        <span>បង្ហាញស្លាកសម្គាល់ទំហំ «3x4»</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* QR Code Settings */}
                <div className="pt-4 border-t border-neutral-100 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800">ការកំណត់កូដ QR ផ្ទៀងផ្ទាត់ទិន្នន័យ</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទីតាំងកូដ QR នៅលើកាត
                      </label>
                      <select
                        value={template.qrPosition}
                        onChange={(e) => handleUpdate({ qrPosition: e.target.value as any })}
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="below-photo">នៅពីក្រោមកញ្ចក់រូបថត (ស្តង់ដារ)</option>
                        <option value="bottom-left">នៅជ្រុងខាងឆ្វេងក្រោម</option>
                        <option value="backside-only">បង្ហាញតែនៅខ្នងខាងក្រោយប៉ុណ្ណោះ</option>
                        <option value="hidden">លាក់ QR Code ទាំងស្រុង</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ទំហំ QR Code: <span className="font-mono text-blue-600">{template.qrSize || 48}px</span>
                      </label>
                      <input
                        type="range"
                        min="32"
                        max="60"
                        step="2"
                        value={template.qrSize || 48}
                        onChange={(e) => handleUpdate({ qrSize: parseInt(e.target.value) })}
                        className="w-full accent-blue-600 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: FOOTER, STAMP & SIGNATURES */}
            {/* ======================================================== */}
            {activeTab === 'footer' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  ផ្នែកកាលបរិច្ឆេទ ត្រាក្រហមផ្លូវការ និងហត្ថលេខានាយក
                </h3>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showLunarDate}
                      onChange={(e) => handleUpdate({ showLunarDate: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញកាលបរិច្ឆេទចន្ទគតិ (Lunar Date)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showSolarDate}
                      onChange={(e) => handleUpdate({ showSolarDate: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញកាលបរិច្ឆេទសុរិយគតិ (Solar Date)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showStamp}
                      onChange={(e) => handleUpdate({ showStamp: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញត្រាក្រហមផ្លូវការ (Official Red Stamp)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showSignature}
                      onChange={(e) => handleUpdate({ showSignature: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញហត្ថលេខានាយក (Signature)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showFooterContact}
                      onChange={(e) => handleUpdate({ showFooterContact: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>បង្ហាញលេខទំនាក់ទំនងខាងក្រោម</span>
                  </label>
                </div>

                {/* Stamp Size, Angle & Opacity */}
                <div className="pt-3 border-t border-neutral-100 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800">
                      ការកំណត់ត្រាក្រហមផ្លូវការ (Official Red Stamp Settings)
                    </h4>
                    <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                      គាំទ្រទំហំធំរហូតដល់ 180px
                    </span>
                  </div>

                  {/* Stamp Visibility Buttons (បង្ហាញត្រាក៏បាន អត់បង្ហាញក៏បាន) */}
                  <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                      <span>ស្ថានភាពត្រាលើប័ណ្ណ (បង្ហាញត្រាក៏បាន អត់បង្ហាញក៏បាន)៖</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        template.showStamp !== false
                          ? 'bg-rose-600 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {template.showStamp !== false ? 'កំពុងបង្ហាញ' : 'កំពុងលាក់'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleUpdate({ showStamp: true })}
                        className={`p-2.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          template.showStamp !== false
                            ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                            : 'bg-white border-rose-200 text-neutral-700 hover:bg-rose-100/60'
                        }`}
                      >
                        <span>🔴</span>
                        <span>បង្ហាញត្រា (Show Stamp)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate({ showStamp: false })}
                        className={`p-2.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          template.showStamp === false
                            ? 'bg-neutral-800 text-white border-neutral-800 font-bold shadow-xs'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span>⚪</span>
                        <span>អត់បង្ហាញត្រា (Hide Stamp)</span>
                      </button>
                    </div>
                  </div>

                  {/* Stamp Size with Presets */}
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-800">
                      <span>ទំហំត្រាក្រហម (Stamp Size)៖</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="20"
                          max="350"
                          value={template.stampSize || 52}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) handleUpdate({ stampSize: Math.max(20, Math.min(350, val)) });
                          }}
                          className="w-14 text-right font-mono font-bold text-rose-600 border border-neutral-300 rounded px-1.5 py-0.5 text-xs bg-white"
                        />
                        <span className="text-[10px] text-neutral-500 font-mono">px</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="30"
                      max="300"
                      step="2"
                      value={template.stampSize || 52}
                      onChange={(e) => handleUpdate({ stampSize: parseInt(e.target.value) })}
                      className="w-full accent-rose-600"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        { label: 'តូច 50px', size: 50 },
                        { label: 'ស្តង់ដារ 70px', size: 70 },
                        { label: 'មធ្យម 95px', size: 95 },
                        { label: 'ធំ 120px', size: 120 },
                        { label: 'ធំផ្លូវការ 150px', size: 150 },
                        { label: 'ធំខ្លាំង 190px', size: 190 },
                        { label: 'ធំបំផុត 240px', size: 240 },
                        { label: 'យក្ស 300px', size: 300 },
                      ].map((item) => (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => handleUpdate({ stampSize: item.size })}
                          className={`px-2 py-0.5 text-[10.5px] rounded border font-medium transition-all ${
                            (template.stampSize || 52) === item.size
                              ? 'bg-rose-600 text-white border-rose-600 font-bold'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-rose-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 mb-1">
                        <span>មុំបង្វិលត្រាក្រហម (Stamp Angle)</span>
                        <span className="font-mono text-neutral-500">{template.stampRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="1"
                        value={template.stampRotation}
                        onChange={(e) => handleUpdate({ stampRotation: parseInt(e.target.value) })}
                        className="w-full accent-rose-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 mb-1">
                        <span>កម្រិតដិតច្បាស់នៃត្រា (Stamp Opacity)</span>
                        <span className="font-mono text-neutral-500">
                          {Math.round(template.stampOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={template.stampOpacity}
                        onChange={(e) => handleUpdate({ stampOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-rose-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Positioning & Sizing in Footer Tab */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>ការកំណត់ទីតាំង និងទំហំថ្ងៃខែ (Date Positioning & Size)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      X: {template.dateOffsetX || 0}px | Y: {template.dateOffsetY || 0}px
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឆ្វេង-ស្តាំ (X)៖</span>
                        <span className="font-mono font-bold text-emerald-700">{template.dateOffsetX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        step="1"
                        value={template.dateOffsetX || 0}
                        onChange={(e) => handleUpdate({ dateOffsetX: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឡើង-ចុះ (Y)៖</span>
                        <span className="font-mono font-bold text-emerald-700">{template.dateOffsetY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={template.dateOffsetY || 0}
                        onChange={(e) => handleUpdate({ dateOffsetY: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">ទំហំអក្សរថ្ងៃខែ៖</span>
                        <span className="font-mono font-bold text-emerald-700">{(template.dateFontSize || 6.4).toFixed(1)}px</span>
                      </div>
                      <input
                        type="range"
                        min="4.5"
                        max="10"
                        step="0.2"
                        value={template.dateFontSize || 6.4}
                        onChange={(e) => handleUpdate({ dateFontSize: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Principal Title (នាយកវិទ្យាល័យ) in Footer Tab */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>ការកំណត់តួនាទីនាយក (នាយកវិទ្យាល័យ) និងរំទីតាំង (Title Position)</span>
                    </h4>
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                      X: {template.principalTitleOffsetX || 0}px | Y: {template.principalTitleOffsetY || 0}px
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      តួនាទីអ្នកចុះហត្ថលេខា (Principal Title Text)៖
                    </label>
                    <input
                      type="text"
                      value={template.principalTitleText !== undefined && template.principalTitleText !== '' ? template.principalTitleText : (school.principal_title || 'នាយកវិទ្យាល័យ')}
                      onChange={(e) => handleUpdate({ principalTitleText: e.target.value })}
                      placeholder="ឧ. នាយកវិទ្យាល័យ"
                      className="w-full text-xs font-muol border border-neutral-300 rounded px-3 py-1.5 bg-white text-neutral-800 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['នាយកវិទ្យាល័យ', 'នាយកសាលា', 'នាយិកាវិទ្យាល័យ', 'ចាងហ្វាងសិក្សា', 'ប្រធានការិយាល័យ'].map((titlePreset) => (
                        <button
                          key={titlePreset}
                          type="button"
                          onClick={() => handleUpdate({ principalTitleText: titlePreset })}
                          className={`px-2 py-0.5 text-[10.5px] rounded border transition-colors cursor-pointer ${
                            (template.principalTitleText || school.principal_title || 'នាយកវិទ្យាល័យ') === titlePreset
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          {titlePreset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឆ្វេង-ស្តាំ (X)៖</span>
                        <span className="font-mono font-bold text-indigo-700">{template.principalTitleOffsetX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        step="1"
                        value={template.principalTitleOffsetX || 0}
                        onChange={(e) => handleUpdate({ principalTitleOffsetX: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឡើង-ចុះ (Y)៖</span>
                        <span className="font-mono font-bold text-indigo-700">{template.principalTitleOffsetY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={template.principalTitleOffsetY || 0}
                        onChange={(e) => handleUpdate({ principalTitleOffsetY: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">ទំហំអក្សរតួនាទី៖</span>
                        <span className="font-mono font-bold text-indigo-700">{(template.principalTitleFontSize || 7.3).toFixed(1)}px</span>
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="12.0"
                        step="0.2"
                        value={template.principalTitleFontSize || 7.3}
                        onChange={(e) => handleUpdate({ principalTitleFontSize: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={template.showPrincipalTitle}
                        onChange={(e) => handleUpdate({ showPrincipalTitle: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                      />
                      <span>បង្ហាញតួនាទី (Show Principal Title)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleUpdate({ principalTitleOffsetX: 0, principalTitleOffsetY: 0, principalTitleFontSize: 7.3 })}
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded px-2 py-0.5 bg-white cursor-pointer"
                    >
                      កំណត់ដើម (Reset)
                    </button>
                  </div>
                </div>

                {/* Principal Name (អ៊ុង កងធារ៉ាវុធ) in Footer Tab */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>ការកំណត់ឈ្មោះនាយក (អ៊ុង កងធារ៉ាវុធ) និងទីតាំង</span>
                    </h4>
                    <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono">
                      X: {template.principalNameOffsetX || 0}px | Y: {template.principalNameOffsetY || 0}px
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      ឈ្មោះនាយកវិទ្យាល័យ / សាលា (Principal Full Name)៖
                    </label>
                    <input
                      type="text"
                      value={template.principalNameText !== undefined && template.principalNameText !== '' ? template.principalNameText : (school.principal_name || 'អ៊ុង កងធារ៉ាវុធ')}
                      onChange={(e) => handleUpdate({ principalNameText: e.target.value })}
                      placeholder="ឧ. អ៊ុង កងធារ៉ាវុធ"
                      className="w-full text-xs font-muol border border-neutral-300 rounded px-3 py-1.5 bg-white text-neutral-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឆ្វេង-ស្តាំ (X)៖</span>
                        <span className="font-mono font-bold text-purple-700">{template.principalNameOffsetX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        step="1"
                        value={template.principalNameOffsetX || 0}
                        onChange={(e) => handleUpdate({ principalNameOffsetX: parseInt(e.target.value) })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">រំកិលឡើង-ចុះ (Y)៖</span>
                        <span className="font-mono font-bold text-purple-700">{template.principalNameOffsetY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={template.principalNameOffsetY || 0}
                        onChange={(e) => handleUpdate({ principalNameOffsetY: parseInt(e.target.value) })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-neutral-700 font-medium">ទំហំអក្សរឈ្មោះ៖</span>
                        <span className="font-mono font-bold text-purple-700">{(template.principalNameFontSize || 7.6).toFixed(1)}px</span>
                      </div>
                      <input
                        type="range"
                        min="5.5"
                        max="12"
                        step="0.2"
                        value={template.principalNameFontSize || 7.6}
                        onChange={(e) => handleUpdate({ principalNameFontSize: parseFloat(e.target.value) })}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 7: BACKSIDE OF CARD */}
            {/* ======================================================== */}
            {activeTab === 'backside' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <FlipHorizontal className="w-4 h-4 text-blue-600" />
                    កែសម្រួលព័ត៌មាន និងបទបញ្ជាផ្ទៃក្នុងនៅខ្នងខាងក្រោយ
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreviewBackSide(true)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>មើលខ្នងកាត (Preview Back)</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      ចំណងជើងបទបញ្ជា (Title)
                    </label>
                    <input
                      type="text"
                      value={template.backsideTitle}
                      onChange={(e) => handleUpdate({ backsideTitle: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      ចំណងជើងរងជាភាសាអង់គ្លេស (Subtitle English)
                    </label>
                    <input
                      type="text"
                      value={template.backsideSubtitle}
                      onChange={(e) => handleUpdate({ backsideSubtitle: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-1.5"
                    />
                  </div>

                  {/* Rules list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-neutral-800">
                        បញ្ជីលក្ខខណ្ឌ និងបទបញ្ជាផ្ទៃក្នុង ({template.backsideRules.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRule}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                      >
                        <Plus className="w-3 h-3" />
                        <span>បន្ថែមប្រការ</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {template.backsideRules.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-neutral-500 pt-1.5 shrink-0">
                            {idx + 1}.
                          </span>
                          <textarea
                            value={rule}
                            rows={2}
                            onChange={(e) => handleUpdateRule(idx, e.target.value)}
                            className="w-full text-xs border border-neutral-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(idx)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STICKY LIVE PREVIEW (5 cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          
          {/* Preview Controls Bar */}
          <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Front / Back Switcher */}
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-100">
              <button
                type="button"
                onClick={() => setPreviewBackSide(false)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  !previewBackSide
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ខាងមុខ (Front)
              </button>
              <button
                type="button"
                onClick={() => setPreviewBackSide(true)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  previewBackSide
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ខ្នងក្រោយ (Back)
              </button>
            </div>

            {/* Stamp Visibility Quick Toggle Button */}
            <button
              type="button"
              onClick={() => handleUpdate({ showStamp: template.showStamp === false ? true : false })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                template.showStamp !== false
                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold hover:bg-rose-100 shadow-2xs'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
              }`}
              title={template.showStamp !== false ? 'ចុចដើម្បីលាក់ត្រាលើកាត' : 'ចុចដើម្បីបង្ហាញត្រាលើកាត'}
            >
              <span>{template.showStamp !== false ? '🔴' : '⚪'}</span>
              <span>{template.showStamp !== false ? 'បង្ហាញត្រា' : 'អត់បង្ហាញត្រា'}</span>
            </button>

            {/* Student Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">សិស្សគំរូ៖</span>
              <select
                value={previewStudentIndex}
                onChange={(e) => setPreviewStudentIndex(parseInt(e.target.value))}
                className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white font-medium max-w-[140px] truncate"
              >
                {students.map((st, i) => (
                  <option key={st.id || i} value={i}>
                    {st.full_name} ({st.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Cut Lines & Zoom Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600"
                />
                <span>បន្ទាត់កាត់</span>
              </label>

              {/* Interactive Zoom Controls: up to 250% */}
              <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-1.5 py-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewScale((s) => Math.max(0.5, parseFloat((s - 0.15).toFixed(2))))}
                  className="w-5 h-5 flex items-center justify-center text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded font-bold cursor-pointer transition-colors"
                  title="បង្រួមមើលកាត (-15%)"
                >
                  −
                </button>
                <select
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                  className="text-[11px] border-0 outline-hidden bg-transparent font-mono font-bold text-neutral-800 cursor-pointer"
                >
                  <option value="0.6">60%</option>
                  <option value="0.75">75%</option>
                  <option value="0.85">85%</option>
                  <option value="1">100%</option>
                  <option value="1.15">115%</option>
                  <option value="1.3">130%</option>
                  <option value="1.5">150% (ធំ)</option>
                  <option value="1.75">175% (ធំ)</option>
                  <option value="2">200% (ធំខ្លាំង)</option>
                  <option value="2.5">250% (អតិបរមា)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPreviewScale((s) => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
                  className="w-5 h-5 flex items-center justify-center text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded font-bold cursor-pointer transition-colors"
                  title="ពង្រីកមើលកាត (+15%)"
                >
                  +
                </button>
                {previewScale !== 1 && (
                  <button
                    type="button"
                    onClick={() => setPreviewScale(1)}
                    className="ml-0.5 text-[10px] text-blue-600 hover:underline px-1 py-0.5 font-bold cursor-pointer"
                    title="កំណត់ទៅ 100%"
                  >
                    100%
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Card Canvas Container */}
          <div className="bg-neutral-200/80 border border-neutral-300 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[480px] overflow-auto shadow-inner relative">
            
            {/* Interactive Selector Guide Banner */}
            <div className="mb-3 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-neutral-300 text-[11px] text-neutral-700 flex items-center gap-2 shadow-xs">
              <Crosshair className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>
                {activeTab === 'positioning' ? (
                  <span>
                    ធាតុសកម្ម៖ <strong className="text-blue-700 uppercase">{selectedElement}</strong> (ចុចលើរូបថត, ត្រា, Info, Logo លើកាតដើម្បីប្តូរ)
                  </span>
                ) : (
                  <span>ចុចលើធាតុណាមួយលើប័ណ្ណដើម្បីរំកិល & ពង្រីកបង្រួមភ្លាមៗ</span>
                )}
              </span>
            </div>

            {/* Real-time Rendered Card */}
            <div className="border border-neutral-300 rounded-[2px] transition-transform duration-200 bg-white">
              <StudentCard
                student={currentStudent}
                school={school}
                template={template}
                showCutLines={showCutLines}
                borderStyle="dashed"
                showBackSide={previewBackSide}
                scale={previewScale}
                activeHighlightElement={activeTab === 'presets' ? null : selectedElement}
                onSelectElement={(el) => {
                  setSelectedElement(el);
                  if (el === 'card') {
                    setActiveTab('dimensions');
                  } else if (el === 'photo') {
                    setActiveTab('photo');
                  } else if (el === 'stamp') {
                    setActiveTab('footer');
                  } else if (el === 'title' || el === 'subtitle') {
                    if (activeTab !== 'positioning' && activeTab !== 'title') {
                      setActiveTab('positioning');
                    }
                  } else if (['header', 'headerKingdom', 'headerMotto', 'headerMinistry', 'headerDepartment', 'headerSchoolName'].includes(el)) {
                    if (activeTab !== 'positioning' && activeTab !== 'header') {
                      setActiveTab('positioning');
                    }
                  } else {
                    setActiveTab('positioning');
                  }
                }}
                onNudgeElement={(_el, dx, dy) => handleNudge(dx, dy)}
                onUpdateOffset={handleSetElementOffset}
                onResetElement={handleResetElementByName}
                onUpdateSize={handleUpdateElementSize}
              />
            </div>

            {/* Dimension Badge */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-neutral-600 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-neutral-300 shadow-xs">
              <span className="font-semibold text-neutral-900">ទំហំពិត៖</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {((template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92)) / 10).toFixed(1)} x {((template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128)) / 10).toFixed(1)} cm
              </span>
              <span className="font-mono text-neutral-500">
                ({(template.cardWidthMm || (template.orientation === 'landscape' ? 128 : 92))} x {(template.cardHeightMm || (template.orientation === 'landscape' ? 92 : 128))} mm)
              </span>
              <span>·</span>
              <span>
                {template.orientation === 'landscape'
                  ? 'ប្លង់ផ្តេក (Landscape)'
                  : 'ប្លង់បញ្ឈរ A4 (Portrait)'}
              </span>
              <span>·</span>
              <span>កម្រាស់ជ្រុង {template.cardBorderRadiusMm ?? 3}mm ({((template.cardBorderRadiusMm ?? 3) / 10).toFixed(2)}cm)</span>
            </div>

          </div>

          {/* Tips info box */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <p className="font-semibold">ការអនុវត្តលើការបោះពុម្ព (Print Integration):</p>
              <p className="text-blue-800">
                នៅពេលលោកអ្នកចុច <strong>«រក្សាទុកគំរូ»</strong> រាល់ប័ណ្ណសម្គាល់ខ្លួនទាំងអស់នៅក្នុងផ្ទាំង
                <strong>«បោះពុម្ពប័ណ្ណ»</strong> នឹងប្តូរទៅតាមរចនាបថគំរូថ្មីនេះដោយស្វ័យប្រវត្តិ!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
