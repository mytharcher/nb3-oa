// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import locales from '../../client/locales/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
function files(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const englishFiles = ['client/locales', 'server/locales', 'client/extensions']
  .flatMap((directory) => files(path.join(root, directory)))
  .filter((file) => file.endsWith('en-US.ts'));

// A complete English import gives every key but silently leaves the entire module untranslated.
describe('locale resource module coverage', () => {
  it.each(Object.keys(locales).filter((locale) => locale !== 'en-US'))(
    '%s supplies every application module and has no English runtime imports',
    (locale) => {
      const issues: string[] = [];
      for (const english of englishFiles) {
        const file = english.replace(/en-US\.ts$/u, `${locale}.ts`);
        if (!fs.existsSync(file)) {
          issues.push(`Missing ${path.relative(root, file)}`);
          continue;
        }
        const ast = ts.createSourceFile(
          file,
          fs.readFileSync(file, 'utf8'),
          ts.ScriptTarget.Latest,
          true,
        );
        for (const statement of ast.statements) {
          if (
            !ts.isImportDeclaration(statement) ||
            !ts.isStringLiteral(statement.moduleSpecifier)
          )
            continue;
          const clause = statement.importClause;
          if (clause?.isTypeOnly) continue;
          const names = clause?.namedBindings;
          const namedImports =
            names && ts.isNamedImports(names) ? names.elements : [];
          const allTypes =
            !clause?.name &&
            namedImports.length > 0 &&
            namedImports.every((item) => item.isTypeOnly);
          if (allTypes) continue;
          const englishModule = /(?:^|\/)en-US(?:\.js)?$/u.test(
            statement.moduleSpecifier.text,
          );
          const englishExport = namedImports.some(
            (item) =>
              !item.isTypeOnly &&
              /LocaleEnUS$/u.test((item.propertyName ?? item.name).text),
          );
          if (englishModule || englishExport)
            issues.push(
              `English runtime import in ${path.relative(root, file)}`,
            );
        }
      }
      expect(issues).toEqual([]);
    },
  );
});
