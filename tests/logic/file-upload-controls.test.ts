import { globSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('business pages delegate native file selection to shared standard components', () => {
  const violations: string[] = [];
  for (const path of globSync('client/pages/**/*.tsx')) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node: ts.Node) {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        for (const property of node.attributes.properties) {
          if (
            !ts.isJsxAttribute(property) ||
            property.name.getText(source) !== 'type' ||
            !property.initializer
          )
            continue;
          const value = ts.isJsxExpression(property.initializer)
            ? property.initializer.expression
            : property.initializer;
          if (value && ts.isStringLiteral(value) && value.text === 'file') {
            violations.push(
              `${path}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`,
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(
    violations,
    'Use FileUploadInput or the installed FileUploadField, preserving business upload handlers.',
  ).toEqual([]);
});
