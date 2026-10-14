import { CHECKOUT_CAKTO_URL, SITE_URL, TRACKING } from './config.js';

function validHttps(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}
const dialog = document.querySelector('#checkout-dialog');
const checkoutReady = validHttps(CHECKOUT_CAKTO_URL);
for (const link of document.querySelectorAll('[data-buy]')) {
  link.href = checkoutReady ? CHECKOUT_CAKTO_URL : '#oferta';
  link.addEventListener('click', (event) => {
    if (!checkoutReady) { event.preventDefault(); dialog.showModal(); return; }
    if (consent === 'granted') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'checkout_click', product_name: 'Corra Até o Fim', value: 29.90, currency: 'BRL', cta_location: link.dataset.location });
      if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_name: 'Corra Até o Fim', value: 29.90, currency: 'BRL' });
    }
  });
}
document.querySelectorAll('.dialog-close, .dialog-confirm').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
const mobileBar = document.querySelector('#mobile-cta');
const hero = document.querySelector('.hero');
const offer = document.querySelector('#oferta');
let heroVisible = true, offerVisible = false, frame;
function updateBar() { mobileBar.hidden = heroVisible || offerVisible || consentBannerVisible(); }
if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; updateBar(); });
  const offerObserver = new IntersectionObserver(([entry]) => { offerVisible = entry.isIntersecting; updateBar(); }, { threshold: 0.1 });
  heroObserver.observe(hero); offerObserver.observe(offer);
} else {
  window.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { heroVisible = hero.getBoundingClientRect().bottom > 0; const r = offer.getBoundingClientRect(); offerVisible = r.top < innerHeight && r.bottom > 0; updateBar(); frame = null; });
  }, { passive: true });
}

// Tracking é opcional. Nenhum script ou cookie externo é usado antes do aceite.
const consentBanner = document.querySelector('#consent-banner');
const privacyButton = document.querySelector('.privacy-settings');
const configured = Boolean(TRACKING.metaPixelId || TRACKING.googleAnalyticsId || TRACKING.googleTagManagerId);
let consent = 'unknown';
try { consent = localStorage.getItem('corra-tracking-consent') || 'unknown'; } catch { /* Armazenamento pode estar indisponível. */ }
function consentBannerVisible() { return !document.querySelector('#consent-banner').hidden; }
let trackingLoaded = false;
function loadScript(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script'); script.async = true; script.src = src; script.id = id; document.head.append(script);
}
function initializeTracking() {
  if (trackingLoaded || consent !== 'granted') return;
  trackingLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const analytics = /^G-[A-Z0-9]+$/.test(TRACKING.googleAnalyticsId);
  const gtm = /^GTM-[A-Z0-9]+$/.test(TRACKING.googleTagManagerId);
  // GTM e GA direto são mutuamente exclusivos para evitar PageViews duplicados.
  if (gtm) { window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); loadScript(`https://www.googletagmanager.com/gtm.js?id=${TRACKING.googleTagManagerId}`, 'gtm-script'); }
  else if (analytics) { loadScript(`https://www.googletagmanager.com/gtag/js?id=${TRACKING.googleAnalyticsId}`, 'ga-script'); window.gtag('js', new Date()); window.gtag('config', TRACKING.googleAnalyticsId); }
  if (/^\d+$/.test(TRACKING.metaPixelId)) {
    const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; fbq.push = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-script'); fbq('init', TRACKING.metaPixelId); fbq('track', 'PageView');
  }
}
function setConsent(value) {
  consent = value;
  try { localStorage.setItem('corra-tracking-consent', value); } catch { /* Não impede uso da página. */ }
  consentBanner.hidden = true; updateBar();
  if (value === 'granted') initializeTracking();
  else if (trackingLoaded) window.location.reload(); // Interrompe scripts carregados na sessão.
}
document.querySelector('.consent-accept').addEventListener('click', () => setConsent('granted'));
document.querySelector('.consent-decline').addEventListener('click', () => setConsent('denied'));
privacyButton.addEventListener('click', () => { consentBanner.hidden = false; updateBar(); });
if (configured) { privacyButton.hidden = false; consentBanner.hidden = consent !== 'unknown'; initializeTracking(); }

if (validHttps(SITE_URL)) {
  const base = new URL(SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`);
  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link'); canonical.rel = 'canonical'; canonical.href = base.href; if (!canonical.isConnected) document.head.append(canonical);
  const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); ogUrl.content = base.href; if (!ogUrl.isConnected) document.head.append(ogUrl);
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) document.querySelector(selector).content = new URL('assets/og-cover.png', base).href;
}
