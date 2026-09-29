// UI review script: screenshot the main flows at desktop+phone, light+dark.
// Usage: node scripts/ui-review/round1.mjs [baseUrl]
//
// Notes for future runs:
// - Detective mode is ON by default, so every QuestionCard (lesson quick-checks, practice, exam)
//   starts with a "Show options" gate. Click it before looking for option labels/inputs.
// - Confidence rating buttons have `role="radio"` (they sit in a `role="radiogroup"`), not the
//   implicit button role, since they're a custom radio group — use getByRole('radio', {name}).
// - Avoid `fullPage: true` on long content pages (domain notes, cheat sheet, exam full review):
//   Playwright's full-page capture stitches together scrolled frames, and `position: sticky`/`fixed`
//   elements (the top header, the mobile bottom nav) get redrawn at every stitch point, which looks
//   like a bug in the screenshot but isn't one. Use viewport-only screenshots (optionally at a couple
//   of scroll offsets) for those pages instead.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'shots');
mkdirSync(SHOTS, { recursive: true });

const BASE = process.argv[2] || 'http://localhost:5199';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

// Pages whose content can run much longer than one viewport. We cap what we capture instead of
// using fullPage, both to keep the screenshots legible (a 20000px-tall PNG downscales to mush)
// and to avoid the sticky/fixed-element stitching artifact described above.
const LONG_PAGES = new Set(['22-domain-notes', '23-cheatsheet', '17-exam-results', '02-learn-list']);

const consoleIssues = [];

function logIssue(pageLabel, type, text) {
  consoleIssues.push({ pageLabel, type, text });
}

async function withPage(browser, viewportName, colorScheme, fn) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewportName],
    colorScheme,
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') logIssue(`${viewportName}/${colorScheme}`, 'console.error', msg.text());
  });
  page.on('pageerror', (err) => {
    logIssue(`${viewportName}/${colorScheme}`, 'pageerror', String(err));
  });
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

async function shot(page, name, viewportName, colorScheme) {
  const capped = LONG_PAGES.has(name);
  const file = path.join(SHOTS, `${name}.${viewportName}.${colorScheme}.png`);
  await page.screenshot({ path: file, fullPage: !capped });
  console.log('shot:', file);
  if (capped) {
    // Also grab one scroll further down, so we see mid-page content (still viewport-sized, so legible).
    await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.35)));
    await page.waitForTimeout(80);
    const file2 = path.join(SHOTS, `${name}-mid.${viewportName}.${colorScheme}.png`);
    await page.screenshot({ path: file2, fullPage: false });
    console.log('shot:', file2);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
}

/** Detective mode is on by default: every QuestionCard needs "Show options" clicked before its fieldset exists. */
async function revealOptions(page) {
  const showOptions = page.getByRole('button', { name: 'Show options' });
  if (await showOptions.count()) {
    await showOptions.click();
    await page.waitForTimeout(80);
  }
}

async function setDarkMode(page) {
  // Navigate to settings and click the dark radio, so app-level theme state (localStorage/store)
  // matches, not just the OS-level colorScheme emulation.
  await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
  const darkRadio = page.locator('input[name="theme"]').nth(1);
  await darkRadio.check();
  await page.waitForTimeout(150);
}

async function run() {
  const browser = await chromium.launch();

  for (const viewportName of ['desktop', 'phone']) {
    for (const colorScheme of ['light', 'dark']) {
      await withPage(browser, viewportName, colorScheme, async (page) => {
        const label = `${viewportName}-${colorScheme}`;
        console.log('=== ', label, ' ===');

        // Dashboard (empty-ish state first visit)
        await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
        if (colorScheme === 'dark') await setDarkMode(page);
        await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
        await shot(page, '01-dashboard', viewportName, colorScheme);

        // Learn list
        await page.goto(`${BASE}/#/learn`, { waitUntil: 'networkidle' });
        await shot(page, '02-learn-list', viewportName, colorScheme);

        // Lesson reader - first lesson
        await page.goto(`${BASE}/#/learn/1.1`, { waitUntil: 'networkidle' });
        await shot(page, '03-lesson-chunk1', viewportName, colorScheme);

        // Answer the quick check if present (detective-mode gated)
        await revealOptions(page);
        const optionLabel = page.locator('fieldset label').first();
        if (await optionLabel.count()) {
          await optionLabel.click();
          await shot(page, '04-lesson-qc-selected', viewportName, colorScheme);
          const submitBtn = page.getByRole('button', { name: 'Submit' });
          if (await submitBtn.count()) {
            await submitBtn.click();
            await page.waitForTimeout(80);
            await shot(page, '05-lesson-qc-feedback', viewportName, colorScheme);
            const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
            if (await continueBtn.count()) await continueBtn.click();
          }
        }
        await page.waitForTimeout(100);
        await shot(page, '06-lesson-after-continue', viewportName, colorScheme);

        // Practice setup
        await page.goto(`${BASE}/#/practice`, { waitUntil: 'networkidle' });
        await shot(page, '07-practice-setup', viewportName, colorScheme);

        // Start mixed drill of 10
        const startBtn = page.getByRole('button', { name: 'Start session' });
        await startBtn.click();
        await page.waitForTimeout(200);
        await shot(page, '08-practice-question', viewportName, colorScheme);

        await revealOptions(page);
        await shot(page, '09-practice-options-shown', viewportName, colorScheme);

        // pick first option + confidence, then submit
        const firstOpt = page.locator('fieldset label').first();
        if (await firstOpt.count()) {
          await firstOpt.click();
          const sureBtn = page.getByRole('radio', { name: 'Sure' });
          if (await sureBtn.count()) await sureBtn.click();
          await shot(page, '10-practice-before-submit', viewportName, colorScheme);
          const submit = page.getByRole('button', { name: 'Submit' });
          if (await submit.count()) {
            await submit.click();
            await page.waitForTimeout(80);
            await shot(page, '11-practice-feedback', viewportName, colorScheme);
          }
        }

        // Mock exam setup
        await page.goto(`${BASE}/#/exam`, { waitUntil: 'networkidle' });
        await shot(page, '12-exam-setup', viewportName, colorScheme);

        // Start quick mode
        const quickBtn = page.getByRole('button', { name: 'Start quick mode' });
        if (await quickBtn.count()) {
          await quickBtn.click();
          await page.waitForTimeout(300);
          await revealOptions(page);
          await shot(page, '13-exam-running-q1', viewportName, colorScheme);

          // Flag it
          const flagBtn = page.getByRole('button', { name: /Flag/ });
          if (await flagBtn.count()) {
            await flagBtn.click();
            await shot(page, '14-exam-flagged', viewportName, colorScheme);
          }

          // answer it
          const opt = page.locator('fieldset label').first();
          if (await opt.count()) await opt.click();
          await page.waitForTimeout(100);

          // Go to navigator via Next a couple times, answering each along the way
          const nextBtn = page.getByRole('button', { name: 'Next' });
          for (let i = 0; i < 2; i++) {
            if (await nextBtn.isEnabled().catch(() => false)) {
              await nextBtn.click();
              await page.waitForTimeout(100);
              await revealOptions(page);
              const o = page.locator('fieldset label').first();
              if (await o.count()) await o.click();
            }
          }
          await shot(page, '15-exam-navigator', viewportName, colorScheme);

          // Open review screen
          const reviewBtn = page.getByRole('button', { name: /Review flagged/ });
          if (await reviewBtn.count()) {
            await reviewBtn.click();
            await shot(page, '16-exam-review-before-submit', viewportName, colorScheme);

            // Submit
            const submitExamBtn = page.getByRole('button', { name: 'Submit exam' });
            if (await submitExamBtn.count()) {
              await submitExamBtn.click();
              await page.waitForTimeout(100);
              const confirmBtn = page.getByRole('button', { name: 'Confirm submit' });
              if (await confirmBtn.count()) {
                await confirmBtn.click();
                await page.waitForTimeout(400);
                await shot(page, '17-exam-results', viewportName, colorScheme);
              }
            }
          }

          // discard to clean state for next viewport loop
          const startNewBtn = page.getByRole('button', { name: 'Start a new exam' });
          if (await startNewBtn.count()) await startNewBtn.click();
        }

        // Review page
        await page.goto(`${BASE}/#/review`, { waitUntil: 'networkidle' });
        await shot(page, '18-review', viewportName, colorScheme);

        // Flashcards
        await page.goto(`${BASE}/#/flashcards`, { waitUntil: 'networkidle' });
        await shot(page, '19-flashcards-home', viewportName, colorScheme);
        const domainSelect = page.locator('select').first();
        if (await domainSelect.count()) {
          await domainSelect.selectOption({ index: 1 });
          const studyDomainBtn = page.getByRole('button', { name: 'Study this domain' });
          if ((await studyDomainBtn.count()) && (await studyDomainBtn.isEnabled())) {
            await studyDomainBtn.click();
            await page.waitForTimeout(150);
            await shot(page, '20-flashcard-front', viewportName, colorScheme);
            const flip = page.locator('[role="button"]').first();
            await flip.click();
            await page.waitForTimeout(150);
            await shot(page, '21-flashcard-back', viewportName, colorScheme);
          }
        }

        // Domain notes (+ mobile jump-to select)
        await page.goto(`${BASE}/#/notes`, { waitUntil: 'networkidle' });
        await shot(page, '22-domain-notes', viewportName, colorScheme);
        if (viewportName === 'phone') {
          const jumpSelect = page.locator('select').first();
          if (await jumpSelect.count()) {
            await jumpSelect.selectOption({ index: 5 });
            await page.waitForTimeout(400);
            await shot(page, '22b-domain-notes-jumped', viewportName, colorScheme);
          }
        }

        // Cheat sheet
        await page.goto(`${BASE}/#/cheatsheet`, { waitUntil: 'networkidle' });
        await shot(page, '23-cheatsheet', viewportName, colorScheme);

        // Settings
        await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
        await shot(page, '24-settings', viewportName, colorScheme);

        // Mobile nav "More" panel
        if (viewportName === 'phone') {
          await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
          const moreBtn = page.getByRole('button', { name: 'More' });
          if (await moreBtn.count()) {
            await moreBtn.click();
            await page.waitForTimeout(120);
            await shot(page, '26-mobile-nav-more', viewportName, colorScheme);
          }
        }

        // 404
        await page.goto(`${BASE}/#/does-not-exist`, { waitUntil: 'networkidle' });
        await shot(page, '25-notfound', viewportName, colorScheme);
      });
    }
  }

  await browser.close();

  console.log('\n=== Console/page errors collected ===');
  if (consoleIssues.length === 0) {
    console.log('None.');
  } else {
    for (const issue of consoleIssues) {
      console.log(`[${issue.pageLabel}] ${issue.type}: ${issue.text}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
