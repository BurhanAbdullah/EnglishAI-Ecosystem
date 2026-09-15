import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../docs/', import.meta.url).pathname;
const pages = readdirSync(root).filter((name) => name.endsWith('.html'));
const required = ['index.html', 'platform.html', 'capabilities.html', 'architecture.html', 'research.html', 'docs.html', 'tutor.html', 'learner.html', 'join.html'];

const failures = [];
for (const page of required) {
  if (!pages.includes(page)) failures.push(`Missing page: docs/${page}`);
}

for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  if (!/^<!doctype html>/i.test(html)) failures.push(`${page}: missing doctype`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) failures.push(`${page}: missing viewport meta`);
  if (!/<link[^>]+href=["']\.\/assets\/site\.css["']/i.test(html)) failures.push(`${page}: missing shared stylesheet`);
  for (const match of html.matchAll(/(?:href|src)=["'](\.\/[^"'#?]+)/g)) {
    const target = match[1];
    const targetPath = join(root, target.slice(2));
    try { readFileSync(targetPath); } catch { failures.push(`${page}: broken local reference ${target}`); }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Website validation passed: ${pages.length} HTML pages checked.`);
