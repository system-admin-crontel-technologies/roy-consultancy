/**
 * Seed: permission catalogue, role templates, numbering sequences, integration registry,
 * the initial Super Admin (from env) and optional clearly-marked demo catalogue records.
 * Idempotent: safe to run repeatedly. Demo records carry isDemo=true and DEMO- codes.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { ALL_PERMISSIONS, PERMISSIONS, ROLE_TEMPLATES, permissionModule } from '@roy/types';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { IntegrationStatus, SequenceResetPolicy, UserStatus } from '../src/generated/prisma/enums.js';

loadEnv({ path: [resolve(import.meta.dirname, '../../../.env'), resolve(import.meta.dirname, '../.env')] });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function seedPermissionsAndRoles() {
  for (const code of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, module: permissionModule(code), description: PERMISSIONS[code] },
      update: { module: permissionModule(code), description: PERMISSIONS[code] },
    });
  }
  const perms = await prisma.permission.findMany();
  const byCode = new Map(perms.map((p) => [p.code, p.id]));

  for (const tpl of ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { code: tpl.code },
      create: { code: tpl.code, name: tpl.name, description: tpl.description, isSystem: true },
      update: { name: tpl.name, description: tpl.description, isSystem: true },
    });
    const wanted = tpl.permissions === 'ALL' ? ALL_PERMISSIONS : tpl.permissions;
    // System role templates are re-applied on seed only when the role has no grants yet,
    // so that administrator customisations are not overwritten. SUPER_ADMIN always gets everything.
    const existing = await prisma.rolePermission.count({ where: { roleId: role.id } });
    if (existing === 0 || tpl.code === 'SUPER_ADMIN') {
      await prisma.rolePermission.createMany({
        data: wanted.map((code) => ({ roleId: role.id, permissionId: byCode.get(code)! })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`permissions: ${perms.length}, roles: ${ROLE_TEMPLATES.length}`);
}

async function seedSequences() {
  const sequences: { key: string; label: string; prefix: string; resetPolicy: SequenceResetPolicy }[] = [
    { key: 'LEAD', label: 'Lead reference', prefix: 'LD', resetPolicy: SequenceResetPolicy.NEVER },
    { key: 'CLIENT', label: 'Client code', prefix: 'CL', resetPolicy: SequenceResetPolicy.NEVER },
    { key: 'QUOTATION', label: 'Quotation number', prefix: 'QT', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'ORDER', label: 'Service order number', prefix: 'SO', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'CASE', label: 'Case reference', prefix: 'CS', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'OBLIGATION', label: 'Obligation reference', prefix: 'OB', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'INVOICE', label: 'Invoice number', prefix: 'INV', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'CREDIT_NOTE', label: 'Credit note number', prefix: 'CN', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
    { key: 'RECEIPT', label: 'Receipt number', prefix: 'RC', resetPolicy: SequenceResetPolicy.FINANCIAL_YEAR },
  ];
  for (const s of sequences) {
    await prisma.numberingSequence.upsert({ where: { key: s.key }, create: { ...s, padding: 5, nextValue: 1 }, update: { label: s.label } });
  }
  console.log(`numbering sequences: ${sequences.length}`);
}

async function seedIntegrations() {
  const rows = [
    { key: 'DATABASE', name: 'PostgreSQL database', category: 'platform', provider: 'postgresql' },
    { key: 'REDIS', name: 'Redis / Valkey queue store', category: 'platform', provider: 'valkey' },
    { key: 'OBJECT_STORAGE', name: 'Private object storage', category: 'storage', provider: 's3-compatible' },
    { key: 'MALWARE_SCAN', name: 'Malware scanning', category: 'storage', provider: 'clamav' },
    { key: 'EMAIL_SMTP', name: 'Transactional email', category: 'communications', provider: 'smtp' },
    { key: 'SMS', name: 'SMS provider', category: 'communications', provider: null },
    { key: 'WHATSAPP', name: 'WhatsApp Business', category: 'communications', provider: null },
    { key: 'PAYMENT_GATEWAY', name: 'Payment gateway', category: 'finance', provider: null },
    { key: 'E_SIGNATURE', name: 'E-signature provider', category: 'documents', provider: null },
  ];
  for (const r of rows) {
    await prisma.integrationAccount.upsert({
      where: { key: r.key },
      create: { ...r, status: IntegrationStatus.NOT_CONFIGURED, secretRef: r.provider ? `env:${r.key}` : null },
      update: { name: r.name, category: r.category },
    });
  }
  console.log(`integrations: ${rows.length}`);
}

async function seedSettings() {
  await prisma.systemSetting.upsert({
    where: { key: 'organisation' },
    create: {
      key: 'organisation',
      description: 'Organisation profile and localisation',
      value: {
        name: 'Roy Consultancy', legalName: '', email: '', phone: '', addressLines: [],
        timezone: process.env.APP_TIMEZONE ?? 'Asia/Kolkata', currency: process.env.APP_CURRENCY ?? 'INR',
        dateFormat: 'DD/MM/YYYY', financialYearStartMonth: 4, gstin: '',
        notificationFromName: 'Roy Consultancy', notificationReplyTo: '', reminderDaysBeforeDue: [30, 7, 1],
      },
    },
    update: {},
  });
  console.log('organisation settings: ok');
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SEED_SUPER_ADMIN_NAME ?? 'Platform Administrator';
  if (!email || !password) {
    console.log('SEED_SUPER_ADMIN_EMAIL/PASSWORD not set; skipping super admin');
    return;
  }
  if (password.length < 12) throw new Error('SEED_SUPER_ADMIN_PASSWORD must be at least 12 characters');
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) {
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: existing.id, roleId: role.id } }, create: { userId: existing.id, roleId: role.id }, update: {} });
    console.log(`super admin exists: ${email}`);
    return;
  }
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      fullName,
      status: UserStatus.ACTIVE,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      passwordChangedAt: new Date(),
      roles: { create: { roleId: role.id } },
    },
  });
  await prisma.auditLog.create({ data: { actorType: 'SYSTEM', actorLabel: 'seed', action: 'users.seed_super_admin', resourceType: 'user', resourceId: user.id, after: { email: user.email } } });
  console.log(`super admin created: ${email}`);
}

async function seedDemoCatalogue() {
  if (process.env.SEED_DEMO_DATA !== 'true') {
    console.log('SEED_DEMO_DATA is not true; skipping demo catalogue');
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('NODE_ENV=production: demo catalogue skipped (set SEED_DEMO_DATA=false to silence)');
    return;
  }

  const categories = [
    { code: 'DEMO-FORMATION', name: 'Business formation (demo)', description: 'Private Limited, LLP, OPC, partnership and proprietorship setup assistance.' },
    { code: 'DEMO-TAX-REG', name: 'Tax registration (demo)', description: 'GST registration, amendment and cancellation; PAN-related assistance.' },
    { code: 'DEMO-CORP-COMPLIANCE', name: 'Corporate compliance (demo)', description: 'ROC annual and event-based filings, director KYC, office changes.' },
    { code: 'DEMO-IP', name: 'Intellectual property (demo)', description: 'Trademark search, application filing, objection response and renewals.' },
    { code: 'DEMO-TAX-SUPPORT', name: 'Tax and statutory support (demo)', description: 'GST return, income-tax return and TDS assistance.' },
    { code: 'DEMO-LICENCES', name: 'Licences and registrations (demo)', description: 'Udyam/MSME, IEC, professional tax and other licences.' },
    { code: 'DEMO-RETAINERS', name: 'Retainers and recurring support (demo)', description: 'Annual compliance packages and advisory retainers.' },
  ];
  const catIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await prisma.serviceCategory.upsert({ where: { code: c.code }, create: { ...c, sortOrder: i * 10, isDemo: true }, update: { name: c.name, description: c.description, isDemo: true } });
    catIds.set(c.code, row.id);
  }

  const demoServices = [
    {
      code: 'DEMO-PVT-LTD-INC', name: 'Private Limited Company incorporation (demo)', category: 'DEMO-FORMATION',
      shortDescription: 'End-to-end assistance for incorporating a private limited company.',
      summary: 'Demonstration template. Checklists and fees are placeholders and must be approved by the business owner and a qualified reviewer.',
      jurisdiction: 'India', expectedTurnaroundDays: 15,
      requiredInputs: [
        { key: 'proposed_names', label: 'Proposed company names (in order of preference)', required: true },
        { key: 'registered_office', label: 'Registered office address', required: true },
        { key: 'authorised_capital', label: 'Authorised and paid-up capital', required: true },
        { key: 'directors', label: 'Director and shareholder details', required: true },
      ],
      requiredDocuments: [
        { key: 'director_id_proof', label: 'Identity proof of each director', required: true, sensitivity: 'SENSITIVE' },
        { key: 'director_address_proof', label: 'Address proof of each director', required: true, sensitivity: 'SENSITIVE' },
        { key: 'office_proof', label: 'Registered office proof and NOC', required: true },
        { key: 'photos', label: 'Passport-size photographs', required: true },
      ],
      taskTemplate: [
        { key: 'collect', title: 'Collect and verify client inputs and documents', role: 'COMPLIANCE_EXECUTIVE', targetDays: 3 },
        { key: 'name_check', title: 'Name availability review', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['collect'], targetDays: 1 },
        { key: 'prepare', title: 'Prepare application package', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['name_check'], targetDays: 3 },
        { key: 'review', title: 'Internal review of application package', role: 'REVIEWER', dependsOn: ['prepare'], targetDays: 1, reviewerGate: true },
        { key: 'submit', title: 'Submit through permitted channel and record reference', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['review'], targetDays: 1 },
        { key: 'track', title: 'Track authority response and handle corrections', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['submit'], targetDays: 7 },
        { key: 'deliver', title: 'Upload certificates and hand over to client', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['track'], targetDays: 1 },
      ],
      deliverables: [{ key: 'certificate', label: 'Certificate of incorporation' }, { key: 'constitution', label: 'Constitutional documents' }],
      closureCriteria: [{ key: 'deliverables_uploaded', label: 'All deliverables uploaded and shared' }, { key: 'billing_reconciled', label: 'Billing reconciled' }],
      price: { professionalFeeMinor: 1_499_900, governmentFeeMinor: 500_000, taxRateBps: 1800, governmentFeeIsEstimate: true, notes: 'Demo pricing placeholder.' },
    },
    {
      code: 'DEMO-GST-REG', name: 'GST registration (demo)', category: 'DEMO-TAX-REG',
      shortDescription: 'Assistance with a new GST registration application.',
      summary: 'Demonstration template.', jurisdiction: 'India', expectedTurnaroundDays: 10,
      requiredInputs: [{ key: 'business_activity', label: 'Nature of business activity', required: true }, { key: 'place_of_business', label: 'Principal place of business', required: true }],
      requiredDocuments: [
        { key: 'pan', label: 'PAN of the business / proprietor', required: true, sensitivity: 'SENSITIVE' },
        { key: 'address_proof', label: 'Proof of principal place of business', required: true },
        { key: 'bank_proof', label: 'Bank account proof', required: true },
      ],
      taskTemplate: [
        { key: 'collect', title: 'Collect documents', role: 'COMPLIANCE_EXECUTIVE', targetDays: 2 },
        { key: 'prepare', title: 'Prepare application', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['collect'], targetDays: 2 },
        { key: 'review', title: 'Internal review', role: 'REVIEWER', dependsOn: ['prepare'], targetDays: 1, reviewerGate: true },
        { key: 'submit', title: 'Submit and record acknowledgement', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['review'], targetDays: 1 },
        { key: 'track', title: 'Track status and respond to queries', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['submit'], targetDays: 5 },
      ],
      deliverables: [{ key: 'certificate', label: 'Registration certificate' }],
      closureCriteria: [{ key: 'certificate_shared', label: 'Certificate shared with client' }],
      price: { professionalFeeMinor: 299_900, governmentFeeMinor: 0, taxRateBps: 1800, governmentFeeIsEstimate: false, notes: 'Demo pricing placeholder.' },
    },
    {
      code: 'DEMO-TM-FILING', name: 'Trademark application filing (demo)', category: 'DEMO-IP',
      shortDescription: 'Search assistance and filing of a trademark application in one class.',
      summary: 'Demonstration template.', jurisdiction: 'India', expectedTurnaroundDays: 7,
      requiredInputs: [{ key: 'mark', label: 'Mark (word / logo)', required: true }, { key: 'class', label: 'Class and goods/services description', required: true }, { key: 'owner', label: 'Applicant details', required: true }],
      requiredDocuments: [{ key: 'logo', label: 'Logo image (if device mark)', required: false, conditional: 'Only for device/logo marks' }, { key: 'authorisation', label: 'Authorisation to file', required: true }],
      taskTemplate: [
        { key: 'search', title: 'Trademark search and report', role: 'COMPLIANCE_EXECUTIVE', targetDays: 2 },
        { key: 'prepare', title: 'Prepare application', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['search'], targetDays: 2 },
        { key: 'review', title: 'Internal review', role: 'REVIEWER', dependsOn: ['prepare'], targetDays: 1, reviewerGate: true },
        { key: 'file', title: 'File and record application number', role: 'COMPLIANCE_EXECUTIVE', dependsOn: ['review'], targetDays: 1 },
      ],
      deliverables: [{ key: 'search_report', label: 'Search report' }, { key: 'filing_receipt', label: 'Filing receipt with application number' }],
      closureCriteria: [{ key: 'receipt_shared', label: 'Filing receipt shared with client' }],
      price: { professionalFeeMinor: 349_900, governmentFeeMinor: 450_000, taxRateBps: 1800, governmentFeeIsEstimate: true, notes: 'Demo pricing placeholder.' },
    },
    {
      code: 'DEMO-ANNUAL-PKG', name: 'Annual compliance package (demo)', category: 'DEMO-RETAINERS',
      shortDescription: 'Twelve-month package covering routine corporate compliance coordination.',
      summary: 'Demonstration template for a recurring package.', jurisdiction: 'India', expectedTurnaroundDays: null, billingType: 'ANNUAL_PACKAGE', recurrenceMonths: 12,
      requiredInputs: [{ key: 'entity', label: 'Entity covered', required: true }, { key: 'financial_year', label: 'Financial year', required: true }],
      requiredDocuments: [],
      taskTemplate: [{ key: 'onboard', title: 'Onboarding call and obligation assessment', role: 'OPERATIONS_MANAGER', targetDays: 5 }],
      deliverables: [{ key: 'calendar', label: 'Agreed compliance calendar' }],
      closureCriteria: [{ key: 'term_complete', label: 'Package term completed' }],
      price: { professionalFeeMinor: 2_499_900, governmentFeeMinor: 0, taxRateBps: 1800, governmentFeeIsEstimate: false, notes: 'Demo pricing placeholder.' },
    },
  ];

  for (const s of demoServices) {
    const existing = await prisma.service.findUnique({ where: { code: s.code } });
    if (existing) continue;
    await prisma.service.create({
      data: {
        code: s.code, name: s.name, categoryId: catIds.get(s.category)!, shortDescription: s.shortDescription, status: 'ACTIVE', isDemo: true,
        versions: {
          create: {
            versionNumber: 1, isCurrent: true, effectiveFrom: new Date(), publishedAt: new Date(),
            summary: s.summary, jurisdiction: s.jurisdiction, expectedTurnaroundDays: s.expectedTurnaroundDays,
            billingType: (s.billingType as 'ONE_TIME' | 'ANNUAL_PACKAGE' | undefined) ?? 'ONE_TIME', recurrenceMonths: s.recurrenceMonths ?? null,
            requiredInputs: s.requiredInputs, requiredDocuments: s.requiredDocuments, taskTemplate: s.taskTemplate,
            deliverables: s.deliverables, closureCriteria: s.closureCriteria,
            price: { create: { currency: 'INR', ...s.price } },
          },
        },
      },
    });
  }
  console.log(`demo categories: ${categories.length}, demo services: ${demoServices.length}`);
}

async function main() {
  await seedPermissionsAndRoles();
  await seedSequences();
  await seedIntegrations();
  await seedSettings();
  await seedSuperAdmin();
  await seedDemoCatalogue();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
