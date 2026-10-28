import { describe, expect, it } from 'vitest';
import { currentPeriodKey } from './settings.service.js';

describe('currentPeriodKey', () => {
  it('uses the calendar year for CALENDAR_YEAR', () => {
    expect(currentPeriodKey('CALENDAR_YEAR', new Date('2026-10-10T00:00:00Z'))).toBe('2026');
  });
  it('starts the Indian financial year in April', () => {
    expect(currentPeriodKey('FINANCIAL_YEAR', new Date('2026-03-31T12:00:00'))).toBe('2025-26');
    expect(currentPeriodKey('FINANCIAL_YEAR', new Date('2026-04-01T12:00:00'))).toBe('2026-27');
    expect(currentPeriodKey('FINANCIAL_YEAR', new Date('2026-12-31T12:00:00'))).toBe('2026-27');
  });
});
