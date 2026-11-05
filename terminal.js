/* Terminal mini interaktif (otomatis ID/EN dari <html lang>) */
(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EN = document.documentElement.lang === 'en';
    const T = (id, en) => (EN ? en : id);

    /* ===== Terminal mini ===== */
    const term = document.getElementById('term');
    if (!term) return;
    const out = term.querySelector('.term-out');
    const input = term.querySelector('.term-input');
    const body = term.querySelector('.term-body');
    const history = [];
    let hIdx = 0;

    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

    const CMDS = {
        help: () => [
            T('Perintah yang tersedia:', 'Available commands:'),
            '  <b>whoami</b>      ' + T('siapa aku', 'who I am'),
            '  <b>skills</b>      tech stack',
            '  <b>projects</b>    ' + T('proyek unggulan', 'featured projects'),
            '  <b>experience</b>  ' + T('pengalaman', 'work & organizations'),
            '  <b>awards</b>      ' + T('penghargaan', 'awards'),
            '  <b>certs</b>       ' + T('sertifikat', 'certifications'),
            '  <b>contact</b>     ' + T('cara menghubungi', 'get in touch'),
            '  <b>cv</b>          ' + T('buka CV', 'open my CV'),
            '  <b>clear</b>       ' + T('bersihkan layar', 'clear the screen'),
            '<span class="dim">' + T('psst… ada perintah rahasia juga 👀', 'psst… there are a few secret commands too 👀') + '</span>'
        ],
        whoami: () => [
            '<b class="c-pink">Afifah Nabila Devi</b>',
            T('Mahasiswa Teknik Informatika, Universitas Brawijaya', 'Informatics Engineering student, Universitas Brawijaya'),
            T('Fokus', 'Focus') + ': <b class="c-sky">AI Engineering</b> · <b class="c-yellow">Data Engineering</b> · <b class="c-grape">Cybersecurity</b>',
            T('Sekarang', 'Currently') + ': AI Engineer Intern @ DOT Indonesia'
        ],
        skills: () => [
            '<span class="c-sky">ai/data   </span> Python, Machine Learning, NLP, Computer Vision, SQL, DuckDB',
            '<span class="c-yellow">pipeline  </span> Prefect, Streamlit, Data Modeling',
            '<span class="c-grape">security  </span> Threat analysis, Vulnerability assessment',
            '<span class="c-pink">qa        </span> Test case, BDD, Web & Mobile testing'
        ],
        projects: () => [
            'drwxr-xr-x  nyc-taxi-analysis/',
            'drwxr-xr-x  indonesian-news-search-engine/',
            'drwxr-xr-x  ai-team-assistant/',
            T('drwxr-xr-x  deteksi-gambar-ai <span class="dim">(skripsi)</span>/', 'drwxr-xr-x  ai-image-detection <span class="dim">(thesis)</span>/'),
            'drwxr-xr-x  agenttesla-threat-mitigation/',
            'drwxr-xr-x  autoflow-devops/',
            'drwxr-xr-x  travelupa/',
            T('<span class="dim">→ detail lengkap ada di section</span> <a href="#projects">Proyek</a>', '<span class="dim">→ full details in the</span> <a href="#projects">Projects</a> <span class="dim">section</span>')
        ],
        experience: () => [
            '<span class="c-sky">[Nov 2026–now]</span> AI Engineer Intern · DOT Indonesia',
            '<span class="c-sky">[Aug 2026–now]</span> Next-Gen AI Engineer Trainee · Asah led by Dicoding',
            '[Jun–Sep 2026] QA Intern, PaDiUMKM · Telkom Indonesia',
            '[Feb–Jun 2026] Teaching Assistant, Web App Development · FILKOM UB',
            '[Jan–Jul 2026] Head of Activation, Publication & Information · LPM FILKOM',
            '[2025        ] Cybersecurity Division Member · POROS FILKOM',
            T('<span class="dim">→ selengkapnya di</span> <a href="#experience">Pengalaman</a>', '<span class="dim">→ more in</span> <a href="#experience">Experience</a>')
        ],
        awards: () => [
            '🥈 <b>' + T('Juara 2 Lomba Esai', '2nd Place, Essay Competition') + '</b> · GENESIS 2026',
            '   <span class="dim">UKM-P Binary, Fasilkom Universitas Jember · Sep 2026</span>',
            '🏅 <b>Top 25 Winner, Essay for Indonesia</b> · SejutaCita Future Leaders',
            '   <span class="dim">Chapter 13: China 2026 · Apr 2026</span>'
        ],
        certs: () => [
            '📜 Belajar Dasar Cloud dan Gen AI di AWS <span class="dim">· Dicoding · 2026</span>',
            '📜 Spec-Driven Development dengan Kiro <span class="dim">· Dicoding · 2026</span>',
            '<span class="dim">' + T('→ total 10 sertifikat, lengkapnya di', '→ 10 certifications in total, all on') + '</span> ' + link('https://www.linkedin.com/in/afifahnaad/details/certifications/', 'LinkedIn')
        ],
        contact: () => [
            'email     ' + link('mailto:afifahnaad@gmail.com', 'afifahnaad@gmail.com'),
            'linkedin  ' + link('https://www.linkedin.com/in/afifahnaad/', 'in/afifahnaad'),
            'github    ' + link('https://github.com/Afifahnabila25', 'Afifahnabila25')
        ],
        cv: () => {
            window.open('https://drive.google.com/file/d/1bBLHePWVF8dSdxqi2rR9XAgEiBPWA9xR/view?usp=sharing', '_blank', 'noopener');
            return [T('Membuka CV di tab baru… 📄', 'Opening CV in a new tab… 📄')];
        },
        ls: () => CMDS.projects(),
        sudo: () => ['<span class="c-pink">[sudo] password for guest:</span> ********', 'guest is not in the sudoers file. ' + T('Insiden ini akan dilaporkan 😏', 'This incident will be reported 😏')],
        hack: () => ['Initializing exploit… ██████████ 100%', T('Akses ditolak. Sistem ini dijaga sama anak security 🔐', 'Access denied. This system is guarded by a security kid 🔐')],
        coffee: () => ['☕ Brewing… error 418: I\'m a teapot'],
        date: () => [new Date().toLocaleString(T('id-ID', 'en-GB'), { dateStyle: 'full', timeStyle: 'short' })],
        echo: args => [escapeHtml(args.join(' '))],
        clear: () => { out.innerHTML = ''; return []; }
    };

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function print(lines, cls = '') {
        lines.forEach(l => {
            const d = document.createElement('div');
            d.className = 'term-line ' + cls;
            d.innerHTML = l;
            out.appendChild(d);
        });
        body.scrollTop = body.scrollHeight;
    }

    function run(raw) {
        const cmdline = raw.trim();
        print([`<span class="term-prompt">guest@afifah:~$</span> ${escapeHtml(cmdline)}`]);
        if (!cmdline) return;
        history.push(cmdline); hIdx = history.length;
        const [cmd, ...args] = cmdline.split(/\s+/);
        const fn = CMDS[cmd.toLowerCase()];
        if (fn) print(fn(args));
        else print([`command not found: ${escapeHtml(cmd)}. ` + T('Ketik <b>help</b> ya.', 'Try <b>help</b>.')], 'err');
    }

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { run(input.value); input.value = ''; }
        else if (e.key === 'ArrowUp' && hIdx > 0) { input.value = history[--hIdx]; e.preventDefault(); }
        else if (e.key === 'ArrowDown') { hIdx = Math.min(hIdx + 1, history.length); input.value = history[hIdx] || ''; }
        else if (e.key === 'Tab') {
            e.preventDefault();
            const m = Object.keys(CMDS).find(k => k.startsWith(input.value.toLowerCase()));
            if (m && input.value) input.value = m;
        }
    });
    body.addEventListener('click', () => {
        if (!getSelection().toString()) input.focus({ preventScroll: true });
    });
    term.querySelectorAll('[data-cmd]').forEach(b =>
        b.addEventListener('click', () => { run(b.dataset.cmd); input.focus({ preventScroll: true }); })
    );

    // Ketik "whoami" otomatis sekali saat terminal pertama kali terlihat
    print([T('Selamat datang! Ketik <b>help</b> untuk lihat perintah.', 'Welcome! Type <b>help</b> to see the commands.')], 'dim');
    const tio = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        tio.disconnect();
        if (reduce) { run('whoami'); return; }
        const word = 'whoami';
        let i = 0;
        const t = setInterval(() => {
            input.value = word.slice(0, ++i);
            if (i === word.length) {
                clearInterval(t);
                setTimeout(() => { run(word); input.value = ''; }, 350);
            }
        }, 110);
    }, { threshold: 0.5 });
    tio.observe(term);
})();
