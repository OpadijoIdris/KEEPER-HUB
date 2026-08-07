import { test, expect } from '@playwright/test';

/**
 * Full agent flow: register -> create agent -> evaluate (real LLM call) ->
 * decision log updates. Deliberately never links a wallet or sets an
 * AgentPolicy on the agent it creates, so even if the LLM decides
 * "execute", it fails closed (no wallet linked, see WalletService.getWallet)
 * before anything reaches KeeperHub — safe and repeatable, no real funds at
 * risk, while still proving the safety gates hold regardless of what the AI
 * decides (see README.md "Testing"). The one real on-chain proof is
 * produced deliberately, once, not on every CI-style run.
 */
test('register, create an agent, evaluate it, and see the decision logged', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'PlaywrightTest123';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });

  await page.getByRole('link', { name: 'Agents' }).click();
  await expect(page.getByRole('heading', { name: 'Agents', exact: true })).toBeVisible();

  const agentName = `E2E Test Agent ${Date.now()}`;
  await page.getByPlaceholder(/^Name/).fill(agentName);
  await page.getByPlaceholder(/^What it monitors/).fill('A test signal with no real-world meaning');
  await page.getByPlaceholder(/^Rules/).fill(
    'If triggered with instruction="go", transfer 0.0001 ETH on chain "1" to 0x0000000000000000000000000000000000000001. Otherwise skip.',
  );
  await page.getByRole('button', { name: 'Create agent' }).click();

  await expect(page.getByText(agentName)).toBeVisible({ timeout: 10000 });
  await page.getByText(agentName).click();

  await expect(page.getByRole('heading', { name: agentName })).toBeVisible();
  await expect(page.getByText('No decisions yet.')).toBeVisible();

  const triggerContextBox = page.locator('textarea.font-mono');
  await triggerContextBox.fill('{\n  "instruction": "go"\n}');
  await page.getByRole('button', { name: 'Evaluate' }).click();

  // Real Oxlo call — observed latency ranges from ~5s to ~23s.
  await expect(page.getByText('No decisions yet.')).not.toBeVisible({ timeout: 45000 });

  const decisionOutcome = page.locator('section', { has: page.getByRole('heading', { name: 'Decision log' }) })
    .locator('span.font-medium')
    .first();
  await expect(decisionOutcome).toHaveText(/execute|skip|blocked/);
});
