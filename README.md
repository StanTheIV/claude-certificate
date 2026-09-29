# CCAR-F Trainer

Unofficial study app for the **Claude Certified Architect – Foundations** exam (CCAR-F).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production build
npm run validate   # check all content against the schema
```

## What's inside
- **Learn:** 30 lessons (one per task statement), read chunk by chunk, with quick checks after each chunk.
- **Practice:** 248 exam-style questions. Modes: by domain, task statement or scenario; mixed drill; weak spots; mechanism drill. Rate your confidence before you see the answer. Every option has its own explanation.
- **Mock exam:** 4 random official scenarios, 60 questions, 120 minutes, with flagging, a navigator, and a results page showing per-domain scores, the warm-up effect and how your flagged answers changed.
- **Review:** spaced repetition (Leitner boxes) for missed questions and flashcards.
- **Domain notes** and **Cheat sheet** for the final pass before the exam.

Progress is saved in your browser's localStorage (key `ccarf:progress:v1`). You can export and import it from Settings.

Live version: https://stantheiv.github.io/claude-certificate/ (deployed to GitHub Pages on every push to `main`).

## Content
- `src/content/`: lessons (`lessons/*.md`), questions and flashcards (`*.json`), cheat sheet, domain notes (`notes.md`, condensed from the lessons).
- `CONTENT_GUIDE.md`: authoring rules. `scripts/validate-content.mjs`: validator.
- `scripts/ui-review/round1.mjs`: Playwright script for visual UI review.

### Local-only files (gitignored)
These are used for authoring or personal study and are **not** in the repo or the deployed site:
- `sources/`: the source material (official exam guide, community study guide, Reddit experience report, colleague feedback).
- `src/content/questions/community.json` and `src/content/domain-notes.md`: copied from the community study guide (paullarionov/claude-certified-architect), which has no license. Personal study only. The app works without them, and `domain-notes.md` is no longer used (the Domain notes page reads `notes.md`).

## License
Code and original content: [MIT](LICENSE). The 12 sample questions in `official.json` come from Anthropic's published exam guide and remain Anthropic's (see [LICENSE](LICENSE)). This is an unofficial study aid, not affiliated with or endorsed by Anthropic.
