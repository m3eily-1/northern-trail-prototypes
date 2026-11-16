// Chrome labels (small UI strings) in both languages. All editorial copy comes from content.json.
export const T = {
  en: {
    passport: 'Northern Trail Passport',
    passportShort: 'Passport',
    collected: 'collected',
    stop: (n, total) => `Stop ${n} of ${total}`,
    start: 'Starting point',
    from: (name) => `from ${name}`,
    dragStickers: 'Drag the stickers',
    dragStamps: 'Drag the stamps',
    pause: 'Pause film',
    play: 'Play film',
    complete: 'Passport complete',
    completeStamp: 'COMPLETE',
    shuffle: 'Shuffle',
    putBack: 'Put back',
    showPassport: 'Show passport',
    hidePassport: 'Hide passport',
    stopsEyebrow: '16 stops, 16 stamps',
    stopsTitle: 'Stamp your way north',
    stopsHint: 'Scroll the trail. Every stop you reach lands a stamp in your passport.',
    postcards: 'Postcards from the North',
    goTo: (n, name) => `Go to stop ${n}, ${name}`,
    langLabel: 'Language',
  },
  ar: {
    passport: 'جواز مسار الشمال',
    passportShort: 'الجواز',
    collected: 'تم جمعها',
    stop: (n, total) => `المحطة ${n} من ${total}`,
    start: 'نقطة الانطلاق',
    from: (name) => `من ${name}`,
    dragStickers: 'اسحب الملصقات',
    dragStamps: 'اسحب الأختام',
    pause: 'إيقاف الفيلم',
    play: 'تشغيل الفيلم',
    complete: 'اكتمل الجواز',
    completeStamp: 'مكتمل',
    shuffle: 'بعثِرها',
    putBack: 'أعِدها',
    showPassport: 'عرض الجواز',
    hidePassport: 'إخفاء الجواز',
    stopsEyebrow: '16 محطة، 16 ختمًا',
    stopsTitle: 'اختم طريقك نحو الشمال',
    stopsHint: 'تابع المسار، وكل محطة تصلها تضع ختمها في جوازك.',
    postcards: 'بطاقات من الشمال',
    goTo: (n, name) => `انتقل إلى المحطة ${n}، ${name}`,
    langLabel: 'اللغة',
  },
};

export const pad2 = (n) => String(n).padStart(2, '0');

export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const mqPhone = () => matchMedia('(max-width: 1023px)');
