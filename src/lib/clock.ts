// One clock for the whole sheet. Every live element listens to this tick
// instead of keeping its own timer, so they all move on the same second.

export type Tick = CustomEvent<{ now: Date }>;

const formatters = new Map<string, Intl.DateTimeFormat>();

function fmt(zone: string) {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone });
    formatters.set(zone, f);
  }
  return f;
}

function paint(now: Date) {
  document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
    const zone = el.dataset.clock || 'Europe/Paris';
    const text = fmt(zone).format(now);
    if (el.textContent !== text) el.textContent = text;
  });
  document.dispatchEvent(new CustomEvent('sheet:tick', { detail: { now } }));
}

function start() {
  paint(new Date());
  const align = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    paint(new Date());
    window.setInterval(() => paint(new Date()), 1000);
  }, align);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
