// webook's own chrome around the campaign page: the top nav and the footer, with the labels and
// links webook.com uses (EN and AR). Square corners, like the rest of the page.
const A = '../assets/webook/';

const T = {
  en: {
    nav: [['Explore', '/en/explore'], ['Flights', '/en/flights'], ['Hotels', '/en/hotels'], ['Ticket resell', 'https://resell.webook.com/en'], ['Subscriptions', '/en/subscriptions']],
    search: 'Search on webook.com',
    account: 'Sign in',
    menu: 'Main',
    links: [
      ['Jobs & careers', 'https://apply.workable.com/webook/'],
      ['Contact us', '/en/contact-us'],
      ['Business partners', '/en/business'],
      ['Privacy policy', '/en/privacy'],
      ['Terms & conditions', '/en/terms?country_code=SA'],
      ['Care center & FAQs', 'https://wbk.zendesk.com/'],
      ['About us', '/en/about'],
      ['Startup accelerator fund', '/en/fun-startup-accelerator-fund'],
      ['Blog', 'https://webook.com/blog'],
      ['Report security vulnerability', '/security'],
      ['Ticket safety', '/ticket-safety'],
      ['Report black market activity', '/report-black-market'],
      ['Fan protection', '/fan-protection'],
    ],
    cookies: 'Cookie settings',
    follow: 'Follow webook',
    apps: 'Get the app',
    legal: [['Licensed by:', 'Minister of Tourism'], ['Company name:', 'Hala Yalla company'], ['License number:', '73109876'], ['Category:', 'General Travel and Tourism Services']],
  },
  ar: {
    nav: [['استكشف', '/ar/explore'], ['طيران', '/ar/flights'], ['فنادق', '/ar/hotels'], ['منصة إعادة البيع', 'https://resell.webook.com/ar'], ['باقات ويبوك', '/ar/subscriptions']],
    search: 'ابحث في webook.com',
    account: 'تسجيل الدخول',
    menu: 'القائمة الرئيسية',
    links: [
      ['فرص وظيفية', 'https://apply.workable.com/webook/'],
      ['تواصل معنا', '/ar/contact-us'],
      ['webook.com للأعمال', 'https://webook.com/business/ar'],
      ['سياسة الخصوصية', '/ar/privacy'],
      ['شروط الإستخدام', '/ar/terms?country_code=SA'],
      ['اسئلة متكررة', 'https://wbk.zendesk.com/'],
      ['عن ويبوك', '/ar/about'],
      ['صندوق تسريع الشركات الناشئة', '/ar/fun-startup-accelerator-fund'],
      ['مدونة ويبوك', 'https://webook.com/blog/ar/'],
      ['الإبلاغ عن ثغرة أمنية', '/security'],
      ['سلامة التذاكر', '/ticket-safety'],
      ['الإبلاغ عن نشاط السوق السوداء', '/report-black-market'],
      ['حماية المشجعين', '/fan-protection'],
    ],
    cookies: 'إعدادات الكوكيز',
    follow: 'تابع ويبوك',
    apps: 'حمّل التطبيق',
    legal: [['مرخّصة من:', 'Minister of Tourism'], ['اسم الشركة:', 'Hala Yalla company'], ['رقم الترخيص:', '73109876'], ['الفئة:', 'General Travel and Tourism Services']],
  },
};

const SOCIAL = [
  ['X', 'https://x.com/webook', 'soc-x.svg'],
  ['Instagram', 'https://www.instagram.com/webookksa', 'soc-instagram.svg'],
  ['Facebook', 'https://www.facebook.com/webookksa', 'soc-facebook.svg'],
  ['TikTok', 'https://www.tiktok.com/@webookksa', 'social-tiktok.webp'],
  ['Snapchat', 'https://www.snapchat.com/add/webook.comksa', 'social-snapchat.webp'],
  ['YouTube', 'https://www.youtube.com/@webookksa', 'soc-youtube.svg'],
];
const STORES = [
  ['App Store', 'https://apps.apple.com/us/app/webook-com-fun-things-to-do/id6468667896', 'store-apple.svg'],
  ['Google Play', 'https://play.google.com/store/apps/details?id=com.webook.android', 'store-google.svg'],
  ['AppGallery', 'https://appgallery.huawei.com/app/C109536445', 'store-huawei.svg'],
];

const abs = (href) => (href.startsWith('http') ? href : `https://webook.com${href}`);
const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="1.8"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 18.5c1.5-2.5 3.8-3.8 6.5-3.8s5 1.3 6.5 3.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
};

// the language switch keeps the rest of the address (a stop page keeps its stop)
function langHref(l) {
  const p = new URLSearchParams(location.search);
  p.set('lang', l);
  return `?${p}`;
}

export function initWebook(lang) {
  const L = T[lang];
  const nav = document.getElementById('wb-nav');
  nav.innerHTML = `
    <div class="wb-nav__in">
      <a class="wb-nav__logo" href="https://webook.com/${lang}" aria-label="webook.com"><img src="${A}wbk-logo-webookcom.svg" alt="" width="64" height="30"></a>
      <nav class="wb-nav__links" aria-label="${L.menu}">
        ${L.nav.map(([t, h]) => `<a href="${abs(h)}">${t}</a>`).join('')}
      </nav>
      <div class="wb-nav__end">
        <form class="wb-search" role="search" action="https://webook.com/${lang}/search" method="get">
          ${ICON.search}
          <input type="search" name="q" placeholder="${L.search}" aria-label="${L.search}">
        </form>
        <a class="wb-nav__icon wb-nav__search-m" href="https://webook.com/${lang}/search" aria-label="${L.search}">${ICON.search}</a>
        <nav class="lang" aria-label="Language">
          <a class="lang__btn" href="${langHref('en')}" hreflang="en" lang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a>
          <a class="lang__btn" href="${langHref('ar')}" hreflang="ar" lang="ar"${lang === 'ar' ? ' aria-current="true"' : ''}>AR</a>
        </nav>
        <img class="wb-nav__sar" src="${A}currency_sar.svg" alt="SAR" width="16" height="18">
        <a class="wb-nav__icon" href="https://webook.com/${lang}/login" aria-label="${L.account}">${ICON.user}</a>
      </div>
    </div>`;

  const foot = document.getElementById('wb-foot');
  foot.innerHTML = `
    <div class="wb-foot__in">
      <div class="wb-foot__top">
        <a class="wb-foot__logo" href="https://webook.com/${lang}" aria-label="webook.com"><img src="${A}wbk-logo-webookcom.svg" alt="" width="104" height="48"></a>
        <div class="wb-foot__group">
          <p class="wb-foot__k">${L.follow}</p>
          <ul class="wb-foot__social">
            ${SOCIAL.map(([n, h, i]) => `<li><a href="${h}" target="_blank" rel="noopener" aria-label="${n}"><img src="${A}${i}" alt="" width="24" height="24"></a></li>`).join('')}
          </ul>
        </div>
        <div class="wb-foot__group">
          <p class="wb-foot__k">${L.apps}</p>
          <ul class="wb-foot__stores">
            ${STORES.map(([n, h, i]) => `<li><a href="${h}" target="_blank" rel="noopener" aria-label="${n}"><img src="${A}${i}" alt="" height="40"></a></li>`).join('')}
          </ul>
        </div>
      </div>
      <ul class="wb-foot__links">
        ${L.links.map(([t, h]) => `<li><a href="${abs(h)}">${t}</a></li>`).join('')}
      </ul>
      <div class="wb-foot__bottom">
        <button class="wb-foot__cookies" type="button">${L.cookies}</button>
        <p class="wb-foot__copy">© 2026 webook.com</p>
        <dl class="wb-foot__legal">
          ${L.legal.map(([k, v]) => `<div><dt>${k}</dt><dd lang="en">${v}</dd></div>`).join('')}
        </dl>
      </div>
    </div>`;
}
