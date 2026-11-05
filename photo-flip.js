/* Foto yang bisa "dibalik": formal sebagai utama, sisi baliknya random.
   Desktop: arahkan kursor ke foto -> balik, kursor keluar -> balik ke formal.
   HP: tap foto untuk ganti. Klik foto (desktop) untuk ganti ke foto lain. */
(() => {
    const EN = document.documentElement.lang === 'en';
    const T = (id, en) => (EN ? en : id);

    // ==== ATUR DI SINI ====
    // src   : foto sisi belakang
    // audio : file suara di folder yang sama (opsional)
    // synth : suara cadangan bawaan kalau file audio belum ada ('riff' | 'calm' | 'meow')
    // repeat: untuk suara pendek, diputar ulang tiap sekian milidetik
    const ALTS = [
        { src: 'foto-rock.jpg', label: '🎸 asekk', audio: 'lagu-rock.mp3', synth: 'riff' },
        { src: 'foto-ml.jpg', label: '🎮 MLBB mode', audio: 'lagu-ml.mp3' },
        { src: 'foto-santai.jpg', label: '🌸 chill', audio: 'lagu-santai.mp3', synth: 'calm' },
        { src: 'foto-kucing.jpg', label: '🐱 meongg', audio: 'meong.mp3', synth: 'meow', repeat: 2600 }
    ];
    // ======================

    const frame = document.querySelector('.scene .frame');
    const img = frame && frame.querySelector('img');
    if (!frame || !img) return;

    const scene = frame.closest('.scene');
    const formal = { src: img.getAttribute('src'), alt: img.alt };
    const touch = matchMedia('(hover: none)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tag = document.createElement('div');
    tag.className = 'flip-tag';
    scene.appendChild(tag);

    // Foto yang gagal dimuat dilewati; file audio yang tidak ada diganti suara cadangan
    const ready = [];
    ALTS.forEach(a => {
        const im = new Image();
        im.onload = () => ready.push(a);
        im.src = a.src;
        if (a.audio) {
            a.player = new Audio();
            a.player.preload = 'auto';
            a.player.loop = !a.repeat;
            a.player.volume = 0.6;
            a.player.addEventListener('error', () => { a.player = null; });
            a.player.src = a.audio;
        }
    });

    let current = null, last = null, busy = false, queued;

    function pickAlt() {
        const pool = ready.filter(a => a !== last);
        const list = pool.length ? pool : ready;
        return list[(Math.random() * list.length) | 0];
    }

    function flipTo(target) {
        if (busy) { queued = target; return; }
        if (target === current) return;
        busy = true;
        const swap = () => {
            img.src = target ? target.src : formal.src;
            img.alt = target ? T('Foto Afifah, ', 'Afifah, ') + target.label : formal.alt;
            current = target;
            if (target) last = target;
            tag.textContent = target ? target.label : '';
            tag.classList.toggle('show', !!target);
            play(target);
        };
        const done = () => {
            busy = false;
            if (queued !== undefined) { const q = queued; queued = undefined; flipTo(q); }
        };
        if (reduce || !frame.animate) { swap(); done(); return; }
        frame.animate([{ rotate: 'y 0deg' }, { rotate: 'y 90deg' }],
            { duration: 160, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                swap();
                frame.animate([{ rotate: 'y -90deg' }, { rotate: 'y 0deg' }],
                    { duration: 220, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' }).onfinish = done;
            };
    }

    /* ================= Suara ================= */
    let actx, active = null, repeatTimer;

    const canPlay = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
    function hint() {
        tag.textContent = T('🔊 klik foto buat nyalain suara', '🔊 click the photo for sound');
    }

    function stopAll() {
        clearInterval(repeatTimer);
        ALTS.forEach(a => { if (a.player) fadeOut(a.player); });
        if (active) { active(); active = null; }
    }

    function play(target) {
        stopAll();
        if (!target) return;
        if (!canPlay()) { hint(); return; }
        const once = () => {
            if (target.player) {
                const p = target.player;
                p.currentTime = 0; p.volume = 0.6;
                p.play().catch(err => {
                    if (err.name === 'NotAllowedError') hint();
                    else { target.player = null; once(); }   // file tidak ada -> pakai suara cadangan
                });
            } else if (target.synth) {
                const stop = SYNTH[target.synth]();
                if (!target.repeat) active = stop;
            }
        };
        once();
        if (target.repeat) repeatTimer = setInterval(() => { if (current === target) once(); }, target.repeat);
    }

    function fadeOut(p) {
        if (p.paused) return;
        const step = () => {
            p.volume = Math.max(0, p.volume - 0.08);
            if (p.volume > 0) requestAnimationFrame(step); else p.pause();
        };
        step();
    }

    function ctx() {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        return actx;
    }

    // Suara cadangan buatan sendiri (bukan rekaman lagu siapa pun)
    const SYNTH = {
        // Riff bass rock: E E G E A G D E
        riff() {
            const c = ctx();
            const out = c.createGain(); out.gain.value = 0.18;
            const drive = c.createWaveShaper();
            const curve = new Float32Array(1024);
            for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 4);
            drive.curve = curve;
            const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
            drive.connect(lp).connect(out).connect(c.destination);
            return loop(c, out, [82.4, 82.4, 98, 82.4, 110, 98, 73.4, 82.4], 0.16, (f, t, d) => {
                const o = c.createOscillator(), g = c.createGain();
                o.type = 'sawtooth'; o.frequency.value = f;
                env(g, t, 0.01, d * 0.95, 1);
                o.connect(g).connect(drive); o.start(t); o.stop(t + d);
            });
        },

        // Arpeggio kalem ala lo-fi: Cmaj7 - Am7 - Fmaj7 - G
        calm() {
            const c = ctx();
            const out = c.createGain(); out.gain.value = 0.12;
            const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
            const dl = c.createDelay(); dl.delayTime.value = 0.33;
            const fb = c.createGain(); fb.gain.value = 0.35;
            lp.connect(out); lp.connect(dl); dl.connect(fb).connect(dl); dl.connect(out);
            out.connect(c.destination);
            const notes = [
                261.6, 329.6, 392, 493.9, 220, 261.6, 329.6, 392,
                174.6, 220, 261.6, 329.6, 196, 246.9, 293.7, 392
            ];
            return loop(c, out, notes, 0.32, (f, t, d) => {
                const o = c.createOscillator(), g = c.createGain();
                o.type = 'triangle'; o.frequency.value = f;
                env(g, t, 0.02, d * 2.2, 0.8);
                o.connect(g).connect(lp); o.start(t); o.stop(t + d * 2.3);
            });
        },

        // "Meong" sintetis: nada naik-turun lewat filter "mulut" (mi-a-ow)
        meow() {
            const c = ctx(), t = c.currentTime + 0.02, d = 0.7;
            const o = c.createOscillator(); o.type = 'sawtooth';
            o.frequency.setValueAtTime(520, t);
            o.frequency.linearRampToValueAtTime(760, t + d * 0.35);
            o.frequency.linearRampToValueAtTime(430, t + d);
            const vib = c.createOscillator(), vg = c.createGain();
            vib.frequency.value = 7; vg.gain.value = 12; vib.connect(vg).connect(o.frequency);
            const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 6;
            f1.frequency.setValueAtTime(700, t);
            f1.frequency.linearRampToValueAtTime(1600, t + d * 0.3);
            f1.frequency.linearRampToValueAtTime(600, t + d);
            const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 8;
            f2.frequency.setValueAtTime(2400, t);
            f2.frequency.linearRampToValueAtTime(1300, t + d);
            const g = c.createGain(); env(g, t, 0.06, d, 0.5);
            o.connect(f1).connect(g); o.connect(f2).connect(g);
            g.connect(c.destination);
            o.start(t); vib.start(t); o.stop(t + d + 0.05); vib.stop(t + d + 0.05);
            return () => { };
        }
    };

    function env(g, t, attack, len, peak) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    }

    // Penjadwal nada berulang; mengembalikan fungsi untuk berhenti (fade out)
    function loop(c, out, notes, step, voice) {
        let n = 0, next = c.currentTime + 0.05;
        const timer = setInterval(() => {
            while (next < c.currentTime + 0.3) {
                voice(notes[n % notes.length], next, step);
                next += step; n++;
            }
        }, 60);
        return () => {
            clearInterval(timer);
            out.gain.setTargetAtTime(0, c.currentTime, 0.08);
            setTimeout(() => out.disconnect(), 1500);
        };
    }

    /* ================= Interaksi ================= */
    frame.style.cursor = 'pointer';
    if (!touch) {
        // dideteksi di .scene (bukan foto) supaya animasi putar tidak memicu "kursor keluar"
        scene.addEventListener('pointerenter', () => { if (ready.length) flipTo(pickAlt()); });
        scene.addEventListener('pointerleave', () => flipTo(null));
    }
    frame.addEventListener('click', () => {
        if (!ready.length) return;
        if (touch) { flipTo(current ? null : pickAlt()); return; }
        if (current) {
            const other = ready.filter(a => a !== current);
            if (other.length) flipTo(other[(Math.random() * other.length) | 0]);
            else play(current);
        } else flipTo(pickAlt());
    });
})();
