# Content Authoring Guide (read fully before writing any content)

This app teaches the **Claude Certified Architect – Foundations (CCAR-F)** exam. The content must be accurate, grounded in the sources, and train *judgement*, not recall.

## 1. Sources — read these FIRST, in this order

| # | Path | What it is | Authority |
|---|------|-----------|-----------|
| 1 | `sources/exam_guide.txt` (text of `sources/exam_guide.pdf`) | **Official exam guide v1.0.** Domains, task statements (Knowledge of / Skills in), 6 scenarios, 12 sample questions, appendix. | **Highest.** Exam answers follow this. |
| 2 | `sources/guide_en.md` | Community study guide (paullarionov/claude-certified-architect). Theory chapters 1–13, domain notes, 12 explained examples, 76 practice questions. | High, but secondary. If it conflicts with #1, #1 wins. |
| 3 | `sources/reddit_post.md` | Experience report from someone who passed (833). Exam is judgement-based; weak spots were overlapping Claude Code config mechanisms and "which knob when things degrade". | Study-strategy and emphasis only, not technical facts. |
| 4 | Official docs (use WebFetch **only** to verify a specific fact you are unsure of, max ~6 fetches per agent): `https://code.claude.com/docs/en/memory`, `.../skills`, `.../hooks`, `.../sub-agents`, `.../mcp`, `.../headless`, `https://platform.claude.com/docs/en/build-with-claude/tool-use`, `.../message-batches`, `https://platform.claude.com/docs/en/agent-sdk/overview`, `.../agent-sdk/hooks`, `.../agent-sdk/subagents`, `.../agent-sdk/sessions`, `https://modelcontextprotocol.io/docs/concepts/tools` | Current product docs | Use to verify facts. If the docs describe newer behaviour that differs from the exam guide, **teach the exam guide's version** and optionally add a short "> **Note (current docs):** …" callout. |

### Anti-hallucination rules (strict)
- Every technical claim (flag names, file paths, frontmatter keys, API params, numbers like "50%", "24 hours", "$500", "4-5 tools") must appear in source #1 or #2, or be verified in #4. **If you can't find it, leave it out.**
- Do **not** invent CLI flags, env vars, config files, frontmatter keys or API fields. The exam uses invented ones as distractors (`CLAUDE_HEADLESS`, `--batch`, `.claude/config.json`). You may use those invented names **only as wrong options**, and the explanation must say they don't exist.
- Stay inside scope. Section 17 of the exam guide lists out-of-scope topics (fine-tuning, auth/billing, streaming, vision, computer use, rate limits, tokenization, cloud provider config, …). Don't teach them.
- Fill in each question's `sourceRef` honestly, e.g. `"Exam Guide TS 2.2; guide_en.md §10.1"`.

## 2. Contract & validation
- Types: `src/content/types.ts`. Domain/scenario ids: `src/content/meta.ts`.
- Run `node scripts/validate-content.mjs --stats` after writing, and fix **all** errors before you finish. Also fix warnings about your own files (the "lesson file not found (yet)" warning is fine if another agent owns that lesson).
- Only write to the files you're assigned. Never edit other agents' files, types, meta, or the validator.

## 3. Lessons — `src/content/lessons/<d>-<n>.md` (e.g. `2-3.md` = task statement 2.3)
Format:
```
# <Short lesson title>

## <Chunk 1 title>
...markdown...

## <Chunk 2 title>
...
```
- Each `## ` heading starts a **chunk**. The app shows one chunk at a time, then its quick-check questions. Chunk indexes are **0-based** in heading order.
- Write **4–6 chunks** per lesson, each about **120–300 words**. One idea per chunk. Build the ideas in order: concept, then mechanism/how, then a worked example, then the trade-offs.
- Cover **every** "Knowledge of" and "Skills in" bullet of the task statement in the official guide.
- Use concrete examples from the scenarios (get_customer / process_refund, research coordinator, CI review, extraction pipeline…). Use short code or config snippets (JSON, YAML frontmatter, Python/TS pseudo-code, CLI) where they help.
- Callouts (blockquotes, rendered specially by the UI):
  - `> **Exam trap:** …` a tempting wrong choice and why it loses
  - `> **Key idea:** …` the one thing to remember
  - `> **Note (current docs):** …` optional, only if verified
- The **last chunk** must be titled `## Exam lens: why the distractors lose`. It should list 3–6 "tempting but worse" patterns for this task statement and give the deciding principle for each (e.g. *prompt instruction vs programmatic hook → deterministic guarantee wins when money/identity is at stake*).
- Write plain, clear English. Many learners aren't native speakers: use short sentences, define jargon once, avoid idioms.

### Repeat unit — `src/content/repeat/r-<n>.md` (id `R.<n>`, listed in `REPEAT_UNIT` in `meta.ts`)
The last block on the Learn page is a cross-domain review, not a sixth domain. It must **regroup** facts (by JSON shape, file location, real-vs-invented, trap family, look-alike pair), never copy lesson text 1:1. Same chunk format as lessons; quickchecks live in `questions/repeat.json` with `lesson: "R.<n>"` and the real `domain`/`taskStatements` they test.

## 4. Questions — JSON arrays in `src/content/questions/*.json`
Two kinds:
- **quickcheck**: 1–2 per chunk (not required for the "Exam lens" chunk). Short, one concept, difficulty 1–2. Needs `lesson` and `chunk`. `scenario` is optional.
- **practice**: full exam-style scenario questions, difficulty 2–3, with `scenario` set to 1–6 (the best-fitting official scenario).

### How to write quickchecks (retrieval, not recognition)
Learner feedback: quickchecks that repeat the sentence directly above them feel pointless. They test whether you can find text, not whether you understood it. Rules:
- **Never copy a phrase from the chunk into the stem or the correct option.** You must not be able to find the answer by matching words to the text above.
- **Make the learner apply the idea.** Give a *new* 1–3 sentence mini-situation that isn't the chunk's own example, and ask what to do, what goes wrong, or which of two close concepts applies. Other good forms: "predict the consequence" and "spot the flaw in this config or snippet".
- Repeating important ideas is good, as long as the question makes you *use* the idea in a new context rather than restate it.
- **About ⅓ of quickchecks should test an EARLIER chunk** of the same lesson, or a closely related earlier lesson (spaced retrieval and interleaving). A quickcheck placed after chunk *n* may test anything from chunks 0…*n*.
- Distractors should be the misconceptions a learner would plausibly still hold after skimming. None should be obviously silly.
- Explanations stay short (1–2 sentences) and point back to the idea, not to "as stated above".

### How to write exam-style (judgement) questions
The real exam: *"Almost every question gave four plausible options. Often all four would technically work. Which one is more efficient, more deterministic, or more maintainable."*
- The stem gives a concrete production situation, often with numbers or log evidence ("in 12% of cases…", "55% first-contact resolution"). It ends with a clear ask ("most effective first step", "most likely root cause", "best enables…").
- **All 4 options must be plausible**, and the three distractors must be *worse* in a specific way. Typical distractor types:
  1. Probabilistic fix where you need a deterministic one (prompt/few-shot instead of hook/gate).
  2. Over-engineered (classifier, routing layer, new infrastructure) when a first-step fix exists.
  3. Solves a different problem than the one described (e.g. tool availability vs tool ordering).
  4. Right idea, wrong scope or place (user-level vs project-level; subdirectory CLAUDE.md vs glob rules).
  5. Hides information (generic error, empty-as-success) or overreacts (terminate the whole workflow).
  6. Misconception ("bigger context window fixes attention dilution", "self-reported confidence is calibrated").
  7. Non-existent feature (only as a distractor, and the explanation must say it doesn't exist).
- **Every option needs an `explanation`**: for the correct one, why it wins; for each distractor, *why it's worse than the correct one* (not just "incorrect").
- **Randomize the correct letter** so A/B/C/D each appear about 25% of the time across your set. **Don't make the correct option the longest**: keep option lengths similar.
- **The UI shuffles option order.** Never refer to options by letter inside `stem`, `text` or `explanation` ("unlike B…", "both A and C"). Refer to them by content instead ("Unlike the few-shot approach…").
- `keyPrinciple`: one generalizable sentence the learner should carry away.
- Multiple-response (select 2) is allowed occasionally (≤10% of your set): `selectCount: 2`, `correct` has 2 ids, and the stem says "(Select TWO.)".
- Option `id`s: "A","B","C","D" (and "E" for multi-response). Stems and options can use Markdown (inline `code`).

### Id conventions (must be globally unique)
- quickcheck: `d<domain>-<ts>-qc<n>` e.g. `d2-2.3-qc1`
- practice from domain agents: `d<domain>-<ts>-p<n>` e.g. `d2-2.3-p1`
- official samples: `off-01` … `off-12`; community: `com-01` … `com-76`
- new scenario sets: `s4-01…`, `s6-01…`
- flashcards: `fc-<ts>-<n>` e.g. `fc-3.2-1`

## 5. Flashcards — `src/content/flashcards/*.json`
Keep this deck **small and precise**. The Reddit author found that recall isn't the bottleneck, so cards cover only canonical paths, frontmatter fields, CLI flags, API parameter values, and hard numbers. Examples: `.claude/rules/` `paths:` frontmatter; `context: fork`; `-p` / `--output-format json` / `--json-schema`; `tool_choice` values; `stop_reason` values; Batches = 50% / 24h / `custom_id`; `.mcp.json` vs `~/.claude.json`; `${VAR}` expansion. Write **2–5 cards per task statement**, and only where such facts exist.
