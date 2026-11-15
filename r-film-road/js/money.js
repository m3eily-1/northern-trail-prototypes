// Prices use the Saudi riyal symbol (webook's own drawing, assets/webook/currency_sar.svg), never
// "SAR" or "ر.س". Label strings carry the amount as ¤460; money() turns that into the symbol and the
// number kept together left to right (symbol first) in both languages. Run it on escaped text.
const PATHS =
  '<path d="M14.06 12.21C14.00 12.82 13.85 13.39 13.61 13.92L8.66 15C8.72 14.40 8.87 13.82 9.11 13.29L14.06 12.21Z"/>' +
  '<path d="M7.11 7.27L8.66 6.93V2.11C9.08 1.58 9.61 1.130 10.20 0.79V6.59L14.06 5.76C14.00 6.36 13.85 6.94 13.61 7.47L10.20 8.21V9.82L14.06 8.98C14.00 9.59 13.85 10.16 13.61 10.70L8.66 11.77V8.54L7.11 8.88V10.67C7.11 10.79 7.09 10.91 7.04 11.01L6.98 11.11L6.18 12.33C5.98 12.63 5.670 12.84 5.32 12.92L0.94 13.87C1.00 13.27 1.15 12.69 1.39 12.16L5.57 11.25V9.22L1.67 10.06C1.73 9.46 1.88 8.88 2.11 8.35L5.57 7.60V1.32C6.00 0.79 6.52 0.34 7.11 0V7.27Z"/>';
const LABEL = document.documentElement.lang === 'ar' ? 'ريال سعودي' : 'Saudi riyals';
export const SAR_SVG = `<svg class="sar" viewBox="0 0 15 15" role="img" aria-label="${LABEL}">${PATHS}</svg>`;
export const money = (html) => String(html).replace(/¤([\d.,]+)/g, (_, n) => `<span class="sar-p" dir="ltr">${SAR_SVG}${n}</span>`);
