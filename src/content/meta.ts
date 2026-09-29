// Domains, task statements and scenarios, transcribed from the official
// "Claude Certified Architect – Foundations Exam Guide" v1.0 (sources/exam_guide.txt).
import type { Domain, Scenario } from './types';

export const EXAM = {
  code: 'CCAR-F',
  items: 60,
  minutes: 120,
  scenariosPerExam: 4,
  passingScaled: 720,
  scaleMin: 100,
  scaleMax: 1000,
} as const;

export const DOMAINS: Domain[] = [
  {
    id: 1,
    title: 'Agentic Architecture & Orchestration',
    weight: 27,
    taskStatements: [
      { id: '1.1', title: 'Design and implement agentic loops for autonomous task execution' },
      { id: '1.2', title: 'Orchestrate multi-agent systems with coordinator-subagent patterns' },
      { id: '1.3', title: 'Configure subagent invocation, context passing, and spawning' },
      { id: '1.4', title: 'Implement multi-step workflows with enforcement and handoff patterns' },
      { id: '1.5', title: 'Apply Agent SDK hooks for tool call interception and data normalization' },
      { id: '1.6', title: 'Design task decomposition strategies for complex workflows' },
      { id: '1.7', title: 'Manage session state, resumption, and forking' },
    ],
  },
  {
    id: 2,
    title: 'Tool Design & MCP Integration',
    weight: 18,
    taskStatements: [
      { id: '2.1', title: 'Design effective tool interfaces with clear descriptions and boundaries' },
      { id: '2.2', title: 'Implement structured error responses for MCP tools' },
      { id: '2.3', title: 'Distribute tools appropriately across agents and configure tool choice' },
      { id: '2.4', title: 'Integrate MCP servers into Claude Code and agent workflows' },
      { id: '2.5', title: 'Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively' },
    ],
  },
  {
    id: 3,
    title: 'Claude Code Configuration & Workflows',
    weight: 20,
    taskStatements: [
      { id: '3.1', title: 'Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization' },
      { id: '3.2', title: 'Create and configure custom slash commands and skills' },
      { id: '3.3', title: 'Apply path-specific rules for conditional convention loading' },
      { id: '3.4', title: 'Determine when to use plan mode vs direct execution' },
      { id: '3.5', title: 'Apply iterative refinement techniques for progressive improvement' },
      { id: '3.6', title: 'Integrate Claude Code into CI/CD pipelines' },
    ],
  },
  {
    id: 4,
    title: 'Prompt Engineering & Structured Output',
    weight: 20,
    taskStatements: [
      { id: '4.1', title: 'Design prompts with explicit criteria to improve precision and reduce false positives' },
      { id: '4.2', title: 'Apply few-shot prompting to improve output consistency and quality' },
      { id: '4.3', title: 'Enforce structured output using tool use and JSON schemas' },
      { id: '4.4', title: 'Implement validation, retry, and feedback loops for extraction quality' },
      { id: '4.5', title: 'Design efficient batch processing strategies' },
      { id: '4.6', title: 'Design multi-instance and multi-pass review architectures' },
    ],
  },
  {
    id: 5,
    title: 'Context Management & Reliability',
    weight: 15,
    taskStatements: [
      { id: '5.1', title: 'Manage conversation context to preserve critical information across long interactions' },
      { id: '5.2', title: 'Design effective escalation and ambiguity resolution patterns' },
      { id: '5.3', title: 'Implement error propagation strategies across multi-agent systems' },
      { id: '5.4', title: 'Manage context effectively in large codebase exploration' },
      { id: '5.5', title: 'Design human review workflows and confidence calibration' },
      { id: '5.6', title: 'Preserve information provenance and handle uncertainty in multi-source synthesis' },
    ],
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Customer Support Resolution Agent',
    description:
      'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.',
    primaryDomains: [1, 2, 5],
    official: true,
  },
  {
    id: 2,
    title: 'Code Generation with Claude Code',
    description:
      'You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.',
    primaryDomains: [3, 5],
    official: true,
  },
  {
    id: 3,
    title: 'Multi-Agent Research System',
    description:
      'You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.',
    primaryDomains: [1, 2, 5],
    official: true,
  },
  {
    id: 4,
    title: 'Developer Productivity with Claude',
    description:
      'You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with MCP servers.',
    primaryDomains: [2, 3, 1],
    official: true,
  },
  {
    id: 5,
    title: 'Claude Code for Continuous Integration',
    description:
      'You are integrating Claude Code into your CI/CD pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives.',
    primaryDomains: [3, 4],
    official: true,
  },
  {
    id: 6,
    title: 'Structured Data Extraction',
    description:
      'You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JSON schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems.',
    primaryDomains: [4, 5],
    official: true,
  },
  {
    id: 7,
    title: 'Conversational AI Architecture Patterns (community extra)',
    description:
      'Community-reported scenario, not in the official guide: multi-turn conversational systems covering context window management, instruction persistence across turns, memory strategies, tool design for safe execution, and handling ambiguous or conflicting user inputs.',
    primaryDomains: [5, 1, 4],
    official: false,
  },
];

export const ALL_TASK_STATEMENTS = DOMAINS.flatMap((d) =>
  d.taskStatements.map((t) => ({ ...t, domain: d.id })),
);

/**
 * Final cross-domain review unit. Not an exam domain: its lessons (src/content/repeat/r-<n>.md, ids "R.<n>")
 * regroup the technical facts and trap patterns from all five domains for a last pass before the exam.
 */
export const REPEAT_UNIT = {
  title: 'Repeat: technical reference & trick questions',
  description:
    'A final pass across all five domains, regrouped the way the exam mixes them: by JSON shape, by file location, by real-vs-invented flag, and by the trap patterns behind the distractors.',
  lessons: [
    { id: 'R.1', title: 'Wire formats: the agent loop in JSON' },
    { id: 'R.2', title: 'Schema gallery: JSON you should be able to write from memory' },
    { id: 'R.3', title: 'Where things live: files, paths and frontmatter' },
    { id: 'R.4', title: 'CLI, commands, real-vs-fake and hard numbers' },
    { id: 'R.5', title: 'Trick-question families and how to spot them' },
    { id: 'R.6', title: 'Look-alike pairs: pick the right one of two' },
  ],
} as const;

export const isRepeatLessonId = (id: string) => id.startsWith('R.');
