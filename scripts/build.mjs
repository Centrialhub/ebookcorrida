import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { CHECKOUT_CAKTO_URL as checkoutDefault, SITE_URL as siteDefault, TRACKING } from '../config.js';
// Somente configuração pública é incorporada ao site. Nunca copiar process.env.
const CHECKOUT_CAKTO_URL = process.env.CHECKOUT_CAKTO_URL || checkoutDefault;
const SITE_URL = process.env.SITE_URL || siteDefault ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);
for (const [key, value] of Object.entries({ CHECKOUT_CAKTO_URL, SITE_URL })) {
  if (!value) { console.warn(`Aviso: ${key} ainda não configurado.`); continue; }
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${key} deve ser uma URL HTTPS sem credenciais.`);
}
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['styles.css', 'app.js', 'assets']) await cp(new URL(file, root), new URL(file, out), { recursive: true });
await writeFile(new URL('config.js', out),
  `export const CHECKOUT_CAKTO_URL = ${JSON.stringify(CHECKOUT_CAKTO_URL)};\n` +
  `export const SITE_URL = ${JSON.stringify(SITE_URL)};\n` +
  `export const TRACKING = Object.freeze(${JSON.stringify(TRACKING)});\n`);
let html = await readFile(new URL('index.html', root), 'utf8');
if (CHECKOUT_CAKTO_URL) {
  const escaped = CHECKOUT_CAKTO_URL.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  html = html.replace(/(data-buy[^>]*href=")#oferta/g, `$1${escaped}`);
  html = html.replace('Para acessar o checkout, habilite o JavaScript. Você pode consultar todo o conteúdo e as dúvidas frequentes nesta página.', 'Você pode acessar o checkout seguro pelos botões de compra.');
}
if (SITE_URL) {
  const base = new URL(SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`);
  const escaped = base.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const image = new URL('assets/og-cover.png', base).href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  html = html.replace('</head>', `<link rel="canonical" href="${escaped}">\n<meta property="og:url" content="${escaped}">\n</head>`).replaceAll('content="assets/og-cover.png"', `content="${image}"`);
  await writeFile(new URL('robots.txt', out), `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
  await writeFile(new URL('sitemap.xml', out), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}</loc></url></urlset>`);
}
await writeFile(new URL('index.html', out), html);
console.log('Build concluído: dist/ (site estático, sem dependências de runtime).');
