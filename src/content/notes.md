> Condensed from this app's lessons for a last pass before the exam. Each task statement lists its core ideas and the distractors the exam uses against them. Open the lesson for the full explanation.

# Domain 1: Agentic Architecture & Orchestration (27%)

## 1.1 Design and implement agentic loops for autonomous task execution

### Core ideas
- Loop: send request with tools, receive response, inspect `stop_reason`, run requested tools, append results, repeat.
- Continue while `stop_reason == "tool_use"`; stop when `stop_reason == "end_turn"`.
- `"max_tokens"` and `"stop_sequence"` signal truncation or a hit stop string, not task completion.
- Each request is stateless: append every tool output as a `tool_result` block, or Claude effectively forgets it happened.
- In an agentic loop Claude picks the next tool from context; a code-chosen fixed sequence is a decision tree, not an agentic loop.
- An iteration cap is fine as a safety backstop, never as the primary stop signal.

### Exam traps
- **Wrong:** Scan the reply for "Task completed" or "Done". **Right:** Check `stop_reason`, because wording varies and the field is a guaranteed contract.
- **Wrong:** Stop after N iterations. **Right:** Stop on `"end_turn"`, because a cap is arbitrary: it cuts off legitimately long tasks and says nothing about whether the task is done.
- **Wrong:** Treat any assistant text as the done signal. **Right:** Rely on `stop_reason`, because text can sit alongside a `tool_use` block in the same turn.

## 1.2 Orchestrate multi-agent systems with coordinator-subagent patterns

### Core ideas
- Hub-and-spoke: subagents talk only to the coordinator, never to each other.
- The coordinator owns decomposition, delegation, aggregation, error handling and information routing.
- Routing everything through the hub gives observability, consistent error handling and controlled information flow.
- Select subagents dynamically by query complexity; don't always run the full pipeline.
- Partition scope: give each subagent distinct subtopics or source types to avoid duplicated work.
- Iterative refinement: evaluate synthesis for gaps, re-delegate with targeted queries, re-run synthesis until coverage is sufficient.

### Exam traps
- **Wrong:** Blame the synthesis or search subagent when a broad topic comes back narrow. **Right:** Fix the coordinator's decomposition, because each subagent did exactly what it was assigned.
- **Wrong:** Invoke every subagent on every query to be safe. **Right:** Pick only the relevant ones, because over-invoking wastes latency and cost.
- **Wrong:** Let subagents call each other directly for efficiency. **Right:** Route through the coordinator, because bypassing it loses observability and consistent error handling.

## 1.3 Configure subagent invocation, context passing, and spawning

### Core ideas
- Subagents are spawned via the `Task` tool; the coordinator's `allowedTools` must include `"Task"`.
- `AgentDefinition` sets each subagent's name/description, system prompt and tool restrictions (current SDK names: `prompt`, `tools`).
- Scope each subagent's tools to its role (least privilege).
- Subagents have isolated context: no inherited history, no shared memory between invocations.
- Copy prior agents' complete findings into the next subagent's prompt.
- Pass findings as structured data separating content from metadata (source URL, document name, page) to keep attribution.
- Emit multiple `Task` calls in one response to run independent subagents in parallel; write prompts as goals plus quality criteria, not rigid steps.

### Exam traps
- **Wrong:** Rewrite the coordinator's prompt so it delegates. **Right:** Add `"Task"` to `allowedTools`, because without it there is no mechanism to spawn subagents.
- **Wrong:** Give subagents shared state so they know sibling findings. **Right:** Include the findings explicitly in the `Task` prompt, because nothing is inherited or shared.
- **Wrong:** Issue `Task` calls one per turn. **Right:** Batch independent ones in a single response, because sequential spawning only adds latency.

## 1.4 Implement multi-step workflows with enforcement and handoff patterns

### Core ideas
- Prompt guidance is probabilistic; programmatic enforcement (hooks, prerequisite gates) is deterministic.
- Prompt instructions have a non-zero failure rate, even when well written.
- If a skipped step touches money, identity or safety, gate it in code.
- Canonical gate: block `process_refund` (and `lookup_order`) until `get_customer` returns a verified customer ID.
- Split multi-concern requests into distinct items, investigate in parallel on shared context, then give one unified resolution.
- Escalation handoffs must be structured and self-contained: customer ID, root cause, actions taken, recommended action, amount, reason for escalation.

### Exam traps
- **Wrong:** Add few-shot examples or stronger wording to stop skipped verification. **Right:** Add a programmatic prerequisite gate, because prompt tuning lowers the failure rate but never zeroes it.
- **Wrong:** Add a routing classifier to fix step ordering. **Right:** Add a targeted precondition check, because a classifier addresses tool availability, not ordering.
- **Wrong:** Escalate with the raw transcript. **Right:** Send a compiled field-by-field summary, because a raw transcript leaves the human to dig out the facts, while a compiled summary lets them act at once.

## 1.5 Apply Agent SDK hooks for tool call interception and data normalization

### Core ideas
- Hooks are SDK callbacks that deterministically inspect, transform or block agent actions in code.
- `PostToolUse` runs after a tool returns and before the model sees the result: it changes what the model sees.
- `PreToolUse` interception runs before a tool executes: it decides whether the call happens at all.
- Use `PostToolUse` to normalize heterogeneous MCP output (Unix timestamps, ISO 8601, numeric status codes) once, in code.
- Interception example: block `process_refund` over $500 and redirect to human escalation.
- Rule: if an occasional slip is unacceptable even once, hook it; if acceptable, prompt-guide it.

### Exam traps
- **Wrong:** Put "never approve refunds over $500" in the system prompt. **Right:** Use an interception hook, because only code guarantees the limit always holds.
- **Wrong:** Tell the model to convert date formats each turn. **Right:** Normalize in a `PostToolUse` hook, because relying on the model is unreliable and wastes reasoning.
- **Wrong:** Block the violating call with no alternative. **Right:** Block and redirect to escalation, because a bare rejection leaves the agent stuck.
- **Wrong:** Use hooks for tone or formatting. **Right:** Use a prompt, because hooks there are over-engineering.

## 1.6 Design task decomposition strategies for complex workflows

### Core ideas
- Prompt chaining (fixed pipeline) fits tasks whose shape is known and repeats, and gives reproducibility.
- Dynamic adaptive decomposition fits open-ended tasks where each step's findings decide the next subtask.
- Test: do you know every step before starting? Yes: chain. No: decompose dynamically.
- Large code reviews: per-file local pass, then a separate cross-file integration pass.
- A single pass over many files causes attention dilution: uneven depth, missed bugs, contradictory feedback.
- Open-ended example ("add comprehensive tests to a legacy codebase"): map structure, find high-impact areas, build a prioritized plan, adapt as dependencies appear.

### Exam traps
- **Wrong:** Use a larger-context model to review all files at once. **Right:** Split into per-file and integration passes, because dilution is about attention quality, not capacity.
- **Wrong:** Pre-specify every step for an unfamiliar legacy codebase. **Right:** Decompose adaptively, because scope and hidden dependencies emerge only as you investigate.
- **Wrong:** Re-plan dynamically for a standard review template. **Right:** Use a fixed chain, because re-planning a known shape adds overhead and inconsistency.

## 1.7 Manage session state, resumption, and forking

### Core ideas
- `--resume <session-name>` continues one specific named session with its accumulated context.
- `fork_session` makes independent branches from a shared analysis baseline to compare divergent approaches.
- Resumed sessions carry old tool results, which go stale if files changed since.
- When resuming after changes, name the specific modified files so the agent re-analyzes only those.
- Resume when prior context is mostly valid; start fresh with a structured summary when tool results are substantially stale.

### Exam traps
- **Wrong:** Always resume to keep maximum context. **Right:** Start fresh with a summary when results are stale, because extra context that is false is a liability.
- **Wrong:** Resume silently after code changes. **Right:** Tell the agent which files changed, because otherwise it reasons from stale Read/Grep output.
- **Wrong:** Redo the whole investigation separately for each approach. **Right:** Use `fork_session` from one baseline, because it avoids repeating shared groundwork.
- **Wrong:** Re-explore everything after any file change. **Right:** Do targeted re-analysis of the named files, because full re-exploration over-corrects.

# Domain 2: Tool Design & MCP Integration (18%)

## 2.1 Design effective tool interfaces with clear descriptions and boundaries

### Core ideas
- The model picks a tool from its `name`, `description` and `input_schema` alone; the description is the main selection mechanism, not your code.
- A strong description states what the tool does and returns, input formats with example values, edge cases and what it does not do, and when to use it instead of similar tools.
- Near-identical descriptions (`analyze_content` vs `analyze_document`) cause misrouting; fix them by naming the input type and the boundary.
- Rename misleading generic names (`analyze_content` to `extract_web_results`) so the name itself narrows expectations.
- Split an overloaded tool into purpose-specific tools with distinct contracts (`extract_data_points`, `summarize_content`, `verify_claim_against_source`).
- Keyword-sensitive system prompt wording ("always look up the customer first") can override a good description; review the prompt too.

### Exam traps
- **Wrong:** Add few-shot examples to the system prompt to stop misrouting. **Right:** Rewrite the tool descriptions first, because examples add token cost and don't fix the root cause: descriptions too thin to tell the tools apart.
- **Wrong:** Put a routing classifier in front of tool selection. **Right:** Edit the two descriptions, because a text fix solves the root cause without extra infrastructure.
- **Wrong:** Merge the two tools into one generic tool as the first fix. **Right:** Clarify boundaries, because merging is a bigger redesign than a first step warrants.
- **Wrong:** Add a hook that blocks the "wrong" tool. **Right:** Improve descriptions, because hooks enforce ordering, not choice between two ambiguous tools.

## 2.2 Implement structured error responses for MCP tools

### Core ideas
- A failed MCP tool call sets `isError: true`; the content must then tell the agent what to do next.
- Four categories: transient (timeout, service down; retryable), validation (bad input; fix then retry), business (policy violation; explain, offer alternative), permission (access denied; escalate).
- Return structured metadata: `errorCategory`, `isRetryable` boolean, and a human-readable `message`.
- For business-rule violations, pair `isRetryable: false` with a customer-friendly reason the agent can relay.
- Subagents retry transient failures locally a small, bounded number of times, then propagate the failure type, what was attempted, partial results and alternatives.
- A successful query with no matches is a valid empty result (`isError` false); a timeout or permission failure is an error, never an empty success.

### Exam traps
- **Wrong:** Return a uniform "Operation failed". **Right:** Return categorized, structured errors, because the agent can't choose between retry, fix, explain or escalate without them.
- **Wrong:** Return an empty array marked successful when the lookup failed. **Right:** Flag it as an error, because downstream steps will wrongly conclude "no matches exist".
- **Wrong:** Retry until it works, or abort the whole workflow on one failure. **Right:** Bounded local retries, then propagate with partial results, because the coordinator can then continue with a noted gap.
- **Wrong:** Treat permission denied as retryable. **Right:** Escalate, because retrying with the same access cannot succeed.

## 2.3 Distribute tools appropriately across agents and configure tool choice

### Core ideas
- Too many tools (18 instead of 4-5) degrade selection reliability, even for the tools the agent needs.
- Agents given tools outside their role misuse them (a synthesis agent doing its own web searches); give each agent only what its role needs.
- Prefer constrained tools over generic ones: `load_document` that validates URLs instead of an unrestricted `fetch_url`.
- For a high-frequency cross-role need, give a narrow tool (e.g. `verify_fact` for simple lookups) and route complex cases through the coordinator.
- `tool_choice` `{"type": "auto"}`: the model may answer in text or call a tool (default).
- `{"type": "any"}`: the model must call some tool, which guarantees structured output rather than conversational text.
- `{"type": "tool", "name": "extract_metadata"}` forces a specific tool first; handle later steps in follow-up turns.

### Exam traps
- **Wrong:** Give every agent all tools "to be safe". **Right:** Scope tools per role, because extra tools cause misuse and worse selection.
- **Wrong:** Give the synthesis agent full web search for its occasional checks. **Right:** A scoped `verify_fact` tool, because it covers the common simple case without over-provisioning.
- **Wrong:** Batch all verifications to the coordinator, or pre-cache speculatively. **Right:** A scoped on-demand tool, because batching creates blocking dependencies and caching can't predict needs.
- **Wrong:** Use `"any"` to make extraction run first. **Right:** Forced selection by name, because `"any"` guarantees a tool call but not which one.

## 2.4 Integrate MCP servers into Claude Code and agent workflows

### Core ideas
- An MCP server exposes tools (actions to call) and usually resources (content to read for context).
- All configured servers' tools are discovered at connection time and available simultaneously, alongside built-ins, so descriptions must differentiate across all of them.
- Shared team servers go in project-scoped `.mcp.json` (version-controlled); personal or experimental servers go in user-scoped `~/.claude.json`.
- Never commit secrets: reference them with env var expansion such as `${GITHUB_TOKEN}`, resolved from each developer's environment.
- Use existing community servers for standard integrations (GitHub, Jira, Slack); build custom servers only for team-specific workflows.
- Expose content catalogs (issue summaries, doc hierarchies, database schemas) as resources to avoid exploratory tool calls.
- Thin MCP tool descriptions make the agent fall back to built-ins like Grep; describe the concrete capabilities and outputs.

### Exam traps
- **Wrong:** Put a shared team server in `~/.claude.json`. **Right:** Use `.mcp.json`, because teammates only get project-scoped servers automatically.
- **Wrong:** Commit a literal API token in `.mcp.json`. **Right:** Use `${VAR}` expansion, because the file is in git history.
- **Wrong:** Build a custom Jira server "for more control". **Right:** Use the community server, because it avoids needless build and maintenance cost.
- **Wrong:** Let the agent explore with tool calls to learn what exists. **Right:** Expose a catalog as a resource, because one read replaces repeated discovery.

## 2.5 Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively

### Core ideas
- Grep searches file contents (callers of a function, error messages, imports); Glob matches file paths and names (`**/*.test.tsx`).
- Read loads a whole file; Write creates a file or replaces all its content; Edit replaces one uniquely matched snippet.
- Edit fails if its target text is not unique; the reliable fallback is Read the full file, then Write the updated version.
- Bash is the only tool that runs processes: tests, builds, installs, git commands.
- Build understanding incrementally: Grep for entry points, Read those files, Grep for usages, Read consumers; don't read everything upfront.
- When tracing through wrapper or barrel modules, first list every exported name and alias, then Grep for each.

### Exam traps
- **Wrong:** Use Grep to find all test files. **Right:** Glob, because it matches names, not contents.
- **Wrong:** Retry Edit blindly with a longer snippet after a non-unique match. **Right:** Read + Write, because seeing the whole file removes the guesswork.
- **Wrong:** Rewrite the whole file with Write for a one-line fix. **Right:** Edit, because it is a smaller, reviewable change that can't drop unrelated content.
- **Wrong:** Shell out to `grep`/`find` via Bash for searches. **Right:** Use the Grep/Glob tools, because Bash adds quoting and cross-platform risk.

# Domain 3: Claude Code Configuration & Workflows (20%)

## 3.1 Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization

### Core ideas
- Three scopes: user (`~/.claude/CLAUDE.md`), project (`.claude/CLAUDE.md` or root `CLAUDE.md`), directory (a `CLAUDE.md` in a subfolder, applied when working with files there).
- User-level files stay in one developer's home directory and are never shared through version control. Team standards belong at project level.
- Choose the narrowest scope that still reaches everyone who needs the instruction.
- `@` imports keep a file modular: `@./standards/testing.md`, with no space after `@`. Relative paths resolve from the importing file. Imports can nest (current docs: up to 4 hops); keep chains shallow. Each package can import just the standards files it needs.
- Split a monolithic `CLAUDE.md` into topic files under `.claude/rules/` (`testing.md`, `api-conventions.md`, `deployment.md`). Without `paths:`, they load like project `CLAUDE.md`.
- `/memory` shows which memory files are loaded. Run it first when behaviour differs between sessions or teammates.

### Exam traps
- **Wrong:** Tell teammates to copy the senior engineer's personal instructions. **Right:** Move them to the project-level `CLAUDE.md`, because user-level files never reach a clone.
- **Wrong:** Reword an ignored instruction more forcefully. **Right:** Check with `/memory` that the file is loaded, because the problem may be scope, not wording.
- **Wrong:** Put configuration in `.claude/config.json` with a `memory` array. **Right:** Use `CLAUDE.md` or `.claude/rules/`, because that file does not exist.

## 3.2 Create and configure custom slash commands and skills

### Core ideas
- `.claude/commands/` is project-scoped and shared through version control. `~/.claude/commands/` is personal.
- Skills live in `.claude/skills/<name>/SKILL.md` (personal: `~/.claude/skills/`) and are invoked as `/<name>`. Current docs treat skills as the main format and still support `.claude/commands/`.
- `context: fork` runs the skill in an isolated sub-agent, and only its final output returns. Use it for verbose analysis or brainstorming, not for short deterministic skills.
- `allowed-tools` limits the tools a skill can use while it runs (for example `["Write"]` only). `argument-hint` prompts for missing arguments.
- Skills load on demand for specific workflows. `CLAUDE.md` is always loaded and suits universal standards.
- To try a personal variant of a shared skill, create it in `~/.claude/skills/` under a different name.

### Exam traps
- **Wrong:** Define a team command in `CLAUDE.md` or `~/.claude/commands/`. **Right:** Put it in `.claude/commands/`, because only project scope reaches every clone.
- **Wrong:** Run a verbose codebase-analysis skill inline. **Right:** Add `context: fork`, because otherwise its output fills the main context.
- **Wrong:** Edit the shared skill to test a tweak. **Right:** Create a renamed personal variant, because edits to the shared file affect every teammate.
- **Wrong:** Put a rarely used workflow in `CLAUDE.md`. **Right:** Make it a skill, because `CLAUDE.md` uses context every session.

## 3.3 Apply path-specific rules for conditional convention loading

### Core ideas
- A `.claude/rules/` file with YAML frontmatter `paths:` (glob patterns) loads only when Claude edits a matching file.
- Conditional loading reduces irrelevant context and token use. It changes when guidance appears, and it does not enforce anything.
- Globs can match by name or extension regardless of folder (`**/*.test.tsx`) or by folder (`terraform/**/*`). `**` matches any depth.
- Conventions confined to one folder can go in a directory-level `CLAUDE.md`. Conventions for files scattered across folders (such as tests) need a `paths:` rule.
- `CLAUDE.md`, rules and skills are probabilistic context. Hooks and `permissions.deny` are deterministic enforcement.

### Exam traps
- **Wrong:** Duplicate a directory `CLAUDE.md` in every folder that contains tests. **Right:** Use one `.claude/rules/testing.md` with `paths: ["**/*.test.tsx", ...]`, because a glob reaches every directory, including new ones.
- **Wrong:** Put all conventions under headers in one root `CLAUDE.md`. **Right:** Use path-scoped rules, because a glob match is reliable and inferring the right section is not.
- **Wrong:** Create a skill for each area's conventions. **Right:** Use `paths:` rules, because a skill needs invocation and does not load automatically for a file.
- **Wrong:** Strengthen the wording for a rule that must never be broken. **Right:** Use a hook or permission rule, because no prompt-based mechanism guarantees compliance.

## 3.4 Determine when to use plan mode vs direct execution

### Core ideas
- Plan mode explores read-only (Read, Grep, Glob) and produces a plan you approve before any edits, which prevents costly rework.
- Use plan mode for large multi-file changes (for example a 45+ file library migration), several valid approaches (microservice boundaries), architectural decisions and unfamiliar codebases.
- Use direct execution for simple, well-scoped changes: a single-file fix with a clear stack trace, or one validation check.
- The Explore subagent does verbose discovery in an isolated context and returns a summary, which saves context for later phases.
- A common pattern: plan mode to investigate and design, then approve, then direct execution to implement.

### Exam traps
- **Wrong:** Always use plan mode for safety. **Right:** Use direct execution for clear single-file fixes, because planning then adds delay without reducing risk.
- **Wrong:** Start directly and switch to plan mode if complexity appears. **Right:** Use plan mode when the task already shows complexity, because discovering it mid-edit leaves half-finished changes.
- **Wrong:** Write detailed upfront instructions and execute directly. **Right:** Use plan mode, because those instructions assume a structure nobody has explored yet.
- **Wrong:** Run heavy multi-file discovery in the main conversation. **Right:** Delegate it to the Explore subagent, because raw output uses up context that later phases need.

## 3.5 Apply iterative refinement techniques for progressive improvement

### Core ideas
- If a prose description gives inconsistent results, add 2-3 concrete input/output examples that include edge cases.
- Test-driven iteration: write tests for expected behaviour, edge cases and performance first, then iterate by sharing the specific failures.
- Interview pattern: in an unfamiliar domain, have Claude ask questions first (cache invalidation, failure modes, scope, volume) so the design does not rest on unagreed assumptions.
- Send interacting issues together in one detailed message. Fix independent issues one after another.
- To fix an edge case (for example null values in a migration script), give the exact input and expected output, not a general instruction.

### Exam traps
- **Wrong:** Make the prose instruction longer and more emphatic. **Right:** Add 2-3 input/output examples, because examples remove ambiguity and more words do not.
- **Wrong:** Re-explain the bug each round without fixed tests. **Right:** Use a test suite first, because it gives a stable signal that shows whether you are converging.
- **Wrong:** Fix interacting issues one at a time. **Right:** Send them in one message, because a later fix can undo an earlier one.
- **Wrong:** Batch unrelated bugs into one request. **Right:** Fix them one after another, because each fix is then easier to verify.

## 3.6 Integrate Claude Code into CI/CD pipelines

### Core ideas
- `-p` / `--print` runs non-interactively: it processes the prompt, prints to stdout and exits. Without it, CI jobs hang waiting for input.
- `--output-format json` returns valid JSON. Add `--json-schema` to validate a specific shape, so findings can be parsed into inline PR comments.
- CI runs load `CLAUDE.md`. Put testing standards, fixture conventions and review criteria there.
- Session context isolation: the session that generated code reviews it less well, so use an independent instance for review.
- On re-runs, include the prior review's findings and ask for new or still-unaddressed issues only. For test generation, provide the existing test files to avoid duplicates.
- Slow `-p` startup (current docs): `--bare` skips auto-discovery of `CLAUDE.md`, skills, hooks, plugins and MCP servers, and needs `ANTHROPIC_API_KEY`. Add back only what the run needs, e.g. `--append-system-prompt-file` for your standards. Append keeps Claude Code's default prompt; `--system-prompt` replaces all of it, tool guidance and safety instructions included.

### Exam traps
- **Wrong:** Set `CLAUDE_HEADLESS=true`, use `--batch`, or redirect stdin from `/dev/null`. **Right:** Use `-p`, because `CLAUDE_HEADLESS` and `--batch` don't exist, and redirecting stdin is a shell workaround, not Claude Code's non-interactive mode.
- **Wrong:** Specify the output format in prose instructions. **Right:** Use `--output-format json` with `--json-schema`, because the CLI enforces the structure and prose does not.
- **Wrong:** Have the same session double-check its own output. **Right:** Use an independent review instance, because the original session tends to defend its own earlier reasoning.
- **Wrong:** Filter duplicate comments or tests afterwards with text matching. **Right:** Provide the prior findings or existing tests in context, because that fixes the missing information.

# Domain 4: Prompt Engineering & Structured Output (20%)

## 4.1 Design prompts with explicit criteria to improve precision and reduce false positives

### Core ideas
- Vague wording ("check comments are accurate", "be conservative", "only high-confidence") gives no fixed boundary, so verdicts drift between runs.
- Explicit categorical criteria act as a checklist: e.g. flag a comment only if it contradicts the code, names something that no longer exists, or is a TODO for an already-fixed bug.
- Define both sides: what to report (bugs, security) and what to skip (minor style, local idioms, missing docs).
- A high false-positive category erodes trust in every finding, including accurate ones; false-positive rate is a design constraint, not just recall.
- Anchor each severity level with a concrete code example; bare labels like "critical" are applied inconsistently.
- Temporarily disable a noisy category, fix its criteria offline against sample cases, then re-enable it.

### Exam traps
- **Wrong:** Tell the model to be more conservative. **Right:** Write explicit report/skip criteria, because a mood is not a checkable rule.
- **Wrong:** Keep the noisy category on with a disclaimer. **Right:** Temporarily disable it, because developers still have to filter every finding by hand.
- **Wrong:** Add more categories to catch more issues. **Right:** Tighten the existing noisy category, because more scope adds more noise.
- **Wrong:** Add a filtering classifier or switch models. **Right:** Fix the prompt criteria, because inconsistency from vague criteria is a prompt-design problem.

## 4.2 Apply few-shot prompting to improve output consistency and quality

### Core ideas
- When detailed instructions still yield inconsistent output, 2-4 concrete input/output examples are the most effective fix.
- Show the exact output shape (e.g. `location`, `issue`, `severity`, `suggested_fix`) so the model copies structure and level of detail.
- Pick genuinely ambiguous cases and include a short rationale for why one action beat a plausible alternative (e.g. investigate a vague complaint vs. escalate an explicit request for a human).
- Well-chosen examples teach the underlying judgment, which generalizes to novel phrasing; they are not a lookup table.
- Pairing an acceptable pattern with a similar genuine problem cuts false positives.
- In extraction, examples covering informal values (e.g. "a pinch") and varied structures (inline citations vs. bibliography) reduce fabricated or empty values.

### Exam traps
- **Wrong:** Write longer, more detailed instructions. **Right:** Add 2-4 targeted examples, because prose has already failed to converge the format.
- **Wrong:** Add many more near-duplicate examples. **Right:** Use a few diverse, ambiguous ones with reasoning, because duplicates teach one narrow pattern.
- **Wrong:** Fix extraction hallucination with a stricter schema alone. **Right:** Add few-shot examples, because a schema constrains shape, not interpretation.

## 4.3 Enforce structured output using tool use and JSON schemas

### Core ideas
- Define an extraction tool whose `input_schema` is the JSON schema, and read the data from the `tool_use` block; this eliminates JSON syntax errors.
- Schema compliance does not guarantee correct values: totals that don't sum or values in the wrong field still get through.
- `tool_choice`: `"auto"` may return plain text; `"any"` forces some tool call (use when several schemas exist and the document type is unknown); `{"type": "tool", "name": "extract_metadata"}` forces one named tool (e.g. metadata before enrichment).
- Make fields optional and nullable (`["string", "null"]`) when the source may lack them; `required` pushes the model to fabricate.
- Add `"unclear"` for genuinely ambiguous cases and `"other"` plus a detail string for values outside the list.
- Put format normalization rules (dates, currency, percentages) in the prompt alongside the schema.

### Exam traps
- **Wrong:** Ask for JSON in plain text. **Right:** Use `tool_use` with a schema, because free-text JSON can be malformed.
- **Wrong:** `tool_choice: "auto"` in a pipeline that always parses a tool call. **Right:** `"any"` or a forced tool, because `"auto"` can reply in text.
- **Wrong:** Mark every field `required`. **Right:** Make possibly-absent fields nullable, because required fields invite fabricated values.

## 4.4 Implement validation, retry, and feedback loops for extraction quality

### Core ideas
- After validation fails, send a follow-up with the original document, the failed extraction, and the specific error (e.g. `total` = 150 but line items sum to 145).
- Retry fixes format mismatches, wrong-field placement and arithmetic the model got wrong (not totals that are wrong in the source), which can be solved by re-reading the same source.
- Retry cannot recover information that isn't in the document (e.g. it lives in an amendment you didn't send); supply the source or accept null/unclear.
- Schema syntax errors are removed by tool use; semantic errors (sums, field placement) need validation.
- A `detected_pattern` field on each finding lets you group dismissed findings by pattern and tighten the criteria for that specific pattern.
- Extract `calculated_total` alongside `stated_total` and set `conflict_detected` when they disagree.

### Exam traps
- **Wrong:** Retry with a generic "try again". **Right:** Include the document, the failed output and the exact error, because the model needs something new to act on.
- **Wrong:** Keep retrying when the field is absent from the source. **Right:** Return null/unclear or fetch the missing document, because retries can't invent data.
- **Wrong:** Build a separate consistency-checking service. **Right:** Extract stated and calculated values in the same schema, because that catches discrepancies with no new infrastructure.

## 4.5 Design efficient batch processing strategies

### Core ideas
- Message Batches API: 50% cost savings, up to 24-hour processing, no guaranteed latency SLA.
- Use batch for non-blocking, latency-tolerant work (overnight reports, weekly audits, nightly test generation), and synchronous calls for blocking work (pre-merge checks, IDE review).
- A batch request does not support multi-turn tool calling, so it cannot run a tool mid-request and continue.
- `custom_id` pairs each result with its request, regardless of order.
- SLA math: submission window = SLA minus 24h (30h - 24h = 6h); submit on a tighter cadence (e.g. every 4 hours) to keep a margin.
- On partial failure, resubmit only the failed `custom_id`s, modified as needed (e.g. chunk documents that exceeded the context limit).
- Refine the prompt on a small sample synchronously before batching the full volume.

### Exam traps
- **Wrong:** Batch the pre-merge check to save cost. **Right:** Keep it synchronous, because a developer is blocked waiting.
- **Wrong:** Batch with a timeout fallback to synchronous. **Right:** Put blocking workflows on the synchronous API from the start, because the fallback adds complexity and still doesn't fix the mismatch.
- **Wrong:** Resubmit the whole batch after a few failures. **Right:** Resubmit only the failed `custom_id`s, because the rest are already done and paid for.

## 4.6 Design multi-instance and multi-pass review architectures

### Core ideas
- Self-review is limited: the generating instance keeps its reasoning context and is less likely to question its own choices.
- A second, independent instance given only the artifact (no reasoning trace or history) catches subtle issues better.
- Reviewing many files in one pass causes attention dilution: uneven depth, missed bugs, contradictory findings on identical patterns.
- Split the review: a per-file pass for local issues, then a separate integration pass for cross-file data flow (type mismatches across modules, changed contracts not updated at call sites).
- Have the verification pass report a confidence level for each finding, so findings can be routed by confidence once thresholds are calibrated (see 5.5).

### Exam traps
- **Wrong:** Add a self-review instruction or extended thinking. **Right:** Use an independent instance, because both options still run inside the generator's context.
- **Wrong:** Use a bigger model or context window so everything fits in one pass. **Right:** Per-file plus integration passes, because dilution is about depth, not capacity.
- **Wrong:** Majority vote across repeated full-PR passes. **Right:** Restructure into focused passes, because voting keeps dilution and discards real, intermittently caught bugs.
- **Wrong:** Ask developers to split their PRs. **Right:** Fix the review architecture, because splitting PRs just shifts the burden onto developers.

# Domain 5: Context Management & Reliability (15%)

## 5.1 Manage conversation context to preserve critical information across long interactions

### Core ideas
- Progressive summarization blurs transactional facts (IDs, amounts, dates, statuses, explicit customer requests) into vague prose. Summarize narrative, never the facts a decision depends on.
- Keep facts in a persistent "case facts" block that goes into every prompt verbatim, outside summarized history. In multi-issue sessions, give each issue its own entry.
- Lost in the middle: models attend to the start and end of long inputs and under-weight the middle. Put a key-findings summary first and organize details under explicit section headers.
- Tool results pile up tokens regardless of relevance (40+ fields per order lookup when about 5 matter). Trim them deterministically, e.g. with a `PostToolUse` hook, before they enter context.
- Pass the complete conversation history in each API request so the conversation stays coherent. Trim irrelevant tool fields, not turns.
- When a downstream agent has a limited budget, have upstream agents return structured data (key facts, citations, relevance scores, dates, source locations) instead of verbose reasoning.

### Exam traps
- **Wrong:** Switch to a bigger context window. **Right:** Reorder the input with key findings first and headers, because attention position, not window size, causes lost-in-the-middle.
- **Wrong:** Tell the model in the prompt to keep only the relevant order fields. **Right:** Trim them with a hook, because prompt instructions are probabilistic.
- **Wrong:** Read the refund amount from the running summary. **Right:** Keep it in a case-facts block that is never summarized, because summaries compress numbers.
- **Wrong:** Drop old turns to save tokens. **Right:** Keep full history and trim verbose tool output, because dropping turns breaks coherence.

## 5.2 Design effective escalation and ambiguity resolution patterns

### Core ideas
- Escalate on three triggers only: the customer explicitly asks for a human, the policy has a gap or needs an exception, or the agent cannot make meaningful progress. Complexity alone is not a trigger.
- If the first message explicitly asks for a human, escalate at once without investigating or offering help first.
- For frustration with no explicit request, acknowledge it and offer a resolution the agent can deliver. Escalate only if the customer asks for a human again.
- Escalate when policy is silent on the request (e.g. competitor price matching when policy covers only own-site adjustments). Do not improvise a concession or refuse outright.
- If a lookup returns multiple matches, ask for more identifiers instead of choosing one by heuristic.
- Write escalation criteria into the system prompt with few-shot escalate-vs-resolve examples. Hand the human a structured, self-contained summary.

### Exam traps
- **Wrong:** Escalate on negative sentiment. **Right:** Escalate on explicit triggers, because mood does not track case complexity.
- **Wrong:** Escalate when the model's self-rated confidence is low. **Right:** Use explicit written criteria with few-shot examples, because self-reported confidence is least reliable on hard cases.
- **Wrong:** Train an escalation classifier. **Right:** Add prompt-level criteria first, because a classifier is over-engineering before the prompt fix has been tried.
- **Wrong:** Pick the most recent matching customer. **Right:** Ask for an identifier, because acting on the wrong account costs far more than one question.

## 5.3 Implement error propagation strategies across multi-agent systems

### Core ideas
- Generic statuses such as `"search unavailable"` hide the context the coordinator needs to choose a recovery.
- Return structured error context: failure type, what was attempted, partial results and alternative approaches.
- Keep access failures (timeouts, connection errors, rate limits) separate from valid empty results, so the coordinator knows whether to retry or move on.
- Retry transient failures locally inside the subagent a bounded number of times with backoff. Propagate only unresolved errors, with the attempts and partial results.
- Both anti-patterns are wrong: suppressing an error as an empty success, and terminating the whole workflow over one subagent's failure. Continue with what succeeded and annotate the gaps.
- Add coverage annotations to the synthesis output, marking which sections are well supported and which have gaps from unavailable sources.

### Exam traps
- **Wrong:** Report a timed-out search as "no results found". **Right:** Flag it as an access failure, because a false empty result makes the coordinator think the topic has no coverage.
- **Wrong:** Abort the whole run when one subagent fails. **Right:** Continue with partial results and annotate the gaps, because aborting throws away valid completed work.
- **Wrong:** Retry indefinitely inside the subagent. **Right:** Retry a bounded number of times, then propagate with details, because endless retries add latency and never inform the coordinator.
- **Wrong:** Quietly leave an uncovered topic out of the report. **Right:** Add an explicit coverage annotation, because readers cannot check gaps they cannot see.

## 5.4 Manage context effectively in large codebase exploration

### Core ideas
- Context degrades gradually. Warning signs are inconsistent answers and talk of "typical patterns" in place of the specific classes and files found earlier.
- Delegate scoped questions (e.g. "find all test files", "trace refund flow dependencies") to subagents. They do the verbose reading in isolated contexts and return concise answers, while the main agent coordinates.
- Write key findings to scratchpad files and consult them later, so findings survive context boundaries without re-running discovery.
- Between phases, summarize the key findings and inject that summary into the next phase's subagents instead of raw output.
- For crash recovery, each agent exports its state to a known location. The coordinator loads a manifest on resume and injects that state into agent prompts.
- Use `/compact` when one long session fills with verbose discovery output. Manifests handle recovery across sessions or crashes.

### Exam traps
- **Wrong:** Trust a fluent, generic answer about the code. **Right:** Treat "typical patterns" language as degradation, because specificity, not fluency, shows the answer is grounded.
- **Wrong:** Have the main agent read all the files itself. **Right:** Delegate to a subagent that returns a summary, because this protects the main context budget.
- **Wrong:** Restart an interrupted multi-agent job from scratch. **Right:** Load the manifest and inject exported state, because completed work should not be redone.
- **Wrong:** Move to a larger context window. **Right:** Use `/compact`, delegation and scratchpads, because more room delays degradation but does not fix it.

## 5.5 Design human review workflows and confidence calibration

### Core ideas
- An aggregate accuracy figure (e.g. 97% overall) can hide weak document types or fields, because high-volume segments dominate the average.
- Before reducing human review, check accuracy by document type and by field, and automate only segments that are consistently strong.
- Keep using stratified random sampling of high-confidence extractions to measure ongoing error rates and catch new error patterns.
- Have the model output a confidence score for each field, not one per document.
- Calibrate review thresholds on a labeled validation set, never on a raw score's face value.
- Send low-confidence extractions and ambiguous or contradictory source documents to human review, so limited reviewer time goes to the cases most likely to be wrong.

### Exam traps
- **Wrong:** Reduce review because overall accuracy is 97%. **Right:** Check accuracy by document type and field first, because the aggregate can mask a weak segment.
- **Wrong:** Take one large random sample of all output. **Right:** Sample within each segment, because a flat sample under-represents low-volume segments.
- **Wrong:** Use the model's raw confidence as the threshold. **Right:** Calibrate the threshold on labeled data, because a raw score has no known link to measured accuracy.
- **Wrong:** Route only by confidence score. **Right:** Also route contradictory or ambiguous source documents to review, because a flawed source can still produce high confidence.

## 5.6 Preserve information provenance and handle uncertainty in multi-source synthesis

### Core ideas
- Summarization separates claims from their sources, and that attribution usually cannot be recovered later.
- Subagents should output structured claim-source mappings: the claim, source URL or document name, relevant excerpt and ideally a confidence indicator.
- The synthesis agent must preserve and merge those mappings. Flattening them into prose at any step loses attribution.
- When credible sources conflict, keep both values with their sources and flag the conflict, so the coordinator decides how to reconcile them.
- Require publication or data-collection dates, so that change over time is not mistaken for a contradiction.
- In the report, separate well-established findings from contested ones, keeping each source's characterization and method. Format by content type: tables for financial data, prose for news and analysis, lists for technical findings, chronological order for time series.

### Exam traps
- **Wrong:** Pass along a clean claim without its source. **Right:** Pass a structured claim-source mapping, because a lost source usually cannot be recovered downstream.
- **Wrong:** Keep the more credible-looking of two conflicting statistics. **Right:** Keep both with attribution and flag the conflict, because an arbitrary pick hides a real disagreement.
- **Wrong:** Call 10% versus 15% a contradiction. **Right:** Compare their dates first, because the difference may be a trend over time.
- **Wrong:** Write every finding as uniform prose. **Right:** Match the format to the content type, because figures in prose are harder to verify.
