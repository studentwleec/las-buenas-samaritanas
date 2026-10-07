// Procedural audio: ambient music + synthesized SFX via WebAudio. No assets needed.
// Classic script (file:// compatible) — exposes globals `SFX`, `startMusic`, `stopMusic`, `setVolumes`.
let ctx = null, musicGain = null, sfxGain = null, musicTimer = null, currentMood = 0;

function ensure() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = ctx.createGain(); musicGain.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.connect(ctx.destination);
}
function setVolumes(m, s) {
  ensure();
  musicGain.gain.value = (m / 100) * 0.35;
  sfxGain.gain.value = (s / 100) * 0.5;
}
function tone(freq, dur, type = 'sine', vol = 0.3, slide = 0) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(sfxGain); o.start(); o.stop(ctx.currentTime + dur);
}
const SFX = {
  unlock() { try { ensure(); ctx.resume(); } catch {} },
  step() { tone(180 + Math.random() * 60, 0.07, 'triangle', 0.08); },
  pickup() { tone(660, 0.15, 'sine', 0.25, 330); },
  hurt() { tone(140, 0.3, 'sawtooth', 0.25, -80); },
  talk() { tone(440, 0.08, 'square', 0.08); },
  gate() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.25), i * 120)); },
  checkpoint() { tone(392, 0.3, 'sine', 0.2, 200); },
  bad() { tone(220, 0.4, 'sawtooth', 0.2, -120); },
  victory() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'triangle', 0.22), i * 140)); }
};
// Generative ambient: darker (minor, slow) -> brighter (major, warm) by mood 0..7
const minor = [110, 130.8, 146.8, 164.8, 196, 220];
const major = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
function startMusic(mood) {
  ensure(); ctx.resume(); currentMood = mood;
  stopMusic(false);
  const bright = mood / 7;
  musicTimer = setInterval(() => {
    if (!ctx) return;
    const scale = bright > 0.5 ? major : minor;
    const f = scale[Math.floor(Math.random() * scale.length)] * (bright > 0.7 ? 1 : 0.5);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const dur = 2.2 - bright * 0.8;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + dur / 2);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(musicGain); o.start(); o.stop(ctx.currentTime + dur + 0.1);
  }, 1400);
}
function stopMusic(close = true) {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (close && ctx) { /* keep ctx */ }
}
