// Roadside signs, shared by the drive scene and the phone stack. Brown plates
// are tourist-site signs, green plates are region signs, both bilingual
// (Arabic above English) like the real ones on Saudi roads.
import { t, esc, pad2, lang, labels } from './util.js';

const names = (o) => `
  <span class="sign__names">
    <span class="sign__ar" lang="ar"${lang === 'ar' ? '' : ' aria-hidden="true"'}>${esc(t(o, 'ar'))}</span>
    <span class="sign__en" lang="en"${lang === 'en' ? '' : ' aria-hidden="true"'}>${esc(t(o, 'en'))}</span>
  </span>`;

export const stopPlate = (s) => `<span class="sign__n" aria-hidden="true">${pad2(s.n)}</span>${names(s.name)}`;

export function stopSign(s, x) {
  return `<div class="sign sign--stop" style="inset-inline-start:${x.toFixed(0)}px" data-k="${s.n - 1}" aria-hidden="true">
    <div class="sign__plate">${stopPlate(s)}</div>
    <i class="sign__legs"></i>
  </div>`;
}

export const regionPlate = (r) => `${names(r.name)}<span class="sign__count">${esc(t(r.count))}</span>`;

export function regionSign(r, x) {
  return `<div class="sign sign--region" style="inset-inline-start:${x.toFixed(0)}px" aria-hidden="true">
    <div class="sign__plate">${regionPlate(r)}</div>
    <i class="sign__legs"></i>
  </div>`;
}

export function endSign(x) {
  const o = { en: labels.en.arrived, ar: labels.ar.arrived };
  return `<div class="sign sign--region sign--end" style="inset-inline-start:${x.toFixed(0)}px" aria-hidden="true">
    <div class="sign__plate">${names(o)}</div>
    <i class="sign__legs"></i>
  </div>`;
}
