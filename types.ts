export enum AuthType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE'
}

export enum UserRole {
  SURVEYOR = 'SURVEYOR',
  DEPT_HEAD = 'DEPT_HEAD'
}

export interface UserPreferences {
  defaultRegion?: string;
  defaultLocationFactor?: number;
  defaultLevelCount?: number;
  defaultUpliftTypes?: string[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  roleType: UserRole; // RBAC integration
  company: string;
  tenantId: string; // Multi-tenancy isolation
  email: string;
  authType: AuthType;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface TeamMemberStats {
  userId: string;
  name: string;
  avatar: string;
  role: string;
  rcasCompleted: number;
  totalFeesGenerated: number;
  lastActive: string;
  status: 'Online' | 'Offline';
}

export interface FloorArea {
  id: string;
  description: string;
  level: string;
  gia: number;
  gfa: number;
}

export interface Anomaly {
  id: string;
  item: string;
  quantity: number;
  rate: number;
  unit: string;
}

export type ExternalCategory = 'Outbuildings' | 'Landscaping' | 'Anomalies';

export interface ExternalItem {
  id: string;
  category: ExternalCategory;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
}

export interface ExternalsAssessment {
  id: string;
  name: string;
  status: string;
  items: ExternalItem[];
  locationName?: string;
  locationFactor?: number;
  baseRate?: number;
  categoryLabel?: string;
  completedSections?: string[];
  fees?: {
    professionalPercent: number;
    localAuthority: number;
  };
}

export interface Adjustment {
  id: string;
  type: string;
  reason: string;
  uplift: number;
}

export interface Block {
  id: string;
  name: string;
  reference: string;
  addressLine?: string;
  town?: string;
  county?: string;
  postcode?: string;
  numberOfUnits?: number;
  status?: string;
  completedSections?: string[];
  
  floors: FloorArea[];
  buildingRate: {
    date: string;
    uniclassRate: string;
    locationName?: string;
    locationFactor: number;
    ratesPerFloor: Record<string, number>;
  };
  adjustments: Adjustment[];
  anomalies: Anomaly[];
  demolitionRate: number;
  fees: {
    professionalPercent: number;
    localAuthority: number;
  };
}

export interface ProjectDocument {
  id: string;
  displayName: string;
  originalFileName: string;
  fileType: string;
  uploadDate: string;
  author: string;
  url?: string;
}

export interface Report {
  id: string;
  name: string;
  reference: string;
  date: string;
  status: 'Staging' | 'Ready';
  type: 'Word' | 'PDF';
  developmentId: string;
  value: number;
  blockCount: number;
  documentCount: number;
  generatedAt?: string;
  isFavourite?: boolean;
  isArchived?: boolean;
}

export interface Template {
  id: string;
  name: string;
  version: string;
  company: string;
  updatedAt: string;
  isFavourite?: boolean;
  isArchived?: boolean;
  previewHtml?: string;
  docBuffer?: ArrayBuffer;
  previewData?: {
    brandColor: string;
    hasLogo: boolean;
    logoPos: 'left' | 'right' | 'center';
    headerTitle: string;
    sections: { title: string; type: 'text' | 'table' | 'chart' }[];
    mergeFields?: string[];
  };
}

export interface Correspondence {
  id: string;
  date: string;
  author: string;
  type: 'Note' | 'Email';
  content: string;
}

export interface Development {
  id: string;
  name: string;
  reference: string;
  description: string;
  thumbnail?: string;
  caseNumber?: string;
  propertyReference?: string;
  addressLine?: string;
  town?: string;
  postcode?: string;
  blocks: Block[];
  externalsAssessment: ExternalsAssessment;
  documents: ProjectDocument[];
  correspondence?: Correspondence[];
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
  isFavourite?: boolean;
  isArchived?: boolean;
  ownerId?: string; // Track creator for analytics
  ownerName?: string;
  ownerRole?: string;
  rcaFee?: number; // Internal fee tracking
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'value';