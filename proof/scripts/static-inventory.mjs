// usage: node static-inventory.mjs <out.json> — AST scan of every operator-app/setup/editor source file for controls with no visible text child.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { LAMP } from './lib.mjs';
const ts = (await import(path.join(LAMP, 'node_modules/typescript/lib/typescript.js'))).default;
const files = execSync('git ls-files "src/core/**/*.tsx" "src/ext/**/*.tsx" "src/routes/*.tsx" "src/editor/*.ts" "src/editor/*.tsx"', { cwd: LAMP }).toString().trim().split('\n').filter(f => !f.startsWith('src/site'));
const CONTROL = new Set(['button', 'Button', 'a', 'Link', 'summary']);
const rows = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(LAMP, file), 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const attr = (el, name) => el.attributes.properties.find(p => p.name?.getText() === name);
  const visit = node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName.getText();
      const typeAttr = attr(opening, 'type')?.initializer?.getText();
      const isInput = tag === 'input' && /color|checkbox|radio/.test(typeAttr ?? '');
      if (CONTROL.has(tag) || isInput) {
        // Visible text: any JSXText with a letter/digit, or a string literal in an expression, or a non-icon expression child.
        let hasText = false, hasExpr = false, icon = false;
        if (ts.isJsxElement(node)) for (const child of node.children) {
          if (ts.isJsxText(child) && /[\p{L}\p{N}]/u.test(child.getText())) hasText = true;
          else if (ts.isJsxText(child) && /\S/.test(child.getText())) icon = true;
          else if (ts.isJsxExpression(child)) hasExpr = true;
          else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const t = ts.isJsxElement(child) ? child.openingElement.tagName.getText() : child.tagName.getText();
            if (t === 'Icon' || t === 'svg' || t === 'img' || t === 'Glyph') icon = true; else hasText = hasText || /[\p{L}\p{N}]/u.test(child.getText().replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, 'X')) || true;
          }
        }
        if (isInput || !hasText) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
          rows.push({ file, line: line + 1, tag: isInput ? `input[${typeAttr}]` : tag, expressionChild: hasExpr, iconChild: icon, aria: attr(opening, 'aria-label')?.initializer?.getText() ?? null, title: attr(opening, 'title')?.initializer?.getText() ?? null, spread: !!opening.attributes.properties.find(p => ts.isJsxSpreadAttribute(p)), src: node.getText().replace(/\s+/g, ' ').slice(0, 200) });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}
fs.writeFileSync(process.argv[2], JSON.stringify({ filesScanned: files.length, rows }, null, 1));
console.log('files', files.length, 'candidate controls with no literal text', rows.length);
for (const r of rows) console.log(`${r.file}:${r.line} <${r.tag}> aria=${r.aria} icon=${r.iconChild} expr=${r.expressionChild} spread=${r.spread}`);
