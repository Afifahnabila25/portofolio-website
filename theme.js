/* Tombol mode malam / terang. Pilihan pengunjung diingat di browser masing-masing. */
(() => {
  const root = document.documentElement;
  const EN = root.lang === 'en';
  const lang = document.querySelector('nav .lang');
  if (!lang) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-btn';
  lang.after(btn);

  function render() {
    const dark = root.dataset.theme === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    const label = dark
      ? (EN ? 'Switch to light mode' : 'Ganti ke mode terang')
      : (EN ? 'Switch to dark mode' : 'Ganti ke mode malam');
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim');
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    render();
    setTimeout(() => root.classList.remove('theme-anim'), 450);
  });

  render();
})();
