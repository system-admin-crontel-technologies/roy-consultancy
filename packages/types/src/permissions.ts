/**
 * Action-based permission catalogue (SRS section 4).
 * Codes are `<module>.<action>`; roles are starting templates mapped onto these.
 * Keep this list the single source of truth: the API seeds it and guards on it,
 * the web app uses it to decide what to render.
 */
export const PERMISSIONS = {
  // Module 1 / 13: identity, access, administration
  'users.read': 'View users',
  'users.manage': 'Invite, update, suspend and disable users',
  'roles.read': 'View roles and permissions',
  'roles.manage': 'Create roles and change permission grants',
  'sessions.revoke_any': 'Revoke sessions of other users',
  'settings.read': 'View organisation settings',
  'settings.manage': 'Change organisation settings and numbering sequences',
  'audit.read': 'Search the audit log',
  'integrations.read': 'View integration status',
  'integrations.manage': 'Configure integrations',
  // Module 4: catalogue
  'catalogue.read': 'View service catalogue',
  'catalogue.manage': 'Create and version services, categories and prices',
  // Module 2: CRM
  'leads.read': 'View leads',
  'leads.manage': 'Create and update leads',
  'clients.read': 'View clients',
  'clients.create': 'Create clients',
  'clients.update': 'Update clients',
  'clients.merge': 'Merge duplicate clients',
  // Module 3: entities
  'entities.read': 'View business entities',
  'entities.manage': 'Create and update business entities',
  'entities.identifiers.read': 'View unmasked entity identifiers',
  // Module 5: quotations and orders
  'quotations.read': 'View quotations',
  'quotations.manage': 'Create, revise and send quotations',
  'quotations.discount.approve': 'Approve non-standard discounts',
  'orders.convert': 'Convert accepted quotations to orders and cases',
  // Module 6: cases and tasks
  'cases.read': 'View cases',
  'cases.create': 'Create cases manually',
  'cases.assign': 'Assign owners and reviewers',
  'cases.transition': 'Move cases between statuses',
  'cases.reopen': 'Reopen completed cases',
  'cases.bulk': 'Run bulk case actions',
  'tasks.read': 'View tasks',
  'tasks.manage': 'Create, reassign and complete tasks',
  // Module 7: documents
  'documents.read': 'View document metadata',
  'documents.upload': 'Upload documents',
  'documents.review': 'Accept or reject documents',
  'documents.download': 'Download general documents',
  'documents.sensitive.read': 'Access identity and other sensitive documents',
  // Module 8: compliance
  'obligations.read': 'View compliance obligations',
  'obligations.manage': 'Create and update obligations and filing records',
  'compliance_rules.manage': 'Create and verify compliance rules',
  // Module 9: finance
  'invoices.read': 'View invoices',
  'invoices.issue': 'Issue invoices',
  'invoices.adjust': 'Issue credit notes and adjustments',
  'payments.record': 'Record payments',
  'payments.allocate': 'Allocate payments to invoices',
  'refunds.request': 'Request refunds',
  'refunds.approve': 'Approve refunds',
  'expenses.manage': 'Record expenses',
  // Module 10: communications
  'communications.send': 'Send client communications',
  'templates.manage': 'Manage notification templates',
  // Module 11: approvals
  'approvals.decide': 'Approve or reject maker-checker items',
  // Module 12: reports
  'reports.operations.read': 'View operations dashboard',
  'reports.sales.read': 'View sales dashboard',
  'reports.finance.read': 'View finance dashboard',
  'reports.compliance.read': 'View compliance dashboard',
  // Module 15: knowledge base
  'knowledge.read': 'Read SOPs and templates',
  'knowledge.manage': 'Author and approve SOPs and templates',
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionCode[];

export function permissionModule(code: PermissionCode): string {
  return code.split('.')[0]!;
}

export const ROLE_CODES = [
  'SUPER_ADMIN',
  'BUSINESS_OWNER',
  'OPERATIONS_MANAGER',
  'SALES_EXECUTIVE',
  'COMPLIANCE_EXECUTIVE',
  'REVIEWER',
  'FINANCE_EXECUTIVE',
  'CLIENT_REPRESENTATIVE',
  'AUDITOR',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export interface RoleTemplate {
  code: RoleCode;
  name: string;
  description: string;
  permissions: PermissionCode[] | 'ALL';
}

const readAllReports: PermissionCode[] = [
  'reports.operations.read',
  'reports.sales.read',
  'reports.finance.read',
  'reports.compliance.read',
];

/** Default role templates from SRS section 4. Super Admin gets every permission. */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'System configuration, user and role administration, integrations, audit and operational settings.',
    permissions: 'ALL',
  },
  {
    code: 'BUSINESS_OWNER',
    name: 'Business Owner',
    description: 'Business-wide operations, finance overview, approvals, service catalogue and reports.',
    permissions: [
      'users.read', 'roles.read', 'settings.read', 'audit.read', 'integrations.read',
      'catalogue.read', 'catalogue.manage',
      'leads.read', 'leads.manage', 'clients.read', 'clients.create', 'clients.update', 'clients.merge',
      'entities.read', 'entities.manage', 'entities.identifiers.read',
      'quotations.read', 'quotations.manage', 'quotations.discount.approve', 'orders.convert',
      'cases.read', 'cases.create', 'cases.assign', 'cases.transition', 'cases.reopen', 'cases.bulk',
      'tasks.read', 'tasks.manage',
      'documents.read', 'documents.upload', 'documents.review', 'documents.download', 'documents.sensitive.read',
      'obligations.read', 'obligations.manage', 'compliance_rules.manage',
      'invoices.read', 'invoices.issue', 'invoices.adjust', 'payments.record', 'payments.allocate',
      'refunds.request', 'refunds.approve', 'expenses.manage',
      'communications.send', 'templates.manage', 'approvals.decide',
      ...readAllReports, 'knowledge.read', 'knowledge.manage',
    ],
  },
  {
    code: 'OPERATIONS_MANAGER',
    name: 'Operations Manager',
    description: 'Case allocation, task queues, deadlines, escalations and quality review.',
    permissions: [
      'users.read', 'catalogue.read', 'clients.read', 'entities.read',
      'quotations.read', 'orders.convert',
      'cases.read', 'cases.create', 'cases.assign', 'cases.transition', 'cases.reopen', 'cases.bulk',
      'tasks.read', 'tasks.manage',
      'documents.read', 'documents.upload', 'documents.review', 'documents.download',
      'obligations.read', 'obligations.manage',
      'communications.send', 'approvals.decide',
      'reports.operations.read', 'reports.compliance.read', 'knowledge.read',
    ],
  },
  {
    code: 'SALES_EXECUTIVE',
    name: 'Sales Executive',
    description: 'Leads, follow-ups, quotations and assigned client details.',
    permissions: [
      'catalogue.read', 'leads.read', 'leads.manage', 'clients.read', 'clients.create', 'clients.update',
      'entities.read', 'quotations.read', 'quotations.manage', 'communications.send',
      'reports.sales.read', 'knowledge.read',
    ],
  },
  {
    code: 'COMPLIANCE_EXECUTIVE',
    name: 'Compliance Executive',
    description: 'Assigned cases, checklists, documents, filing tracking and client updates.',
    permissions: [
      'catalogue.read', 'clients.read', 'entities.read',
      'cases.read', 'cases.transition', 'tasks.read', 'tasks.manage',
      'documents.read', 'documents.upload', 'documents.review', 'documents.download',
      'obligations.read', 'obligations.manage', 'communications.send', 'knowledge.read',
    ],
  },
  {
    code: 'REVIEWER',
    name: 'Reviewer / Approver',
    description: 'Review documents and cases, request corrections, approve defined transitions.',
    permissions: [
      'catalogue.read', 'clients.read', 'entities.read', 'cases.read', 'cases.transition',
      'tasks.read', 'documents.read', 'documents.review', 'documents.download',
      'obligations.read', 'approvals.decide', 'knowledge.read',
    ],
  },
  {
    code: 'FINANCE_EXECUTIVE',
    name: 'Finance Executive',
    description: 'Invoices, receipts, payments, allocations, approved refunds and receivables.',
    permissions: [
      'clients.read', 'entities.read', 'quotations.read', 'cases.read',
      'invoices.read', 'invoices.issue', 'invoices.adjust', 'payments.record', 'payments.allocate',
      'refunds.request', 'expenses.manage', 'communications.send', 'reports.finance.read',
    ],
  },
  {
    code: 'CLIENT_REPRESENTATIVE',
    name: 'Client / Client Representative',
    description: 'Own or authorised profile, business entities, cases, requested uploads and invoices.',
    permissions: ['cases.read', 'documents.read', 'documents.upload', 'invoices.read', 'quotations.read'],
  },
  {
    code: 'AUDITOR',
    name: 'Auditor / Read-only',
    description: 'Explicitly scoped read-only records and reports.',
    permissions: [
      'users.read', 'roles.read', 'settings.read', 'audit.read', 'catalogue.read',
      'clients.read', 'entities.read', 'quotations.read', 'cases.read', 'tasks.read',
      'documents.read', 'obligations.read', 'invoices.read', ...readAllReports, 'knowledge.read',
    ],
  },
];
