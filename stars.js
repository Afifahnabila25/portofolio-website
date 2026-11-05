/* Langit bintang interaktif: bintang melayang, bintang jatuh,
   jejak kursor, ledakan bintang saat klik, sticker bisa digeser. */
(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = matchMedia('(hover: none)').matches;
    const COLORS = ['#ff2f7e', '#ffc93c', '#7b3ff2', '#00c2d1'];

    const cv = document.createElement('canvas');
    cv.id = 'sky';
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');

    let W, H, dpr;
    let stars = [], shooters = [], sparks = [];
    const mouse = { x: -999, y: -999 };

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[(Math.random() * arr.length) | 0];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = innerWidth; H = innerHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.round(Math.min(110, (W * H) / 12000));
        stars = Array.from({ length: n }, makeStar);
    }

    function makeStar() {
        const depth = rand(0.2, 1);
        return {
            x: rand(0, W), y: rand(0, H),
            ox: 0, oy: 0,                 // geseran karena kursor
            vx: rand(-0.3, 0.3), vy: rand(-0.5, -0.12),
            r: 3 + depth * 8,
            depth,
            rot: rand(0, Math.PI), spin: rand(-0.01, 0.01),
            tw: rand(0, Math.PI * 2), twSpeed: rand(0.01, 0.035),
            color: pick(COLORS),
            dot: Math.random() < 0.25     // sebagian cuma titik kecil
        };
    }

    // bintang 4 sudut (sparkle)
    function sparkle(x, y, r, rot, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.28, Math.sin(a + Math.PI / 4) * r * 0.28);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function spawnShooter() {
        const fromLeft = Math.random() < 0.5;
        shooters.push({
            x: fromLeft ? rand(-100, W * 0.4) : rand(W * 0.6, W + 100),
            y: rand(-40, H * 0.35),
            vx: (fromLeft ? 1 : -1) * rand(7, 11),
            vy: rand(3, 5),
            life: 1,
            color: pick(COLORS)
        });
    }

    function burst(x, y, count = 14) {
        for (let i = 0; i < count; i++) {
            const a = rand(0, Math.PI * 2), s = rand(1.5, 5);
            sparks.push({
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
                r: rand(3, 7), rot: rand(0, 3), spin: rand(-0.2, 0.2),
                life: 1, decay: rand(0.015, 0.03), color: pick(COLORS)
            });
        }
    }

    let scrollPos = window.scrollY;
    addEventListener('scroll', () => { scrollPos = window.scrollY; }, { passive: true });

    let lastTrail = 0;
    addEventListener('pointermove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        if (touch || reduce) return;
        const now = performance.now();
        if (now - lastTrail > 45) {
            lastTrail = now;
            sparks.push({
                x: e.clientX, y: e.clientY,
                vx: rand(-0.6, 0.6), vy: rand(0.2, 1.2),
                r: rand(4, 7), rot: rand(0, 3), spin: rand(-0.1, 0.1),
                life: 1, decay: 0.035, color: pick(COLORS)
            });
        }
    });
    addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    addEventListener('pointerdown', e => {
        if (e.target.closest('.sticker')) return;
        burst(e.clientX, e.clientY, touch ? 10 : 14);
    });

    let nextShoot = performance.now() + 2500;

    function frame(t) {
        ctx.clearRect(0, 0, W, H);

        for (const s of stars) {
            s.x += s.vx; s.y += s.vy; s.rot += s.spin; s.tw += s.twSpeed;
            // parallax: bintang dekat ikut scroll lebih banyak
            let py = (s.y - scrollPos * s.depth * 0.25) % H;
            if (py < 0) py += H;
            if (s.x < -20) s.x = W + 20; if (s.x > W + 20) s.x = -20;
            if (s.y < -H) s.y += H; if (s.y > 2 * H) s.y -= H;

            // menghindar dari kursor, lalu balik pelan-pelan
            const dx = s.x + s.ox - mouse.x, dy = py + s.oy - mouse.y;
            const d2 = dx * dx + dy * dy, R = 130;
            if (d2 < R * R) {
                const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6;
                s.ox += (dx / d) * f; s.oy += (dy / d) * f;
            }
            s.ox *= 0.94; s.oy *= 0.94;

            const alpha = 0.5 + 0.45 * (0.5 + 0.5 * Math.sin(s.tw));
            const x = s.x + s.ox, y = py + s.oy;
            if (s.dot) {
                ctx.globalAlpha = alpha * 0.8;
                ctx.fillStyle = s.color;
                ctx.beginPath(); ctx.arc(x, y, s.r * 0.35, 0, 7); ctx.fill();
            } else {
                sparkle(x, y, s.r * (0.85 + 0.25 * Math.sin(s.tw)), s.rot, s.color, alpha);
            }
        }
        ctx.globalAlpha = 1;

        if (!reduce && t > nextShoot) {
            spawnShooter();
            nextShoot = t + rand(2000, 5000);
        }
        shooters = shooters.filter(s => s.life > 0 && s.x > -200 && s.x < W + 200 && s.y < H + 100);
        for (const s of shooters) {
            s.x += s.vx; s.y += s.vy; s.life -= 0.008;
            const len = 14;
            const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
            g.addColorStop(0, s.color);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = g;
            ctx.globalAlpha = s.life;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len);
            ctx.stroke();
            sparkle(s.x, s.y, 10, t / 120, s.color, s.life);
        }

        sparks = sparks.filter(p => p.life > 0);
        for (const p of sparks) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.98;
            p.rot += p.spin; p.life -= p.decay;
            sparkle(p.x, p.y, p.r * p.life + 1, p.rot, p.color, Math.max(p.life, 0));
        }
        ctx.globalAlpha = 1;

        if (!reduce) requestAnimationFrame(frame);
    }

    resize();
    addEventListener('resize', resize);
    requestAnimationFrame(frame);

    /* ---- Sticker bisa digeser ---- */
    document.querySelectorAll('.sticker').forEach(st => {
        let sx, sy, startL, startT;
        st.addEventListener('pointerdown', e => {
            e.preventDefault();
            st.setPointerCapture(e.pointerId);
            st.classList.add('dragging');
            startL = st.offsetLeft; startT = st.offsetTop;
            sx = e.clientX; sy = e.clientY;
            Object.assign(st.style, { left: startL + 'px', top: startT + 'px', right: 'auto', bottom: 'auto' });
        });
        st.addEventListener('pointermove', e => {
            if (!st.classList.contains('dragging')) return;
            st.style.left = startL + e.clientX - sx + 'px';
            st.style.top = startT + e.clientY - sy + 'px';
        });
        const drop = e => {
            if (!st.classList.contains('dragging')) return;
            st.classList.remove('dragging');
            const r = st.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2, 8);
        };
        st.addEventListener('pointerup', drop);
        st.addEventListener('pointercancel', drop);
    });

    /* ---- Foto sedikit miring ngikutin kursor ---- */
    const frameEl = document.querySelector('.scene .frame');
    if (frameEl && !touch && !reduce) {
        const scene = frameEl.closest('.scene');
        scene.addEventListener('pointermove', e => {
            const r = scene.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            frameEl.style.setProperty('--tx', (nx * 10).toFixed(2) + 'deg');
            frameEl.style.setProperty('--ty', (-ny * 10).toFixed(2) + 'deg');
        });
        scene.addEventListener('pointerleave', () => {
            frameEl.style.setProperty('--tx', '0deg');
            frameEl.style.setProperty('--ty', '0deg');
        });
    }
})();
