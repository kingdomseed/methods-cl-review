import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Each test proves a JavaScript behavior bug from the code review.
// All tests should FAIL against the current index.html.

// Since the app uses script-scoped variables (not window globals), some tests
// verify behavior through DOM side-effects or by reading the source directly.

const indexPath = path.join(__dirname, '..', 'index.html');

test.describe('JavaScript behavior bugs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${indexPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#frontBody');
  });

  // Review issue #15: transitioning flag should be reset even if showCard throws
  // We prove this by removing a DOM element, triggering nextCard, and checking if
  // buttons become responsive again (transitioning=false means clicks are processed).
  test('transitioning flag resets if showCard encounters an error', async ({ page }) => {
    const uiResponds = await page.evaluate(async () => {
      // Remove a required DOM element to force an error path in showCard
      const frontBody = document.getElementById('frontBody');
      const parent = frontBody?.parentElement;
      frontBody?.remove();

      // Click "Know it" which sets transitioning=true internally
      const btnKnow = document.getElementById('btnKnow');
      btnKnow?.click();

      // Wait for all transition timeouts to complete (250ms + 300ms + buffer)
      await new Promise(r => setTimeout(r, 700));

      // Restore the element so app can function
      if (parent && frontBody) parent.appendChild(frontBody);

      // Now try clicking "Know it" again — if transitioning is stuck, the
      // stats won't update. We check if the click is processed.
      const statBefore = document.getElementById('statKnown')?.textContent;
      btnKnow?.click();
      await new Promise(r => setTimeout(r, 600));
      const statAfter = document.getElementById('statKnown')?.textContent;

      // If transitioning reset properly, the second click should be processed
      return { statBefore, statAfter, clickProcessed: statBefore !== statAfter };
    });

    // The second click should have been processed (transitioning was reset)
    expect(uiResponds.clickProcessed).toBe(true);
  });

  // Review issue #16: saveProgress should provide feedback when localStorage fails
  // Currently saveProgress has an empty catch{} that swallows errors silently.
  // We verify that a console.warn is emitted when save fails.
  test('saveProgress logs a warning when localStorage save fails', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        consoleMessages.push(msg.text());
      }
    });

    await page.evaluate(async () => {
      // Override localStorage.setItem to throw QuotaExceededError
      Storage.prototype.setItem = function () {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      };

      // Trigger a save by clicking "Know it" (nextCard -> markMastery -> saveProgress)
      document.getElementById('btnKnow')?.click();

      // Wait for transition and save attempt
      await new Promise(r => setTimeout(r, 600));
    });

    // There should be a console warning about the save failure
    const hasWarning = consoleMessages.some(m =>
      m.toLowerCase().includes('save') ||
      m.toLowerCase().includes('progress') ||
      m.toLowerCase().includes('storage')
    );
    expect(hasWarning).toBe(true);
  });

  // Review issue #6 (from JS review): Shuffle should reset transitioning flag
  // We verify by clicking Know (starts transition), immediately clicking Shuffle,
  // then trying to interact — if transitioning wasn't reset, buttons won't respond.
  test('shuffle button resets transitioning if clicked mid-transition', async ({ page }) => {
    const canInteract = await page.evaluate(async () => {
      // Start a card transition
      document.getElementById('btnKnow')?.click();

      // Immediately click shuffle while transitioning is still true (50ms into 250ms timeout)
      await new Promise(r => setTimeout(r, 50));
      document.getElementById('btnShuffle')?.click();

      // Now try to flip the card — if transitioning was reset, flipCard processes it
      const cardInner = document.getElementById('cardInner');
      const hadFlipped = cardInner?.classList.contains('flipped') ?? false;

      // Simulate space key to flip
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      await new Promise(r => setTimeout(r, 100));

      const hasFlipped = cardInner?.classList.contains('flipped') ?? false;

      return { hadFlipped, hasFlipped, flipWorked: hadFlipped !== hasFlipped };
    });

    expect(canInteract.flipWorked).toBe(true);
  });

  // Review issue #5 (from JS review): Card ID collision check
  // Verify by reading the source file and checking for 60-char prefix collisions
  test('all card IDs are unique (no 60-char prefix collisions)', async () => {
    const html = fs.readFileSync(indexPath, 'utf-8');

    // Extract question strings from CONCEPTS and FORMULAS arrays
    const qRegex = /\{q:"([^"]+)"/g;
    const questions: string[] = [];
    let match;
    while ((match = qRegex.exec(html)) !== null) {
      questions.push(match[1]);
    }

    expect(questions.length).toBeGreaterThan(100); // sanity check

    const ids = questions.map(q => q.substring(0, 60));
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});

test.describe('Performance and resource loading', () => {

  // These tests read the raw HTML source since file:// loading strips failed CDN scripts
  const html = fs.readFileSync(indexPath, 'utf-8');

  // Review issue #1: KaTeX scripts should have defer attribute
  test('KaTeX scripts use defer attribute', async () => {
    // Find script tags with katex in src
    const scriptRegex = /<script\b[^>]*katex[^>]*>/gi;
    const scripts = html.match(scriptRegex);
    expect(scripts).not.toBeNull();
    expect(scripts!.length).toBeGreaterThan(0);

    for (const script of scripts!) {
      expect(script).toMatch(/\bdefer\b/i);
    }
  });

  // Review issue #2: Google Fonts should be loaded via <link>, not @import
  test('Google Fonts loaded via <link> not @import in CSS', async () => {
    // Check for @import inside <style> block
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    const styleContent = styleMatch![1];

    // Should NOT have @import for Google Fonts
    expect(styleContent).not.toMatch(/@import\s+url\([^)]*fonts\.googleapis/);

    // Should have a <link> for Google Fonts instead
    expect(html).toMatch(/<link[^>]*href="[^"]*fonts\.googleapis\.com[^"]*"[^>]*>/);
  });

  // Review issue #3: Should have preconnect hints for CDN origins
  test('page has preconnect hints for third-party origins', async () => {
    const preconnectRegex = /<link\s+rel="preconnect"\s+href="([^"]+)"/gi;
    const preconnects: string[] = [];
    let m;
    while ((m = preconnectRegex.exec(html)) !== null) {
      preconnects.push(m[1]);
    }

    expect(preconnects).toContain('https://cdnjs.cloudflare.com');
    expect(preconnects).toContain('https://fonts.googleapis.com');
    expect(preconnects).toContain('https://fonts.gstatic.com');
  });

  // Review issue #17: Should have meta description and Open Graph tags
  test('page has meta description and basic Open Graph tags', async () => {
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{10,}"/);
    expect(html).toMatch(/<meta\s+property="og:title"\s+content="[^"]+"/);
  });
});
