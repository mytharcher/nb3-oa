// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { formatCronDescription } from '../../client/pages/administration/scheduler/pages/cron-description.js';

const cases = [
  ['en-US', 'Every minute'],
  ['es-ES', 'Cada minuto'],
  ['fr-FR', 'Toutes les minutes'],
  ['de-DE', 'Jede Minute'],
  ['pt-BR', 'A cada minuto'],
  ['ru-RU', 'Каждую минуту'],
  ['id-ID', 'Setiap menit'],
  ['vi-VN', 'Mỗi phút'],
  ['zh-CN', '每分钟'],
  ['zh-TW', '每分鐘'],
  ['ja-JP', '毎分'],
  ['ko-KR', '1분마다'],
];

describe('cron descriptions in the interface language', () => {
  it.each(cases)('describes a schedule in %s', (locale, expected) => {
    expect(formatCronDescription('* * * * *', locale)).toBe(expected);
  });

  it('uses English for an unsupported language and rejects invalid cron input', () => {
    expect(formatCronDescription('* * * * *', 'unsupported')).toBe(
      'Every minute',
    );
    expect(formatCronDescription('not a cron', 'es-ES')).toBeUndefined();
  });
});
