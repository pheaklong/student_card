export type TemplatePresetId =
  | 'kamrieng-official'
  | 'classic-moeys'
  | 'royal-navy'
  | 'emerald-gold'
  | 'crimson-ruby'
  | 'modern-stem'
  | 'minimal-ivory'
  | 'custom';

export type CardOrientation = 'portrait' | 'landscape';
export type CardBorderType = 'single' | 'double' | 'ornamental' | 'minimal' | 'none';
export type HeaderStyle = 'gradient' | 'solid' | 'gold-accent' | 'minimal';
export type PhotoPosition = 'right' | 'left' | 'bottom-left';
export type PhotoShape = 'rect-3x4' | 'rounded' | 'oval';
export type QrPosition = 'below-photo' | 'bottom-left' | 'top-right' | 'backside-only' | 'hidden';

export interface CardTemplateConfig {
  presetId: TemplatePresetId;
  cardLayoutMode?: 'standard' | 'kamrieng-official';
  orientation: CardOrientation;

  // Colors & Theme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  cardBgColor: string;
  innerBorderType: CardBorderType;
  innerBorderColor: string;
  showWatermark?: boolean;
  watermarkOpacity: number;
  watermarkType?: 'school-logo' | 'moeys-emblem';
  watermarkSize?: number;
  showPhoto?: boolean;

  // Card Dimensions & Custom Size (កំណត់ទំហំកាត)
  cardWidthMm: number;
  cardHeightMm: number;
  cardBorderRadiusMm: number;

  // Header options & Positioning
  showHeader: boolean;
  showRoyalMotto: boolean;
  showMinistry: boolean;
  showDepartment: boolean;
  showSchoolName: boolean;
  headerStyle: HeaderStyle;
  headerBgColorStart: string;
  headerBgColorEnd: string;
  headerTextColor: string;
  headerTitleKhmer: string;
  headerSubtitleKhmer: string;
  headerOffsetY: number;
  headerScale: number;
  // Individual Header Words Positioning (រំកិលពាក្យនីមួយៗនៅក្បាលប័ណ្ណ)
  headerKingdomOffsetX?: number;
  headerKingdomOffsetY?: number;
  headerMottoOffsetX?: number;
  headerMottoOffsetY?: number;
  headerMinistryOffsetX?: number;
  headerMinistryOffsetY?: number;
  headerDepartmentOffsetX?: number;
  headerDepartmentOffsetY?: number;
  headerSchoolNameOffsetX?: number;
  headerSchoolNameOffsetY?: number;
  headerDepartmentFontSize?: number;
  headerMinistryFontSize?: number;
  headerSchoolNameFontSize?: number;
  headerKingdomFontSize?: number;
  headerMottoFontSize?: number;
  headerKingdomKhmer?: string;
  headerMottoKhmer?: string;
  headerDepartmentKhmer?: string;
  headerMinistryKhmer?: string;
  headerSchoolNameKhmer?: string;
  logoPosition: 'left' | 'center';
  logoSize: 'small' | 'medium' | 'large';
  logoOffsetX: number;
  logoOffsetY: number;
  logoScale: number;

  // Title Banner & Text («ប័ណ្ណសម្គាល់ខ្លួនសិស្ស»)
  showTitleBanner?: boolean;
  showTitleBannerBg?: boolean; // បង្ហាញ ឬលាក់ពណ៌ខៀវខាងក្រោយ (Show/hide blue background)
  titleBannerBgColor?: string; // ពណ៌ផ្ទៃខៀវខាងក្រោយ (Custom background color)
  titleBannerBgColorEnd?: string; // ពណ៌ gradient បន្ទាប់
  titleBannerTextColor?: string; // ពណ៌អក្សរ «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស»
  titleFontSize?: number; // ទំហំអក្សរ «ប័ណ្ណសម្គាល់ខ្លួនសិស្ស» (Font size)
  titleOffsetX?: number; // រំកិលអក្សរឆ្វេង-ស្តាំ (Offset X)
  titleOffsetY?: number; // រំកិលអក្សរលើ-ក្រោម (Offset Y)
  showSubtitle?: boolean; // បង្ហាញ ឬលាក់អក្សររង «ឆ្នាំសិក្សា...»
  subtitleFontSize?: number;
  subtitleOffsetX?: number;
  subtitleOffsetY?: number;

  // Layers & Z-Index Ordering (គ្រប់គ្រង Layer មុខ-ក្រោយ)
  stampPositionMode?: 'footer' | 'photo-corner' | 'custom'; // ទីតាំងត្រា៖ នៅបាតកាត ឬបោះលើរូបថត
  photoZIndex?: number; // Layer រូបថត (បើធំជាងត្រា គឺរូបថតនៅពីមុខគេ)
  stampZIndex?: number; // Layer ត្រា (បើធំជាងរូបថត គឺត្រានៅពីលើរូបថត)
  signatureZIndex?: number;
  qrZIndex?: number;
  titleZIndex?: number;
  infoZIndex?: number;
  headerZIndex?: number;
  watermarkZIndex?: number;

  // Field toggles and custom labels & Positioning (អក្សរ Info)
  infoOffsetX: number;
  infoOffsetY: number;
  infoFontSize: number;
  infoLineSpacing: number;
  infoLabelWidth: number;
  infoGapY?: number; // គម្លាតចន្លោះជួរព័ត៌មាន (Gap between rows in px)
  infoScale?: number; // ទំហំពង្រីកព័ត៌មានទាំងមូល (Overall info zoom/scale)
  infoWidthPercent?: number; // ទទឹងព័ត៌មានគិតជា % (Width percentage)
  expandInfoToFullCard?: boolean; // ពង្រីកព័ត៌មានឱ្យពេញកាត (Expand to fill available space)
  infoLayoutMode?: 'full-width' | 'split-columns'; // ទម្រង់ព័ត៌មានលាតពេញកាត (Full Width) ឬចែកជួរឈរ (Split columns)
  infoValueColor?: string; // ពណ៌អក្សរតម្លៃព័ត៌មាន (ឧ. #2563eb ពណ៌ខៀវដូចគំរូវិទ្យាល័យកំរៀង)
  showStudentId: boolean;
  labelStudentId: string;
  showFullName: boolean;
  labelFullName: string;
  showLatinName: boolean;
  labelLatinName: string;
  showGender: boolean;
  labelGender: string;
  showDob: boolean;
  labelDob: string;
  showPob: boolean;
  labelPob: string;
  pobPlacement?: 'inline' | 'full-width'; // ដាក់ទីកន្លែងកំណើតក្នុង info ធម្មតា ឬលាតសន្ធឹងពេញទទឹងកាត (Full Width below grid)
  pobSingleLine?: boolean; // បង្ហាញទីកន្លែងកំណើតតែមួយជួរ (Single line with ellipsis or compact text)
  combineDobPob?: boolean;
  labelDobPob?: string;
  showGradeClass: boolean;
  labelGradeClass: string;
  showParents: boolean;
  labelFather: string;
  labelMother: string;
  showPhone: boolean;
  labelPhone: string;
  showBloodType: boolean;
  labelBloodType: string;
  showExpiryDate: boolean;
  labelExpiryDate: string;

  // Photo & QR Code (រូបភាព & កូដ QR)
  photoPosition: PhotoPosition;
  photoShape: PhotoShape;
  photoBorderColor: string;
  showPhotoBadge: boolean;
  photoOffsetX: number;
  photoOffsetY: number;
  photoWidthMm: number;
  photoHeightMm: number;
  photoZoom: number;
  showQrCode: boolean;
  qrPosition: QrPosition;
  qrSize: number;
  qrOffsetX: number;
  qrOffsetY: number;

  // Footer, Stamp & Signatures (ត្រា, ថ្ងៃខែ & ហត្ថលេខា)
  showFooter: boolean;
  showLunarDate: boolean;
  showSolarDate: boolean;
  dateOffsetX?: number;
  dateOffsetY?: number;
  dateFontSize?: number;
  showPrincipalTitle: boolean;
  principalTitleText: string;
  principalTitleOffsetX?: number;
  principalTitleOffsetY?: number;
  principalTitleFontSize?: number;
  showPrincipalName: boolean;
  principalNameText: string;
  principalNameOffsetX?: number;
  principalNameOffsetY?: number;
  principalNameFontSize?: number;
  principalNameTextColor?: string; // ពណ៌ឈ្មោះនាយក (ឧ. #dc2626 ពណ៌ក្រហម)
  showStamp: boolean;
  stampOpacity: number;
  stampRotation: number;
  stampSize: number;
  stampOffsetX: number;
  stampOffsetY: number;
  showSignature: boolean;
  signatureOffsetX: number;
  signatureOffsetY: number;
  signatureScale: number;
  showFooterContact: boolean;
  footerOffsetY: number;

  // Backside
  backsideTitle: string;
  backsideSubtitle: string;
  backsideRules: string[];
  showBacksideRules: boolean;
  showBacksideContact: boolean;
  showBacksideQr: boolean;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  academic_year: string;
  department_name: string;
  ministry_name: string;
  contact_number: string;
  principal_name: string;
  signature_url: string;
  logo_url: string;
  stamp_url?: string;
  issue_date_lunar: string;
  issue_date_solar: string;
  card_title?: string;
  principal_title?: string;
  school_address?: string;
  qr_base_url?: string;
  template_config?: CardTemplateConfig;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  latin_name?: string;
  gender: 'ប្រុស' | 'ស្រី' | string;
  dob: string;
  pob: string;
  grade: string;
  class_number: string;
  father_name: string;
  mother_name: string;
  photo_url: string;
  qr_code_data: string;
  phone_number?: string;
  student_phone?: string;
  parent_phone?: string;
  blood_type?: string;
  expiry_date?: string;
  created_at?: string;
}

export type PaperSize =
  | 'a4-portrait'
  | 'a4-landscape'
  | 'a3-portrait'
  | 'a3-landscape'
  | 'letter'
  | 'card-direct';

export type PrintScaleMode = 'true-size-100' | 'fit-grid';

export type CardGridMode = 'true-size-auto' | '6-per-page' | '8-per-page';

export interface PrintOptions {
  scaleMode: PrintScaleMode;
  paperSize: PaperSize;
  gridMode: CardGridMode;
  showCutLines: boolean;
  showCropMarks: boolean;
  showBackSide: boolean;
  showStamp?: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  scale: number;
  gapMm?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type DataSourceMode = 'supabase' | 'local';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'staff';
  createdAt?: string;
}

export type PvcCardStandard = 'cr80-portrait' | 'cr80-landscape' | 'cr79' | 'cr100' | 'custom';
export type PvcPrinterTrayType = 'direct-single' | 'epson-2card-tray';

export interface PvcPrintOptions {
  cardStandard: PvcCardStandard;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
  printerTrayType: PvcPrinterTrayType;
  sideMode: 'front-only' | 'back-only' | 'duplex';
  offsetX: number; // Calibration fine-tune mm
  offsetY: number; // Calibration fine-tune mm
  scale: number;
  showStamp?: boolean;
}
