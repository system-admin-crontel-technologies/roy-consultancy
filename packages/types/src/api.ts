/** Shared API contract types used by the web and mobile clients. */

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: string[];
  correlationId: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLoginAt: string | null;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  department: { id: string; code: string; name: string } | null;
  manager: { id: string; fullName: string } | null;
  roles: { code: string; name: string }[];
  lastLoginAt: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export interface SessionSummary {
  id: string;
  client: 'WEB' | 'MOBILE' | 'API';
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface AuditLogEntry {
  id: string;
  occurredAt: string;
  actorType: 'USER' | 'SYSTEM';
  actorUserId: string | null;
  actorLabel: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  correlationId: string | null;
  ipAddress: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
}

export interface OrganisationSettings {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  addressLines: string[];
  timezone: string;
  currency: string;
  dateFormat: string;
  financialYearStartMonth: number;
  gstin: string;
  notificationFromName: string;
  notificationReplyTo: string;
  reminderDaysBeforeDue: number[];
}

export interface NumberingSequenceSummary {
  key: string;
  label: string;
  prefix: string;
  padding: number;
  nextValue: number;
  resetPolicy: 'NEVER' | 'CALENDAR_YEAR' | 'FINANCIAL_YEAR';
  periodKey: string | null;
  preview: string;
}

export interface IntegrationSummary {
  key: string;
  name: string;
  category: string;
  provider: string | null;
  status: 'NOT_CONFIGURED' | 'ACTIVE' | 'DISABLED' | 'ERROR';
  config: Record<string, unknown> | null;
  secretRef: string | null;
  lastHealthCheckAt: string | null;
  lastHealthOk: boolean | null;
  lastError: string | null;
}

export interface ServiceCategorySummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isDemo: boolean;
  serviceCount: number;
}

export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'RETIRED';
export type BillingType = 'ONE_TIME' | 'RECURRING' | 'ANNUAL_PACKAGE';

export interface ServicePriceSummary {
  currency: string;
  professionalFeeMinor: number;
  governmentFeeMinor: number;
  thirdPartyChargesMinor: number;
  taxRateBps: number;
  taxConfigRef: string | null;
  governmentFeeIsEstimate: boolean;
  notes: string | null;
}

export interface ChecklistItem {
  key: string;
  label: string;
  required: boolean;
  conditional?: string;
  sensitivity?: 'GENERAL' | 'SENSITIVE';
  notes?: string;
}

export interface TaskTemplateItem {
  key: string;
  title: string;
  role: string;
  dependsOn?: string[];
  targetDays?: number;
  reviewerGate?: boolean;
}

export interface ServiceVersionSummary {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  summary: string | null;
  eligibilityNotes: string | null;
  exclusions: string | null;
  jurisdiction: string | null;
  expectedTurnaroundDays: number | null;
  billingType: BillingType;
  recurrenceMonths: number | null;
  requiredInputs: ChecklistItem[];
  requiredDocuments: ChecklistItem[];
  taskTemplate: TaskTemplateItem[];
  deliverables: { key: string; label: string }[];
  closureCriteria: { key: string; label: string }[];
  publishedAt: string | null;
  price: ServicePriceSummary | null;
  createdAt: string;
}

export interface ServiceSummary {
  id: string;
  code: string;
  name: string;
  status: ServiceStatus;
  shortDescription: string | null;
  category: { id: string; code: string; name: string };
  owner: { id: string; fullName: string } | null;
  reviewCadenceDays: number | null;
  lastVerifiedAt: string | null;
  currentVersion: ServiceVersionSummary | null;
  versionCount: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverview {
  users: { total: number; active: number; invited: number; suspended: number; disabled: number };
  roles: number;
  services: { total: number; active: number; draft: number };
  categories: number;
  integrations: { total: number; active: number; error: number };
  recentAudit: AuditLogEntry[];
  recentAuthEvents: { id: string; type: string; email: string | null; occurredAt: string; ipAddress: string | null }[];
}

export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';

/** Public website contact-form submission. */
export interface WebsiteEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  message: string | null;
  status: EnquiryStatus;
  sourcePage: string | null;
  notes: string | null;
  handledById: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
