// @vitest-environment node

import ExcelJS from 'exceljs';
import { I18nRuntime } from '@nocobase/i18n';
import { describe, expect, it } from 'vitest';
import locales from '../../../server/locales/index.js';
import { xlsx } from '../../../server/routes/reports/export.js';
import { reportLocaleSchema } from '../../../server/routes/reports/i18n.js';

describe('localized report workbooks', () => {
  it.each(Object.keys(locales))(
    'exports %s headers and sheet titles without converting integer cents',
    async (locale) => {
      expect(reportLocaleSchema.parse(locale)).toBe(locale);
      const runtime = new I18nRuntime({
        applicationNamespace: 'nb3-oa',
        defaultLocale: 'en-US',
        locales: Object.keys(locales),
      });
      runtime.registerApplicationNamespace('nb3-oa', locales);
      await runtime.init(locale);
      const t = runtime.getFixedT('nb3-oa', locale);
      const label = `fixture-${locale}`;
      const response = await xlsx(
        [
          {
            allocatedCents: 12345,
            subject: 'travel',
            subjectLabel: { 'en-US': 'fallback', [locale]: label },
          },
        ],
        [
          {
            key: 'allocatedCents',
            header: t('reportExports.budgetBalances.fields.allocatedCents'),
          },
          {
            key: 'subject',
            header: t('reportExports.budgetBalances.fields.subject'),
          },
        ],
        'localized-report.xlsx',
        { locale, sheetName: t('reportExports.sheet') },
      );
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(await response.arrayBuffer());
      const sheet = book.worksheets[0];
      expect(sheet.name).toBe(t('reportExports.sheet'));
      expect(sheet.getCell('A1').value).toBe(
        t('reportExports.budgetBalances.fields.allocatedCents'),
      );
      expect(sheet.getCell('A2').value).toBe(12345);
      expect(sheet.getCell('B2').value).toBe(label);
      expect(response.headers.get('cache-control')).toBe('no-store');
      for (const key of [
        'sheet',
        'approvalEfficiency.sheet',
        'approvalReturnRate.sheet',
      ]) {
        const name = t(`reportExports.${key}`);
        expect(name.length).toBeLessThanOrEqual(31);
        const invalid = ['\\', '/', '*', '?', ':', '[', ']'];
        expect([...name].some((character) => invalid.includes(character))).toBe(
          false,
        );
      }
      const translated = runtime.i18n.t(
        'reportExports.budgetBalances.fields.allocatedCents',
        {
          lng: locale,
          ns: 'nb3-oa',
          returnDetails: true,
        },
      );
      expect(translated.usedLng).toBe(locale);
    },
  );

  it('rejects undeclared report language codes', () => {
    expect(reportLocaleSchema.safeParse('unknown-locale').success).toBe(false);
  });
});
