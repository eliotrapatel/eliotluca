// Day, night, or follow the system. Stored per visitor only.

function apply(value: string) {
  const root = document.documentElement;
  if (value === 'light' || value === 'dark') root.setAttribute('data-theme', value);
  else root.removeAttribute('data-theme');
  try {
    if (value === 'light' || value === 'dark') localStorage.setItem('theme', value);
    else localStorage.removeItem('theme');
  } catch {
    /* storage can be unavailable; the choice still applies to this page */
  }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === value));
  });
}

function init() {
  let current = 'auto';
  try {
    current = localStorage.getItem('theme') || 'auto';
  } catch {
    /* ignore */
  }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === current));
    b.addEventListener('click', () => apply(b.dataset.themeSet || 'auto'));
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
