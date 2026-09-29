# CCAR-F Cheat Sheet

One page, five domains. Use this for a final pass, not first-time learning — every row assumes you already know the concept and just need the tie-breaker.

## Tempting vs winning

The exam gives four options that mostly "work." The winning option is the more **deterministic, efficient, or maintainable** one. The tempting option is usually plausible but loses for a specific, nameable reason.

| Situation | Winning pattern | Tempting distractor | Why it loses |
|---|---|---|---|
| A tool sequence is critical (verify identity before refund) | Programmatic prerequisite/hook blocking the later call until the first succeeds | Stronger wording in the system prompt | Prompt compliance is probabilistic; a guarantee needs code, not phrasing |
| Deciding when an agentic loop should stop | Check `stop_reason == "end_turn"` | Check for assistant text content, or cap iterations | Text output and arbitrary caps are unreliable proxies for "done" |
| A subagent needs facts the coordinator already found | Pass the findings explicitly in the Task prompt | Assume the subagent inherits conversation history | Subagents have isolated context — nothing is inherited automatically |
| Reports cover only part of a broad topic | Broaden the coordinator's task decomposition | Instruct the synthesis agent to "find coverage gaps" | The root cause is upstream (what subagents were assigned), not downstream synthesis |
| A subagent hits a timeout or failure | Return structured error context (type, attempted query, partial results, alternatives) | Return an empty result marked successful, or terminate the whole workflow | Hides information or overreacts; structured context enables an informed recovery |
| Resuming an investigation after files changed | Tell the agent exactly which files changed | Resume silently, or re-explore everything from scratch | Silent resume risks stale tool results; full re-exploration wastes what's still valid |
| Two tools have near-identical descriptions and get confused | Rewrite both descriptions to be distinct, with examples and boundaries | Add few-shot routing examples, or build a routing classifier | Description quality is the root cause; examples patch around it, a classifier over-engineers it |
| An agent has far more tools than its role needs (e.g. 18) | Scope its tool access down to its actual role | Write a longer explanation of when to use each tool | Tool *count* itself degrades selection reliability, not just description quality |
| A business rule must never be violated (refund > $500) | `PreToolUse` hook that blocks the call in code | CLAUDE.md instruction or a few-shot example | A guarantee needs enforcement outside the model's own reasoning |
| Agent ignores a more capable MCP tool in favor of built-in Grep | Strengthen the MCP tool's description with concrete capabilities and examples | Remove Grep from the toolset | Removing options overcorrects instead of fixing the actual selection signal (the description) |
| An MCP tool fails and returns "Operation failed" | Structured error metadata: category, `isRetryable`, human-readable description | A fixed blind-retry instruction | Structured metadata enables an appropriate decision; blind retry can't tell transient from unresolvable |
| Agent burns tool calls guessing what documentation/data exists | Expose the catalog as an MCP resource | Add more few-shot examples of good search queries | A resource removes the need to guess at all; examples only improve the guesses |
| A convention must apply to every file, team-wide, automatically | Project-level CLAUDE.md | Personal `~/.claude/CLAUDE.md`, copied by every teammate | User-level files aren't shared via VCS and require manual, fragile syncing |
| A convention applies by file type, scattered across many directories | `.claude/rules/` with a `paths:` glob | A CLAUDE.md file in each relevant directory | Directory CLAUDE.md doesn't scale as matching files spread or new directories appear |
| An on-demand task produces verbose output that shouldn't pollute the session | Skill with `context: fork` | A plain slash command | A plain command runs inline — it has no isolation mechanism |
| Large-scale, multi-file, architecturally ambiguous change | Plan mode, then direct execution | Direct execution with detailed upfront instructions | Assumes you already know the right structure without having explored the code |
| Natural-language instructions alone give inconsistent output | 2-4 targeted few-shot examples | Longer, more detailed prose instructions | Detail alone still doesn't generalize well to structurally varied input |
| CI needs to review code that was just generated in the same session | An independent Claude Code review instance | The same session that wrote the code reviews itself | Self-review retains its own generation reasoning and rarely challenges it |
| JSON output occasionally fails to parse | `tool_use` with a JSON schema | A prompt reminder to "double-check the JSON is valid" | The schema constrains generation structurally; a reminder is still probabilistic |
| A field is sometimes absent from the source document | Make it optional/nullable | Keep it required and trust the model not to guess | A required field pressures the model to fabricate a value rather than admit absence |
| A value doesn't fit any of the fixed enum categories | Add an `"other"` value plus a free-text detail field | Keep expanding the enum with more fixed values | A longer fixed list still can't anticipate every future edge case |
| Extracted total doesn't match the sum of line items | Extract `calculated_total` + `stated_total` + a `conflict_detected` flag | Mark `total` required so the model "double-checks" itself | Required only guarantees the field is present, not that the value is correct |
| Validation fails on a format or structural issue | Retry with the specific validation error appended to the prompt | Retry unchanged, or discard the document | An unexplained retry can't fix anything; discarding is premature for a fixable issue |
| Required information is genuinely absent from the source document | Accept `null` after a limited retry budget | Keep increasing the retry count | No amount of retrying invents data that was never in the source |
| About to batch-process a large volume of an unfamiliar document type | Refine the prompt/schema on a small sample first, then submit the full batch | Submit the full batch, fix failures by `custom_id` afterward | `custom_id` resubmission fixes isolated failures, not a systematic prompt problem across the whole batch |
| Aggregate extraction accuracy looks great (e.g. 97%) | Break accuracy down by document type and field | Trust the aggregate number and reduce human review | An aggregate can mask a specific segment performing far worse |
| Self-reported model confidence gates whether a human reviews an item | Calibrate the threshold against a labeled validation set | Pick a round-number threshold (e.g. 0.9) because it "sounds strict" | Uncalibrated self-reported confidence isn't automatically meaningful |
| Two credible sources report conflicting facts | Preserve both values with attribution and a conflict flag; let the coordinator decide | Arbitrarily pick the "more credible" source, or average the two values | Discarding or blending data hides a disagreement a reviewer would need to see |

## Which mechanism? (Claude Code configuration)

Five to six mechanisms can all "make Claude behave a certain way." This is the objective people report losing the most points on — know the scope and loading trigger of each cold.

| Mechanism | Loads / applies when | Scope | Shared via VCS? | Best for |
|---|---|---|---|---|
| Project CLAUDE.md (`.claude/CLAUDE.md` or root `CLAUDE.md`) | Every session, automatically | Whole project, every contributor | Yes | Universal, always-on team standards |
| User CLAUDE.md (`~/.claude/CLAUDE.md`) | Every session, automatically | Just you, across all your projects | No | Personal preferences that shouldn't affect teammates |
| Directory-level CLAUDE.md (in a subdirectory) | When working with files in that directory | That directory only | Yes, if committed | Conventions tied to one specific, stable part of the codebase |
| `.claude/rules/*.md` with `paths:` glob frontmatter | Only when editing a file matching the glob | Any matching file, any directory, present or future | Yes | Conventions scoped by file *type*, scattered across many directories |
| `@path` import inside CLAUDE.md | Loads together with the importing file, always | Wherever it's imported (still always-on) | Yes | Splitting a large always-on CLAUDE.md into modular files without making any part conditional |
| Slash command (`.claude/commands/name.md`) | Only when invoked by name (`/name`) | Project (shared) or `~/.claude/commands/` (personal) | Project: yes · Personal: no | A simple, fixed, reusable on-demand prompt with no need for isolation or tool limits |
| Skill (`.claude/skills/name/SKILL.md`) | Only when invoked (or matched) by name | Project (shared) or `~/.claude/skills/` (personal) | Project: yes · Personal: no | On-demand workflows that need isolation (`context: fork`), tool limits (`allowed-tools`), or argument prompts (`argument-hint`) |
| Hook (e.g. `PreToolUse`, `PostToolUse`) | Automatically, at a defined lifecycle point, every single time | Wherever configured (settings file or skill frontmatter) | Depends on which settings file | Deterministic enforcement or data transformation that must never depend on the model choosing to comply |
| Settings permissions (`allow` / `deny` / `ask` rules) | Checked before a tool call is allowed to execute | User, project, or managed settings file | Project-shared file: yes | Coarse, guaranteed allow/deny control over which tools or commands may run at all |

**Rule of thumb:** "always, for everyone" → project CLAUDE.md. "Only for files like X, wherever they live" → `.claude/rules/` + `paths:`. "Only when I ask for it" → slash command or skill. "Must be true no matter what the model decides" → hook or a permission deny rule.

## Which built-in tool?

| Need | Tool | Why | Common trap |
|---|---|---|---|
| Find files by name/extension pattern | **Glob** | Matches file *paths* directly (e.g. `**/*.test.tsx`) | Using Grep on a filename-like term, or manually scanning `Bash` `ls -R`/`find` output |
| Search file *contents* for a pattern (function name, error message, import) | **Grep** | Searches inside files across the whole codebase in one call | Reading every file "just in case," or using Glob on a content term |
| Load a file's full contents | **Read** | Direct, complete load of one file | Guessing content from a filename instead of reading it |
| Create a new file, or deliberately overwrite one | **Write** | Full-file write | Using Write for a one-line change to an existing file when a targeted Edit is safer |
| Make a targeted change with unique anchor text | **Edit** | Precise, single-location change with match verification | Using Edit when the anchor text repeats — it fails loudly rather than guessing which one |
| Edit fails: anchor text isn't unique | **Read, then Write** (documented fallback) | Load full content, resolve the right occurrence from context, write the whole file back | Retrying Edit unchanged, or a blind global find-and-replace across every occurrence |
| Run a command: tests, build, lint, git | **Bash** | Executes the project's real tooling and returns authoritative results | Hand-editing a tool's internal files (e.g. `.git/index`) to simulate what a command would do |
| Trace a function re-exported through barrel/index files | **Grep, twice** | First find every exported alias, then Grep for each alias separately | Searching only the original name and concluding the function is unused |

## Which knob when things degrade?

Several options usually "work." One actually scales.

| Symptom | First fix | Over-engineered alternative to avoid |
|---|---|---|
| Long session gives vague "typical pattern" answers instead of specifics found earlier | Scratchpad file recording key findings | Switching to a model with a bigger context window |
| Context window filling with verbose discovery output mid-investigation | Delegate to a subagent (e.g. the Explore subagent) that returns a summary | Manually trimming conversation history ad hoc |
| A blocking, user-facing request needs an answer now | Synchronous Messages API | Message Batches API (no latency guarantee, up to 24h) |
| High-volume, latency-tolerant workload (overnight/weekly reports) | Message Batches API (50% cheaper) | Running everything synchronously "to keep one code path" |
| Aggregate accuracy looks fine but reviewers keep catching errors | Break accuracy down by document type and field | Increasing the sample size behind the same aggregate number |
| Self-reported confidence gates whether an item skips human review | Calibrate the threshold against a labeled validation set | Trusting a round-number threshold because it "sounds strict" |
| One review category has a high false-positive rate, eroding trust | Add explicit, concrete criteria for that category, or temporarily disable it | A vague "be more conservative" instruction, or confidence-based filtering |
| Extraction fails validation on format/structure | Retry with the specific validation error appended to the prompt | Increasing the retry count indefinitely |
| Required information is genuinely missing from the source document | Accept `null` after a limited retry budget | More retries, hoping the data eventually appears |
| A subagent hits a transient failure (timeout, rate limit) | Local recovery inside the subagent; escalate only if unresolved | Immediately terminating the entire multi-agent workflow |

## Key facts & numbers

- **Exam:** 60 items, 120 minutes, 4 scenarios drawn from a bank of 6, scaled score 100–1000, passing score **720**.
- **Domain weights:** Agentic Architecture & Orchestration 27% · Tool Design & MCP Integration 18% · Claude Code Configuration & Workflows 20% · Prompt Engineering & Structured Output 20% · Context Management & Reliability 15%.
- **Message Batches API:** 50% cost savings vs synchronous · up to 24-hour processing window, no latency SLA · `custom_id` correlates request/response pairs (and lets you resubmit only failed documents) · does **not** support multi-turn tool calling within a single batch request.
- **`tool_choice` values:** `"auto"` (model may reply in text or call a tool) · `"any"` (model must call *some* tool) · `{"type": "tool", "name": "..."}` (model must call that specific tool).
- **`stop_reason` values driving the agentic loop:** `"tool_use"` → execute the tool, append the result, continue the loop · `"end_turn"` → the only reliable signal the task is complete.
- **Paths & flags:**
  - `.claude/rules/*.md` — YAML frontmatter `paths: ["glob", ...]` for conditional loading.
  - Skill frontmatter — `context: fork`, `allowed-tools`, `argument-hint`.
  - `@path` — import syntax inside CLAUDE.md for modular, always-loaded files.
  - CLI — `-p` / `--print` (non-interactive), `--output-format json`, `--json-schema` (structured CI output).
  - Sessions — `--resume <name>`, `fork_session`.
  - Context commands — `/compact`, `/memory`.
  - MCP scoping — `.mcp.json` (project root, shared via VCS, supports `${VAR}` env expansion) vs `~/.claude.json` (user-level, personal/experimental).

## Exam-day tips

- **Read the stem like a detective before looking at the options.** The options are deliberately built to look alike — pattern-matching on keywords gets you burned.
- **Almost every question has four plausible options.** There's rarely one that's simply wrong; the winner is the one that's more deterministic, efficient, or maintainable. Ask "which of these actually *guarantees* it, or scales, or is proportionate to the problem described?"
- **Time is more than enough.** People who've taken it report finishing with time to spare and using the last ~15 minutes purely for review — don't rush early questions out of time pressure.
- **Flag generously, especially in your first ~15 questions.** Getting into the exam's rhythm takes a few questions; more than one test-taker flagged nearly everything early on and then changed most of those answers on review once warmed up. Treat an early answer as provisional, not final.
- **Use the flag-and-return mechanic on purpose.** Flag anything uncertain and jump straight back to flagged questions once you've done a full pass — it's reported as the single most useful interface feature.
- **Don't neglect Domain 3 (Claude Code configuration) just because Domain 1 feels more intuitive.** Scenario draw is random — you may land on several configuration-heavy scenarios in one sitting, and the overlapping mechanisms (CLAUDE.md vs rules vs skills vs commands vs hooks vs permissions) are where people report losing the most points.
- **For OnVUE online proctoring, sort your room before your notes:** a clean desk, nothing on the walls behind you, no second monitor, and a sign on your door — an interruption during the exam is a real risk, not just an annoyance.
