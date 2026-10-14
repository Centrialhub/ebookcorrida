import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { CHECKOUT_CAKTO_URL, TRACKING } from '../config.js';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
test('conteúdo completo e metadados em português', () => {
  assert.match(html, /lang="pt-BR"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/<details>/g) || []).length, 7);
  for (const id of ['guia', 'conteudo-guia', 'oferta', 'duvidas']) assert.ok(html.includes(`id="${id}"`));
  for (const distance of ['5KM', '10KM', '21KM', '42KM']) assert.ok(html.includes(distance));
  assert.match(html, /Corra Até o Fim \| Estratégia e Performance para Corredores/);
  assert.ok(!html.includes('ENERGIA DE PROVA'));
});
test('compra centralizada e sem IDs de tracking inventados', () => {
  assert.equal((html.match(/data-buy/g) || []).length, 4);
  assert.ok(!CHECKOUT_CAKTO_URL || new URL(CHECKOUT_CAKTO_URL).protocol === 'https:');
  assert.deepEqual(Object.keys(TRACKING).sort(), ['googleAnalyticsId', 'googleTagManagerId', 'metaPixelId']);
  assert.ok(!/https:\/\/.*cakto/.test(html));
});
test('todos os assets locais declarados existem', async () => {
  const assets = [...html.matchAll(/(?:src|href|content)="(assets\/[^"#]+)"/g)];
  assert.ok(assets.length > 0);
  for (const [, asset] of assets) await access(new URL(`../${asset}`, import.meta.url));
});
