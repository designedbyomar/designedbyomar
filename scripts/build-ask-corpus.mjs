#!/usr/bin/env node
/**
 * Assembles the authoring corpus for the Ask assistant.
 *
 * This is a LOCAL authoring aid, not part of the production build. It gathers
 * every published source into one document so answers can be drafted from the
 * site's own words rather than from memory. The only artifact that ships is
 * src/content/ask-answers.json, which a human reviews.
 *
 * Case-study content is read through the PUBLIC_FIELDS allowlist in
 * src/case-studies.js. Never bypass it — that allowlist exists because internal
 * editorial notes once leaked into the public bundle (commit d87b045).
 *
 * Usage: node scripts/build-ask-corpus.mjs [--out <path>]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(ROOT, p), 'utf8');

const fail = msg => {
  console.error(`build-ask-corpus: ${msg}`);
  process.exit(1);
};

/** Pull a top-level `const NAME = ...` literal out of a source file. */
function extractConst(source, name, { kind }) {
  const open = kind === 'array' ? '[' : '`';
  const close = kind === 'array' ? ']' : '`';
  const start = source.indexOf(`const ${name} = ${open}`);
  if (start === -1) fail(`could not find "const ${name} = ${open}" — the source moved, update this script`);

  const from = source.indexOf(open, start);
  if (kind === 'template') {
    const end = source.indexOf(close, from + 1);
    return source.slice(from + 1, end);
  }
  // Brace-depth scan so nested arrays/objects don't end the match early.
  let depth = 0;
  for (let i = from; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(from, i + 1);
    }
  }
  fail(`unbalanced ${open}${close} while reading ${name}`);
  return '';
}

/** Flatten a case-study body block array into readable prose. */
function blocksToProse(blocks = []) {
  const out = [];
  for (const b of blocks) {
    switch (b?.type) {
      case 'heading': out.push(`\n## ${b.text}`); break;
      case 'paragraph': out.push(b.text); break;
      case 'list': out.push((b.items || []).map(i => `- ${i}`).join('\n')); break;
      case 'quote': out.push(`> "${b.text}"${b.attribution ? ` — ${b.attribution}` : ''}`); break;
      case 'callout': out.push(`[${b.title || 'Note'}] ${(b.items || []).join(' ')}`); break;
      // Alt text is real content here, averaging ~21 words and describing UI
      // that appears nowhere else in prose. Worth keeping in the corpus.
      case 'image': if (b.alt) out.push(`[image] ${b.alt}${b.caption ? ` — ${b.caption}` : ''}`); break;
      case 'gallery':
        for (const img of b.images || []) if (img.alt) out.push(`[image] ${img.alt}`);
        break;
      default: break;
    }
  }
  return out.filter(Boolean).join('\n\n');
}

/** Resume text, via pymupdf if available. Optional — warns rather than fails. */
function resumeText() {
  const pdf = resolve(ROOT, 'public/Omar Tavarez Resume.pdf');
  if (!existsSync(pdf)) return null;
  try {
    return execFileSync('python3', [
      '-c',
      'import sys,fitz;print("\\n".join(p.get_text() for p in fitz.open(sys.argv[1])))',
      pdf,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    console.warn('build-ask-corpus: skipping resume — python3 with pymupdf not available.');
    console.warn('  Employment dates and titles exist ONLY here, so answers about work history');
    console.warn('  will have no source. Install with: python3 -m pip install pymupdf');
    return null;
  }
}

// ---------------------------------------------------------------- assemble

const sections = [];
const add = (source, title, text) => {
  if (text && text.trim()) sections.push({ source, title, text: text.trim() });
};

// 1. Case studies, through the public allowlist.
const caseStudies = JSON.parse(read('src/content/case-studies.json'));
const allowlistSrc = read('src/case-studies.js');
const PUBLIC_FIELDS = JSON.parse(
  extractConst(allowlistSrc, 'PUBLIC_FIELDS', { kind: 'array' }).replace(/'/g, '"').replace(/,(\s*])/g, '$1'),
);

for (const raw of caseStudies) {
  const cs = Object.fromEntries(Object.entries(raw).filter(([k]) => PUBLIC_FIELDS.includes(k)));
  const metrics = (cs.metrics || [])
    .map(m => `${m.value} ${m.label}${m.qualifier ? ` (${m.qualifier})` : ''}`)
    .join(' · ');

  add(`case-study:${cs.id}`, `${cs.title} — ${cs.client}, ${cs.year}`, [
    `Role: ${cs.role}`,
    cs.subtitle && `Subtitle: ${cs.subtitle}`,
    cs.tags?.length && `Tags: ${cs.tags.join(', ')}`,
    // Qualifiers must survive into the corpus verbatim. Dropping "Projected"
    // here is how a projected outcome becomes an achieved one downstream.
    metrics && `Metrics: ${metrics}`,
    cs.challenge && `\nChallenge: ${cs.challenge}`,
    cs.approach && `\nApproach: ${cs.approach}`,
    cs.outcome && `\nOutcome: ${cs.outcome}`,
    cs.body?.length && `\n${blocksToProse(cs.body)}`,
  ].filter(Boolean).join('\n'));
}

// 2. FAQ, About drawer and hero stats — all live in main.jsx.
const mainSrc = read('src/main.jsx');

const faqRaw = extractConst(mainSrc, 'FAQ_ITEMS', { kind: 'array' });
const faqPairs = [...faqRaw.matchAll(/question:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?answer:\s*[`']((?:[^`'\\]|\\.)*)[`']/g)]
  .map(m => `Q: ${m[1].replace(/\\'/g, "'")}\nA: ${m[2].replace(/\\'/g, "'").replace(/\s+/g, ' ')}`);
if (!faqPairs.length) fail('FAQ_ITEMS matched zero question/answer pairs — the shape changed');
add('faq', 'Frequently asked questions', faqPairs.join('\n\n'));

for (const name of ['ABOUT_HEADER', 'ABOUT_SUBHEAD', 'ABOUT_SHORT']) {
  if (mainSrc.includes(`const ${name} = \``)) {
    add('about', `About — ${name}`, extractConst(mainSrc, name, { kind: 'template' }));
  }
}

// ABOUT_LONG is an array of { heading, body }, not a template literal — it holds
// the biographical sections (Background, How I work, Currently, Tools, Off the
// clock). This is the highest-value non-case-study prose in the corpus.
const aboutLong = [...extractConst(mainSrc, 'ABOUT_LONG', { kind: 'array' })
  .matchAll(/heading:\s*'((?:[^'\\]|\\.)*)'\s*,\s*body:\s*`((?:[^`\\]|\\.)*)`/g)]
  .map(m => `## ${m[1].replace(/\\'/g, "'")}\n${m[2].replace(/\\n/g, '\n').replace(/\\'/g, "'")}`);
if (!aboutLong.length) fail('ABOUT_LONG matched zero heading/body pairs — the shape changed');
add('about', 'About — long form', aboutLong.join('\n\n'));

const heroStats = [...extractConst(mainSrc, 'HERO_STATS', { kind: 'array' })
  .matchAll(/value:\s*'([^']+)'[\s\S]*?label:\s*'([^']+)'/g)]
  .map(m => `${m[1]} — ${m[2]}`);
add('hero', 'Hero stats', heroStats.join('\n'));

// 3. llms.txt — already a structured summary for machine readers.
add('llms', 'llms.txt', read('public/llms.txt'));

// 4. Resume — the only source of employment dates, titles and sequence.
const resume = resumeText();
if (resume) add('resume', 'Resume (PDF)', resume);

// ---------------------------------------------------------------- output

const outFlag = process.argv.indexOf('--out');
const outPath = outFlag > -1 ? process.argv[outFlag + 1] : 'source-assets/ask-corpus.md';

const doc = sections
  .map(s => `\n\n${'='.repeat(72)}\n[${s.source}] ${s.title}\n${'='.repeat(72)}\n\n${s.text}`)
  .join('');

const words = doc.split(/\s+/).filter(Boolean).length;
writeFileSync(resolve(ROOT, outPath), doc.trimStart(), 'utf8');

console.log(`build-ask-corpus: ${sections.length} sections, ~${words.toLocaleString()} words → ${outPath}`);
for (const s of sections) {
  console.log(`  ${s.source.padEnd(26)} ${s.text.split(/\s+/).length.toLocaleString().padStart(7)} words`);
}
if (!resume) console.log('  (resume omitted — see warning above)');
