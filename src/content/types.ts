// Shared content contract. UI code and content files must both conform to this.

export type DomainId = 1 | 2 | 3 | 4 | 5;

/** 1–6 = official exam scenarios (mock-exam pool). 7 = community "Conversational AI" extra (practice only). */
export type ScenarioId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Task statement id as in the official guide, e.g. "1.1", "4.6". */
export type TaskStatementId = string;

export interface TaskStatement {
  id: TaskStatementId;
  title: string;
}

export interface Domain {
  id: DomainId;
  title: string;
  /** Exam weight in percent. */
  weight: number;
  taskStatements: TaskStatement[];
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  primaryDomains: DomainId[];
  /** false for the community-only extra scenario. */
  official: boolean;
}

export interface QuestionOption {
  /** "A" | "B" | "C" | "D" (| "E" for multi-response) */
  id: string;
  /** Markdown. */
  text: string;
  /** Markdown. Why this option is right, or why it is WORSE than the correct one. Required for every option. */
  explanation: string;
}

export interface Question {
  /** Globally unique. Conventions: "off-01", "com-01", "d1-1.1-qc1", "d1-1.1-p1", "s4-01", "s6-01". */
  id: string;
  source: 'official-sample' | 'community' | 'original';
  /** Id of the question this one paraphrases, when it's a near-duplicate kept only for practice mode. Excluded from mock-exam draws in favor of the other copy. */
  duplicateOf?: string;
  /**
   * quickcheck = shown inline after a lesson chunk (needs lesson + chunk).
   * practice   = full exam-style scenario question (quiz, drills, mock exam pool).
   */
  kind: 'quickcheck' | 'practice';
  domain: DomainId;
  taskStatements: TaskStatementId[];
  /** Required for kind=practice (1–7). Optional for quickchecks. */
  scenario?: ScenarioId;
  /** Lesson id (= task statement id) for quickchecks. */
  lesson?: TaskStatementId;
  /** 0-based index of the "## " chunk in the lesson markdown this quickcheck follows. */
  chunk?: number;
  difficulty: 1 | 2 | 3;
  /** Markdown. The situation + the question. */
  stem: string;
  /** How many options to select (1 for multiple-choice; 2+ for multiple-response). Must equal correct.length. */
  selectCount: number;
  options: QuestionOption[];
  correct: string[];
  /** One-line generalisable takeaway, e.g. "Deterministic guarantees need hooks, not prompts." */
  keyPrinciple: string;
  /** Where the facts come from, e.g. "Exam Guide TS 1.4; guide_en.md §9.3". */
  sourceRef: string;
}

export interface Flashcard {
  id: string;
  domain: DomainId;
  taskStatement: TaskStatementId;
  /** Markdown. */
  front: string;
  /** Markdown. */
  back: string;
  sourceRef: string;
}

export interface Lesson {
  /** = task statement id, e.g. "3.2", or a Repeat unit id, e.g. "R.1" */
  id: TaskStatementId;
  /** null for Repeat unit lessons, which span all domains. */
  domain: DomainId | null;
  title: string;
  /** Chunks parsed from "## " headings of the markdown file. */
  chunks: { title: string; body: string }[];
}
