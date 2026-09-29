#!/usr/bin/env node
// Validates all content in src/content against the contract in src/content/types.ts.
// Usage: node scripts/validate-content.mjs          (errors => exit 1)
//        node scripts/validate-content.mjs --stats  (also print coverage stats)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const STATS = process.argv.includes('--stats');
const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const TS = {
  1: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'],
  2: ['2.1', '2.2', '2.3', '2.4', '2.5'],
  3: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6'],
  4: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6'],
  5: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'],
};
const ALL_TS = Object.values(TS).flat();

// ---- lessons
function chunkCount(raw) {
  let inFence = false;
  let n = 0;
  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line)) n++;
  }
  return n;
}
const lessonsDir = join(root, 'lessons');
const lessons = {};
for (const f of existsSync(lessonsDir) ? readdirSync(lessonsDir) : []) {
  if (!f.endsWith('.md')) continue;
  const id = f.replace('.md', '').replace('-', '.');
  if (!ALL_TS.includes(id)) err(`lessons/${f}`, `file name must be <task statement with dash>.md, e.g. 1-1.md`);
  const raw = readFileSync(join(lessonsDir, f), 'utf8');
  if (!/^# /m.test(raw)) err(`lessons/${f}`, 'missing "# Title" line');
  const n = chunkCount(raw);
  if (n < 2) err(`lessons/${f}`, `needs at least 2 "## " chunks, found ${n}`);
  if (raw.split(/```/).length % 2 === 0) err(`lessons/${f}`, 'unbalanced ``` code fences');
  lessons[id] = n;
}

// ---- repeat unit lessons (src/content/repeat/r-<n>.md => "R.<n>"); ids must match REPEAT_UNIT in meta.ts
const REPEAT_IDS = ['R.1', 'R.2', 'R.3', 'R.4', 'R.5', 'R.6'];
const repeatDir = join(root, 'repeat');
for (const f of existsSync(repeatDir) ? readdirSync(repeatDir) : []) {
  if (!f.endsWith('.md')) continue;
  const id = f.replace('.md', '').replace('r-', 'R.');
  if (!REPEAT_IDS.includes(id)) err(`repeat/${f}`, `file name must be r-<n>.md with R.<n> listed in REPEAT_UNIT`);
  const raw = readFileSync(join(repeatDir, f), 'utf8');
  if (!/^# /m.test(raw)) err(`repeat/${f}`, 'missing "# Title" line');
  const n = chunkCount(raw);
  if (n < 2) err(`repeat/${f}`, `needs at least 2 "## " chunks, found ${n}`);
  if (raw.split(/```/).length % 2 === 0) err(`repeat/${f}`, 'unbalanced ``` code fences');
  lessons[id] = n;
}
const LESSON_IDS = [...ALL_TS, ...REPEAT_IDS];

// ---- questions
const ids = new Map();
const questions = [];
const qDir = join(root, 'questions');
for (const f of existsSync(qDir) ? readdirSync(qDir) : []) {
  if (!f.endsWith('.json')) continue;
  const file = `questions/${f}`;
  let data;
  try {
    data = JSON.parse(readFileSync(join(qDir, f), 'utf8'));
  } catch (e) {
    err(file, `invalid JSON: ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) {
    err(file, 'top level must be an array');
    continue;
  }
  for (const q of data) {
    const where = `${file} [${q?.id ?? '?'}]`;
    if (!q.id || typeof q.id !== 'string') err(where, 'missing id');
    else if (ids.has(q.id)) err(where, `duplicate id (also in ${ids.get(q.id)})`);
    else ids.set(q.id, file);
    if (!['official-sample', 'community', 'original'].includes(q.source)) err(where, `bad source "${q.source}"`);
    if (!['quickcheck', 'practice'].includes(q.kind)) err(where, `bad kind "${q.kind}"`);
    if (![1, 2, 3, 4, 5].includes(q.domain)) err(where, `bad domain "${q.domain}"`);
    if (!Array.isArray(q.taskStatements) || q.taskStatements.length === 0) err(where, 'taskStatements must be non-empty array');
    else for (const t of q.taskStatements) if (!ALL_TS.includes(t)) err(where, `unknown task statement "${t}"`);
    if (Array.isArray(q.taskStatements) && q.taskStatements[0] && Number(q.taskStatements[0][0]) !== q.domain)
      warn(where, `domain ${q.domain} differs from first task statement ${q.taskStatements[0]}`);
    if (![1, 2, 3].includes(q.difficulty)) err(where, 'difficulty must be 1|2|3');
    if (!q.stem || q.stem.length < 20) err(where, 'stem missing/too short');
    if (!q.keyPrinciple) err(where, 'missing keyPrinciple');
    if (!q.sourceRef) err(where, 'missing sourceRef');
    if (!Array.isArray(q.options) || q.options.length < 3) err(where, 'needs >= 3 options');
    else {
      const oids = q.options.map((o) => o.id);
      if (new Set(oids).size !== oids.length) err(where, 'duplicate option ids');
      for (const o of q.options) {
        if (!o.text) err(where, `option ${o.id} missing text`);
        if (!o.explanation || o.explanation.length < 15) err(where, `option ${o.id} missing/too-short explanation`);
      }
      if (!Array.isArray(q.correct) || q.correct.length === 0) err(where, 'correct must be non-empty array');
      else {
        for (const c of q.correct) if (!oids.includes(c)) err(where, `correct "${c}" not an option id`);
        if (q.selectCount !== q.correct.length) err(where, `selectCount ${q.selectCount} != correct.length ${q.correct.length}`);
      }
    }
    if (q.kind === 'practice') {
      if (![1, 2, 3, 4, 5, 6, 7].includes(q.scenario)) err(where, 'practice questions need scenario 1-7');
    }
    if (q.kind === 'quickcheck') {
      if (!q.lesson || !LESSON_IDS.includes(q.lesson)) err(where, 'quickcheck needs valid lesson id');
      else if (!(q.lesson in lessons)) warn(where, `lesson ${q.lesson} file not found (yet)`);
      else if (!Number.isInteger(q.chunk) || q.chunk < 0 || q.chunk >= lessons[q.lesson])
        err(where, `chunk ${q.chunk} out of range (lesson ${q.lesson} has ${lessons[q.lesson]} chunks)`);
    }
    questions.push(q);
  }
}

// ---- flashcards
const fDir = join(root, 'flashcards');
let flashcards = 0;
for (const f of existsSync(fDir) ? readdirSync(fDir) : []) {
  if (!f.endsWith('.json')) continue;
  const file = `flashcards/${f}`;
  let data;
  try {
    data = JSON.parse(readFileSync(join(fDir, f), 'utf8'));
  } catch (e) {
    err(file, `invalid JSON: ${e.message}`);
    continue;
  }
  for (const c of data) {
    const where = `${file} [${c?.id ?? '?'}]`;
    if (!c.id) err(where, 'missing id');
    else if (ids.has(c.id)) err(where, `duplicate id (also in ${ids.get(c.id)})`);
    else ids.set(c.id, file);
    if (![1, 2, 3, 4, 5].includes(c.domain)) err(where, 'bad domain');
    if (!ALL_TS.includes(c.taskStatement)) err(where, `bad taskStatement "${c.taskStatement}"`);
    if (!c.front || !c.back) err(where, 'front/back required');
    if (!c.sourceRef) err(where, 'missing sourceRef');
    flashcards++;
  }
}

// ---- answer-bias heuristics (warnings)
const practice = questions.filter((q) => q.kind === 'practice' && q.selectCount === 1);
const pos = {};
let longestCorrect = 0;
for (const q of practice) {
  pos[q.correct[0]] = (pos[q.correct[0]] ?? 0) + 1;
  const lens = q.options.map((o) => o.text.length);
  const correctLen = q.options.find((o) => o.id === q.correct[0])?.text.length ?? 0;
  if (correctLen === Math.max(...lens)) longestCorrect++;
}
if (practice.length >= 20 && longestCorrect / practice.length > 0.5)
  warn('bias', `correct option is the longest in ${longestCorrect}/${practice.length} practice questions — vary lengths`);

if (STATS) {
  const by = (fn) => questions.reduce((m, q) => ((m[fn(q)] = (m[fn(q)] ?? 0) + 1), m), {});
  const tsLessons = Object.keys(lessons).filter((id) => ALL_TS.includes(id));
  console.log('Lessons:', tsLessons.sort().join(' '), `(${tsLessons.length}/30)`);
  console.log('Repeat lessons:', Object.keys(lessons).filter((id) => REPEAT_IDS.includes(id)).sort().join(' '));
  console.log('Questions:', questions.length, 'by kind', by((q) => q.kind), 'by source', by((q) => q.source));
  console.log('Practice by scenario:', by((q) => (q.kind === 'practice' ? `S${q.scenario}` : '-')));
  console.log('By primary task statement:', by((q) => q.taskStatements?.[0]));
  console.log('Correct-letter distribution (single-answer practice):', pos);
  console.log('Flashcards:', flashcards);
}
for (const w of warnings) console.warn('WARN ', w);
for (const e of errors) console.error('ERROR', e);
console.log(errors.length ? `\n${errors.length} error(s)` : '\nContent OK');
process.exit(errors.length ? 1 : 0);
