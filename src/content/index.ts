// Loads all content files at build time via Vite globs.
// - Lessons:    src/content/lessons/<ts-id with dash>.md   e.g. 1-1.md for task statement 1.1
// - Repeat:     src/content/repeat/r-<n>.md                e.g. r-1.md for Repeat lesson R.1
// - Questions:  src/content/questions/*.json               each file = Question[]
// - Flashcards: src/content/flashcards/*.json              each file = Flashcard[]
// - Cheat sheet: src/content/cheatsheet.md
import { ALL_TASK_STATEMENTS, REPEAT_UNIT } from './meta';
import type { DomainId, Flashcard, Lesson, Question } from './types';

const lessonFiles = import.meta.glob('./lessons/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const repeatFiles = import.meta.glob('./repeat/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const questionFiles = import.meta.glob('./questions/*.json', { import: 'default', eager: true }) as Record<string, Question[]>;
const flashcardFiles = import.meta.glob('./flashcards/*.json', { import: 'default', eager: true }) as Record<string, Flashcard[]>;
const cheatsheetFiles = import.meta.glob('./cheatsheet.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Parse "# Title" + "## Chunk" sections. Text before the first "## " is ignored except the title. */
export function parseLesson(id: string, raw: string): Lesson {
  const ts = ALL_TASK_STATEMENTS.find((t) => t.id === id);
  const repeat = REPEAT_UNIT.lessons.find((l) => l.id === id);
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let title: string = ts?.title ?? repeat?.title ?? id;
  const chunks: Lesson['chunks'] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && /^# /.test(line) && chunks.length === 0 && !current) {
      title = line.slice(2).trim();
      continue;
    }
    if (!inFence && /^## /.test(line)) {
      if (current) chunks.push({ title: current.title, body: current.lines.join('\n').trim() });
      current = { title: line.slice(3).trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) chunks.push({ title: current.title, body: current.lines.join('\n').trim() });
  return { id, domain: repeat ? null : ((ts?.domain ?? Number(id[0])) as DomainId), title, chunks };
}

const byId = (a: Lesson, b: Lesson) => a.id.localeCompare(b.id, undefined, { numeric: true });

export const LESSONS: Lesson[] = Object.entries(lessonFiles)
  .map(([path, raw]) => {
    const id = path.split('/').pop()!.replace('.md', '').replace('-', '.');
    return parseLesson(id, raw);
  })
  .sort(byId);

/** Repeat unit lessons: src/content/repeat/r-<n>.md => id "R.<n>". Kept out of LESSONS (the 30 task statements). */
export const REPEAT_LESSONS: Lesson[] = Object.entries(repeatFiles)
  .map(([path, raw]) => {
    const id = path.split('/').pop()!.replace('.md', '').replace('r-', 'R.');
    return parseLesson(id, raw);
  })
  .sort(byId);

export const QUESTIONS: Question[] = Object.values(questionFiles).flat();
export const FLASHCARDS: Flashcard[] = Object.values(flashcardFiles).flat();
export const CHEATSHEET: string = Object.values(cheatsheetFiles)[0] ?? '';

const domainNotesFiles = import.meta.glob('./notes.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** Compact per-domain notes, written from the lessons ("# Domain N: …" / "## N.M …" / "### Core ideas" / "### Exam traps"). */
export const DOMAIN_NOTES: string = Object.values(domainNotesFiles)[0] ?? '';

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id) ?? REPEAT_LESSONS.find((l) => l.id === id);
export const getQuestion = (id: string) => QUESTIONS.find((q) => q.id === id);
export const quickChecksFor = (lessonId: string, chunk: number) =>
  QUESTIONS.filter((q) => q.kind === 'quickcheck' && q.lesson === lessonId && q.chunk === chunk);
export const practiceQuestions = () => QUESTIONS.filter((q) => q.kind === 'practice');
/** Mock-exam pool: practice questions tagged with an official scenario (1–6). */
export const mockPool = () => QUESTIONS.filter((q) => q.kind === 'practice' && q.scenario && q.scenario <= 6);

export * from './meta';
export type * from './types';
