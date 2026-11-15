// Checkout for the whole trip at once: every tour and stay from the trip list, each with its date
// and guests or nights, one set of contact details, one payment, one total. It is a prototype:
// nothing is charged or booked; the confirmation says so.
import { pad2 } from './labels.js?v=27';
import { initWebook } from './webook.js?v=27';
import { initTrip, TRIP_ICON } from './trip.js?v=27';
import { money } from './money.js?v=27';

const html = document.documentElement;
const lang = html.lang === 'ar' ? 'ar' : 'en';
const reduced = html.classList.contains('is-reduced-motion');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');

const CL = {
  en: {
    trail: 'Northern Trail',
    title: 'Check out your trip',
    sub: (n) => `${n === 1 ? '1 item' : `${n} items`} along the road, booked in one go.`,
    s1: 'Your trip',
    s2: 'Your details',
    s3: 'Payment',
    date: 'Date',
    checkin: 'Check-in',
    checkout: (d) => `Check-out ${d}`,
    guests: 'Guests',
    nights: 'Nights',
    less: 'Fewer',
    more: 'More',
    remove: 'Remove',
    name: 'Full name',
    email: 'Email',
    phone: 'Mobile number',
    mada: 'mada',
    card: 'Credit or debit card',
    apple: 'Apple Pay',
    proto: 'This is a prototype. No payment is taken and nothing is booked.',
    summary: 'Summary',
    total: 'Total',
    pay: (n) => `Pay ${n}`,
    sar: (n) => `¤${n}`,
    free: 'Free',
    stop: (n, name) => `Stop ${n} · ${name}`,
    tour: 'Experience',
    stay: 'Stay',
    needDate: 'Choose a date.',
    needName: 'Enter your full name.',
    needEmail: 'Enter a valid email address.',
    needPhone: 'Enter a 9 digit Saudi mobile number.',
    needPay: 'Choose a payment method.',
    fix: (n) => (n === 1 ? 'One thing needs your attention.' : `${n} things need your attention.`),
    emptyT: 'Your trip is empty',
    emptyH: 'Add tours, stays or bundles from the trail, then come back here to book them together.',
    back: 'Back to the trail',
    doneK: 'Prototype confirmation',
    doneT: 'Your trip is booked',
    doneH: (e) => `In the real flow, the tickets and stay vouchers would be sent to ${e}.`,
    ref: 'Trip reference',
    again: 'Plan another trip',
    stepOf: (a, b) => `Step ${a} of ${b}`,
  },
  ar: {
    trail: 'مسار الشمال',
    title: 'احجز رحلتك',
    sub: (n) => `${n === 1 ? 'عنصر واحد' : n === 2 ? 'عنصران' : `${n} عناصر`} على امتداد الطريق، تُحجز مرة واحدة.`,
    s1: 'رحلتك',
    s2: 'بياناتك',
    s3: 'الدفع',
    date: 'التاريخ',
    checkin: 'تاريخ الوصول',
    checkout: (d) => `المغادرة ${d}`,
    guests: 'الضيوف',
    nights: 'الليالي',
    less: 'أقل',
    more: 'أكثر',
    remove: 'حذف',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الجوال',
    mada: 'مدى',
    card: 'بطاقة ائتمان أو خصم',
    apple: 'Apple Pay',
    proto: 'هذا نموذج أولي. لا يتم خصم أي مبلغ ولا يتم حجز أي شيء.',
    summary: 'الملخص',
    total: 'المجموع',
    pay: (n) => `ادفع ${n}`,
    sar: (n) => `¤${n}`,
    free: 'مجانًا',
    stop: (n, name) => `المحطة ${n} · ${name}`,
    tour: 'تجربة',
    stay: 'إقامة',
    needDate: 'اختر التاريخ.',
    needName: 'أدخل اسمك الكامل.',
    needEmail: 'أدخل بريدًا إلكترونيًا صحيحًا.',
    needPhone: 'أدخل رقم جوال سعوديًا من 9 أرقام.',
    needPay: 'اختر طريقة الدفع.',
    fix: (n) => (n === 1 ? 'هناك أمر واحد يحتاج انتباهك.' : `هناك ${n} أمور تحتاج انتباهك.`),
    emptyT: 'رحلتك فارغة',
    emptyH: 'أضف جولات أو إقامات أو باقات من المسار، ثم عد إلى هنا لحجزها معًا.',
    back: 'العودة إلى المسار',
    doneK: 'تأكيد تجريبي',
    doneT: 'تم حجز رحلتك',
    doneH: (e) => `في التجربة الحقيقية، تُرسل التذاكر وقسائم الإقامة إلى ${e}.`,
    ref: 'رقم الرحلة',
    again: 'خطط لرحلة أخرى',
    stepOf: (a, b) => `الخطوة ${a} من ${b}`,
  },
};
const C = CL[lang];
const CHECK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m12 25 8 8 16-18" fill="none" stroke="currentColor" stroke-width="3.5"/></svg>';

const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmt = (s) => {
  if (!s) return '';
  const d = new Date(`${s}T12:00:00`);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

async function boot() {
  initWebook(lang);
  const data = await fetch('../assets/content.json').then((r) => r.json());
  const t = (o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
  const asset = (p) => (p ? `../${p}` : '');
  const trip = initTrip({ data, lang, t, asset, page: 'index.html' });
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const root = document.getElementById('co');
  const price = (n) => (n === 0 ? C.free : C.sar(num(n)));
  const today = iso(new Date());

  const dates = {}; // id -> yyyy-mm-dd (kept while the page is open)
  const form = { name: '', email: '', phone: '', pay: '' };
  let errors = {};

  function rowHTML({ id, qty, item }) {
    const s = stopBy[item.stop];
    const isTour = item.kind === 'tour';
    const unit = isTour ? C.guests : C.nights;
    const out = !isTour && dates[id] ? (() => {
      const d = new Date(`${dates[id]}T12:00:00`);
      d.setDate(d.getDate() + qty);
      return C.checkout(fmt(iso(d)));
    })() : '';
    const err = errors[`d:${id}`];
    return `
      <li class="co-row" data-id="${id}">
        <img class="co-row__img" src="${asset(item.photo)}" alt="" loading="lazy">
        <div class="co-row__main">
          <p class="co-row__k">${esc(isTour ? C.tour : C.stay)}${s ? ` · ${esc(C.stop(pad2(s.n), t(s.name)))}` : ''}</p>
          <h3 class="co-row__t">${esc(t(item.title))}</h3>
          <div class="co-row__fields">
            <label class="co-field co-field--date${err ? ' is-bad' : ''}">
              <span class="co-field__l">${esc(isTour ? C.date : C.checkin)}</span>
              <input type="date" min="${today}" value="${dates[id] || ''}" data-date="${id}" required${err ? ` aria-invalid="true" aria-describedby="e-${id.replace(/[^\w-]/g, '_')}"` : ''}>
              ${err ? `<span class="co-err" id="e-${id.replace(/[^\w-]/g, '_')}">${esc(err)}</span>` : out ? `<span class="co-field__h">${esc(out)}</span>` : ''}
            </label>
            <div class="co-field">
              <span class="co-field__l" id="u-${id.replace(/[^\w-]/g, '_')}">${esc(unit)}</span>
              <div class="co-qty" role="group" aria-labelledby="u-${id.replace(/[^\w-]/g, '_')}">
                <button type="button" data-step="-1" aria-label="${esc(C.less)}: ${esc(unit)}"${qty <= 1 ? ' disabled' : ''}>−</button>
                <output>${qty}</output>
                <button type="button" data-step="1" aria-label="${esc(C.more)}: ${esc(unit)}"${qty >= 20 ? ' disabled' : ''}>+</button>
              </div>
            </div>
          </div>
        </div>
        <div class="co-row__end">
          <span class="co-row__sum">${money(esc(price(item.price * qty)))}</span>
          <button type="button" class="co-row__rm" data-rm>${esc(C.remove)}</button>
        </div>
      </li>`;
  }

  function field(key, label, type, attrs = '') {
    const err = errors[key];
    return `
      <label class="co-field co-field--text${err ? ' is-bad' : ''}">
        <span class="co-field__l">${esc(label)}</span>
        ${key === 'phone'
          ? `<span class="co-phone" dir="ltr"><span class="co-phone__cc">+966</span><input type="tel" name="phone" inputmode="numeric" autocomplete="tel-national" maxlength="9" value="${esc(form.phone)}" ${attrs}${err ? ' aria-invalid="true" aria-describedby="e-phone"' : ''}></span>`
          : `<input type="${type}" name="${key}" value="${esc(form[key])}" ${attrs}${err ? ` aria-invalid="true" aria-describedby="e-${key}"` : ''}>`}
        ${err ? `<span class="co-err" id="e-${key}">${esc(err)}</span>` : ''}
      </label>`;
  }

  function render() {
    const items = trip.items();
    if (!items.length) {
      root.innerHTML = `
        <div class="nt-wrap co-empty">
          <span class="co-empty__i">${TRIP_ICON.trip}</span>
          <h1 class="co-empty__t">${esc(C.emptyT)}</h1>
          <p class="co-empty__h">${esc(C.emptyH)}</p>
          <a class="nt-btn nt-btn--light" href="index.html?lang=${lang}#tours">${esc(C.back)}</a>
        </div>`;
      return;
    }
    const total = trip.total();
    const nErr = Object.keys(errors).length;
    root.innerHTML = `
      <div class="nt-wrap co-wrap">
        <nav class="sp-crumbs co-crumbs" aria-label="Breadcrumb"><ol><li><a href="index.html?lang=${lang}">${esc(C.trail)}</a></li><li><span aria-current="page">${esc(C.title)}</span></li></ol></nav>
        <header class="co-head">
          <h1 class="co-title">${esc(C.title)}</h1>
          <p class="co-sub">${esc(C.sub(items.length))}</p>
        </header>
        ${nErr ? `<p class="co-alert" role="alert" tabindex="-1">${esc(C.fix(nErr))}</p>` : ''}
        <form class="co-grid" novalidate>
          <div class="co-steps">
            <section class="co-step" aria-labelledby="co-s1">
              <h2 class="co-step__t" id="co-s1"><b>01</b>${esc(C.s1)}</h2>
              <ol class="co-list">${items.map(rowHTML).join('')}</ol>
            </section>
            <section class="co-step" aria-labelledby="co-s2">
              <h2 class="co-step__t" id="co-s2"><b>02</b>${esc(C.s2)}</h2>
              <div class="co-fields">
                ${field('name', C.name, 'text', 'autocomplete="name"')}
                ${field('email', C.email, 'email', 'autocomplete="email" dir="ltr"')}
                ${field('phone', C.phone, 'tel')}
              </div>
            </section>
            <section class="co-step" aria-labelledby="co-s3">
              <h2 class="co-step__t" id="co-s3"><b>03</b>${esc(C.s3)}</h2>
              <fieldset class="co-pay${errors.pay ? ' is-bad' : ''}"${errors.pay ? ' aria-describedby="e-pay"' : ''}>
                <legend class="ntc-sr">${esc(C.s3)}</legend>
                ${[['mada', C.mada], ['card', C.card], ['apple', C.apple]].map(([k, l]) => `
                  <label class="co-pay__o"><input type="radio" name="pay" value="${k}"${form.pay === k ? ' checked' : ''}><span class="co-pay__box" aria-hidden="true"></span><span class="co-pay__l">${esc(l)}</span></label>`).join('')}
                ${errors.pay ? `<span class="co-err" id="e-pay">${esc(errors.pay)}</span>` : ''}
              </fieldset>
              <p class="co-proto"><i aria-hidden="true"></i>${esc(C.proto)}</p>
            </section>
          </div>
          <aside class="co-sum" aria-labelledby="co-sum-t">
            <div class="co-sum__in">
              <h2 class="co-sum__t" id="co-sum-t">${esc(C.summary)}</h2>
              <ul class="co-sum__list">
                ${items.map(({ qty, item }) => `<li><span>${esc(t(item.title))} <small dir="ltr">× ${qty}</small></span><b>${money(esc(price(item.price * qty)))}</b></li>`).join('')}
              </ul>
              <p class="co-sum__total"><span>${esc(C.total)}</span><b>${money(esc(price(total)))}</b></p>
              <button class="nt-btn co-pay-btn" type="submit">${money(esc(C.pay(price(total))))}</button>
            </div>
          </aside>
        </form>
      </div>`;
    root.removeAttribute('aria-busy');
  }

  // keep typed values while the list re-renders
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.date) {
      dates[el.dataset.date] = el.value;
      return;
    }
    if (el.name in form) form[el.name] = el.name === 'phone' ? el.value.replace(/\D/g, '').slice(0, 9) : el.value;
    if (el.name === 'phone' && el.value !== form.phone) el.value = form.phone;
  });
  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.date) {
      dates[el.dataset.date] = el.value;
      delete errors[`d:${el.dataset.date}`];
      render();
      root.querySelector(`[data-date="${CSS.escape(el.dataset.date)}"]`)?.focus();
    }
    if (el.name === 'pay') form.pay = el.value;
  });
  root.addEventListener('click', (e) => {
    const row = e.target.closest('.co-row');
    const step = e.target.closest('[data-step]');
    if (row && step) {
      const x = trip.items().find((y) => y.id === row.dataset.id);
      trip.setQty(x.id, x.qty + Number(step.dataset.step));
      render();
      root.querySelector(`.co-row[data-id="${CSS.escape(x.id)}"] [data-step="${step.dataset.step}"]:not(:disabled)`)?.focus();
      return;
    }
    if (row && e.target.closest('[data-rm]')) {
      trip.remove(row.dataset.id);
      delete dates[row.dataset.id];
      render();
      root.querySelector('.co-row__rm, .co-empty a')?.focus();
    }
  });
  trip.onChange(() => {
    if (!root.querySelector('.co-done')) render();
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    errors = {};
    const items = trip.items();
    items.forEach(({ id }) => {
      if (!dates[id]) errors[`d:${id}`] = C.needDate;
    });
    if (form.name.trim().length < 2) errors.name = C.needName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = C.needEmail;
    if (!/^5\d{8}$/.test(form.phone)) errors.phone = C.needPhone;
    if (!form.pay) errors.pay = C.needPay;
    if (Object.keys(errors).length) {
      render();
      const first = root.querySelector('[aria-invalid="true"], .co-pay.is-bad input');
      root.querySelector('.co-alert')?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      first?.focus({ preventScroll: true });
      return;
    }
    done(items);
  });

  function done(items) {
    const ref = `NT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const total = trip.total();
    root.innerHTML = `
      <div class="nt-wrap co-done">
        <span class="co-done__i">${CHECK}</span>
        <p class="co-done__k">${esc(C.doneK)}</p>
        <h1 class="co-done__t" tabindex="-1">${esc(C.doneT)}</h1>
        <p class="co-done__h">${esc(C.doneH(form.email.trim()))}</p>
        <p class="co-done__ref"><span>${esc(C.ref)}</span><b dir="ltr">${ref}</b></p>
        <ol class="co-done__list">
          ${items.map(({ id, qty, item }) => `<li><span class="co-done__d">${esc(fmt(dates[id]))}</span><span class="co-done__n">${esc(t(item.title))}</span><span class="co-done__q">${esc(item.kind === 'tour' ? C.guests : C.nights)} <span dir="ltr">${qty}</span></span><b>${money(esc(price(item.price * qty)))}</b></li>`).join('')}
        </ol>
        <p class="co-sum__total co-done__total"><span>${esc(C.total)}</span><b>${money(esc(price(total)))}</b></p>
        <a class="nt-btn nt-btn--light" href="index.html?lang=${lang}">${esc(C.again)}</a>
      </div>`;
    trip.clear();
    root.querySelector('.co-done__t').focus();
    scrollTo(0, 0);
  }

  render();
}

boot().catch((e) => console.error(e));
