import { test, expect } from '@playwright/test';

// Each test proves an accessibility issue from the code review.
// All tests should FAIL against the current index.html.

test.describe('Accessibility: ARIA and focus management', () => {

  test.beforeEach(async ({ page }) => {
    const path = require('path');
    await page.goto(`file://${path.resolve(__dirname, '..', 'index.html')}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#frontBody');
  });

  // Review issue #5: Card stage should NOT use role="button" for a complex widget
  test('card stage does not use role="button"', async ({ page }) => {
    const cardStage = page.locator('#cardStage');
    const role = await cardStage.getAttribute('role');
    expect(role).not.toBe('button');
    // Should use role="region" or role="group" instead
    expect(['region', 'group']).toContain(role);
  });

  // Review issue #3: Card flip should toggle aria-hidden on card faces
  test('card flip toggles aria-hidden on front and back faces', async ({ page }) => {
    const front = page.locator('.card-front');
    const back = page.locator('.card-back');

    // Before flip: front visible, back hidden
    await expect(back).toHaveAttribute('aria-hidden', 'true');

    // Flip the card
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // After flip: front hidden, back visible
    await expect(front).toHaveAttribute('aria-hidden', 'true');
    await expect(back).not.toHaveAttribute('aria-hidden', 'true');
  });

  // Review issue #3: Card flip should announce to screen readers
  test('card flip announces answer to screen readers via aria-live', async ({ page }) => {
    const ariaLive = page.locator('#ariaLive');

    // Flip the card
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // The aria-live region should contain announcement text
    const text = await ariaLive.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  // Review issue #4: Shortcut overlay should have role="dialog"
  test('shortcut overlay has role="dialog" and aria-modal', async ({ page }) => {
    const panel = page.locator('.shortcut-panel');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
  });

  // Review issue #4: Shortcut overlay should have aria-labelledby
  test('shortcut overlay is labeled by its heading', async ({ page }) => {
    const panel = page.locator('.shortcut-panel');
    const labelledBy = await panel.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    // The referenced element should be the h3 heading
    const heading = page.locator(`#${labelledBy}`);
    await expect(heading).toHaveCount(1);
    const tag = await heading.evaluate(el => el.tagName.toLowerCase());
    expect(tag).toBe('h3');
  });

  // Review issue #4: Opening shortcut overlay should move focus into it
  test('shortcut overlay traps focus when opened', async ({ page }) => {
    // Open the overlay via keyboard shortcut
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    // Focus should be inside the shortcut panel
    const focusedInPanel = await page.evaluate(() => {
      const panel = document.querySelector('.shortcut-panel');
      return panel?.contains(document.activeElement) ?? false;
    });
    expect(focusedInPanel).toBe(true);
  });

  // Review issue #4: Closing shortcut overlay should return focus
  test('shortcut overlay returns focus to trigger on close', async ({ page }) => {
    // Click the shortcuts button to open
    await page.click('#btnShortcuts');
    await page.waitForTimeout(200);

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Focus should return to the shortcuts button
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('btnShortcuts');
  });

  // Review issue #8: Deck filter buttons should communicate active state
  test('active deck button has aria-pressed="true"', async ({ page }) => {
    // Initially "All" deck is active
    const allBtn = page.locator('[data-deck="all"]');
    await expect(allBtn).toHaveAttribute('aria-pressed', 'true');

    // Other buttons should have aria-pressed="false"
    const conceptsBtn = page.locator('[data-deck="concepts"]');
    await expect(conceptsBtn).toHaveAttribute('aria-pressed', 'false');
  });

  // Review issue #8: Switching deck updates aria-pressed
  test('switching deck updates aria-pressed on buttons', async ({ page }) => {
    await page.click('[data-deck="concepts"]');
    await page.waitForTimeout(100);

    const allBtn = page.locator('[data-deck="all"]');
    const conceptsBtn = page.locator('[data-deck="concepts"]');

    await expect(conceptsBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  });

  // Review issue #9: Progress bar should have progressbar role
  test('session progress bar has role="progressbar" with ARIA values', async ({ page }) => {
    const progressTrack = page.locator('.progress-track');
    await expect(progressTrack).toHaveAttribute('role', 'progressbar');
    await expect(progressTrack).toHaveAttribute('aria-valuemin', '0');
    await expect(progressTrack).toHaveAttribute('aria-valuemax', '100');

    const valueNow = await progressTrack.getAttribute('aria-valuenow');
    expect(valueNow).not.toBeNull();
  });

  // Review issue #9: Mastery bar should have progressbar role
  test('mastery bar has role="progressbar" with ARIA values', async ({ page }) => {
    const masteryTrack = page.locator('.mastery-track');
    await expect(masteryTrack).toHaveAttribute('role', 'progressbar');
    await expect(masteryTrack).toHaveAttribute('aria-valuemin', '0');
    await expect(masteryTrack).toHaveAttribute('aria-valuemax', '100');
  });

  // Review issue #13: Completion screen should receive focus
  test('completion screen receives focus when shown', async ({ page }) => {
    // Strategy: mark 1 card as missed, switch to "Weak" deck (1 card),
    // then mark that card known -> triggers completion on a 1-card deck.
    // We use "Weak" instead of "Missed" because initDeck('missed') clears
    // the session missed Set before filtering, yielding 0 cards. The "Weak"
    // deck reads from the persistent mastery object, which survives initDeck.

    // Mark first card as missed — updates in-memory mastery object
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(600);

    // Switch to "Weak" deck — uses mastery (not session missed Set),
    // so the 1 missed card appears as the only card in this deck
    await page.click('[data-deck="weak"]');
    await page.waitForTimeout(300);

    // Mark the one weak card as known → triggers showComplete()
    await page.keyboard.press('ArrowRight');

    // Wait for focus to land inside the completion screen
    // Uses waitForFunction per Playwright best practices instead of fixed timeout
    await page.waitForFunction(() => {
      const screen = document.getElementById('completeScreen');
      return screen?.contains(document.activeElement) ?? false;
    }, { timeout: 5000 });

    // Verify completion screen is visible and focused
    const isVisible = await page.evaluate(() =>
      document.getElementById('completeScreen')?.classList.contains('visible') ?? false
    );
    expect(isVisible).toBe(true);

    const focusInComplete = await page.evaluate(() => {
      const screen = document.getElementById('completeScreen');
      return screen?.contains(document.activeElement) ?? false;
    });
    expect(focusInComplete).toBe(true);
  });

  // Review issue: New card question should be announced after advancing
  test('advancing to next card announces the new question', async ({ page }) => {
    const ariaLive = page.locator('#ariaLive');

    // Mark card as known
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600); // wait for transition

    // The aria-live region should contain card info
    const text = await ariaLive.textContent();
    expect(text).toContain('Card');
  });
});
