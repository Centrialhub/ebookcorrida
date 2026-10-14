import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { CHECKOUT_CAKTO_URL } from '../config.js';
const port = 3107;
const server = spawn(process.execPath, ['scripts/serve.mjs', 'dist'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
try {
  await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Servidor não iniciou'); })]);
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(() => document.fonts.ready);
    // Ativa também a imagem lazy da última seção antes de conferir o carregamento.
    await page.locator('.final-cta').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `Overflow em ${width}px`);
    console.log(`✓ Layout e imagens: ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${port}`);
  if (!CHECKOUT_CAKTO_URL) {
    await page.locator('[data-location="hero"]').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(), false);
  } else {
    for (const link of await page.locator('[data-buy]').all()) assert.equal(await link.getAttribute('href'), CHECKOUT_CAKTO_URL);
  }
  await page.locator('#estrategia').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('#mobile-cta').hidden);
  await page.locator('#oferta').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#mobile-cta').hidden);
  for (const details of await page.locator('details').all()) {
    await details.locator('summary').click(); assert.equal(await details.getAttribute('open'), '');
    await details.locator('summary').click(); assert.equal(await details.getAttribute('open'), null);
  }
  console.log('✓ Compra, CTA fixo e sete respostas do FAQ');
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), []);
  console.log('✓ Axe WCAG 2.1 A/AA: nenhuma violação detectada');
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 844 } });
  const fallback = await noJs.newPage(); await fallback.goto(`http://127.0.0.1:${port}`);
  await fallback.locator('summary').first().click(); assert.equal(await fallback.locator('details').first().getAttribute('open'), '');
  assert.equal(await fallback.locator('h1').count(), 1);
  console.log('✓ Conteúdo e FAQ disponíveis sem JavaScript');
} finally { if (browser) await browser.close(); server.kill(); }
