// Core engine: player, camera, collisions, entities, rendering. Classic script — globals `rectsOverlap`, `Game`.
// (Uses global `SFX` from audio.js; no imports so the game runs from file://.)

function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

class Game {
  constructor(canvas, hooks) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.hooks = hooks; // {onObjective, onPickup, toast, dialogue, choice, complete, gameover, hud}
    this.keys = {};
    this.running = false;
    this.shake = 0;
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape') this.hooks.onPause?.();
      if (e.key.toLowerCase() === 'e') { if (!this.hooks.onInteractConsumed?.()) this.hooks.onAdvance?.(); }
      if (e.key === 'Enter' || e.key === ' ') this.hooks.onAdvance?.();
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    this.cv.addEventListener('mousedown', e => { this.click = { x: e.offsetX, y: e.offsetY }; this.hooks.onAdvance?.(); });
    this.last = 0; this.t = 0; this.stepAcc = 0;
  }
  loadLevel(def) {
    this.def = def;
    this.player = { x: def.start.x, y: def.start.y, w: 26, h: 30, vx: 0, vy: 0, speed: 220, face: 1, moving: false, idle: 0, gold: 0 };
    this.grace = 100; this.count = 0; this.spread = 0;
    this.beacons = (def.beacons || []).map(b => ({ ...b, lit: false }));
    this.pickups = (def.pickups || []).map(p => ({ ...p, taken: false, bob: Math.random() * 6 }));
    this.enemies = (def.enemies || []).map((e, i) => ({ ...e, ox: e.x, oy: e.y, t: Math.random() * 6, alive: true, id: i }));
    this.npcs = (def.npcs || []).map(n => ({ ...n }));
    this.tablets = (def.tablets || []).map(t => ({ ...t, read: false }));
    this.checkpoint = { ...def.start };
    this.exitOpen = def.mechanic === 'forgive' ? false : true;
    this.crowns = []; this.crownT = 0;
    this.done = false; this.over = false;
    this.cam = { x: 0, y: 0 };
    this.hooks.onObjective?.(this.objectiveText());
  }
  objectiveText() {
    const d = this.def;
    if (d.mechanic === 'sloth') return `Relight beacons ${this.beacons.filter(b => b.lit).length}/4 → gate ✦`;
    if (d.mechanic === 'greed') return `Manna ${this.count}/${d.need} (gold: ${this.player.gold} — beware!) → gate ✦`;
    if (d.mechanic === 'envy' || d.mechanic === 'forgive') return `${this.count}/${d.need} → ${d.mechanic === 'forgive' ? 'face him & forgive' : 'gate ✦'}`;
    if (d.mechanic === 'wrath') return `Spared ${this.count}/${d.need} (E beside them) → gate ✦`;
    if (d.mechanic === 'lies') return `True tablets ${this.count}/${d.need} → gate ✦`;
    return 'Reach the gate ✦';
  }
  tryInteract() {
    if (!this.running || this.done) return;
    // NPC
    for (const n of this.npcs) {
      if (Math.hypot(n.x - this.cx(), n.y - this.cy()) < 70) { this.hooks.dialogue?.(n.name, n.lines); SFX.talk(); return; }
    }
    // tablets
    for (const t of this.tablets) {
      if (Math.hypot(t.x - this.cx(), t.y - this.cy()) < 70) {
        if (t.true && !t.read) { t.read = true; this.count++; SFX.pickup(); this.hooks.toast?.('Truth received ✦'); }
        else if (!t.true) { this.damage(15); SFX.bad(); this.hooks.toast?.('A lying voice stings you…'); }
        this.hooks.dialogue?.(t.true ? 'Tablet of Truth' : 'Whispering Tablet', [t.text]);
        this.hooks.onObjective?.(this.objectiveText());
        return;
      }
    }
    // wrath spare
    if (this.def.mechanic === 'wrath') {
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(e.x - this.cx(), e.y - this.cy()) < 70) {
          e.alive = false; this.count++; SFX.checkpoint();
          this.hooks.toast?.('“Father, forgive them.” — the soldier kneels, freed.');
          this.hooks.onObjective?.(this.objectiveText());
          return;
        }
      }
    }
    // forgive betrayer
    if (this.def.mechanic === 'forgive' && this.count >= this.def.need) {
      const b = this.def.betrayer;
      if (Math.hypot(b.x - this.cx(), b.y - this.cy()) < 90) {
        this.hooks.choice?.('He betrayed you. What will you do?', [
          { label: '✦ I forgive you (Colossians 3:13)', value: 'forgive' },
          { label: 'Turn away in bitterness', value: 'bitter' }
        ], (v) => {
          if (v === 'forgive') { this.exitOpen = true; SFX.victory(); this.hooks.toast?.('The chains fall. The gate opens.'); this.hooks.onObjective?.('Forgiven ✦ — go to the gate!'); }
          else { this.damage(20); this.hooks.toast?.('Bitterness wounds you. The gate stays shut.'); }
        });
        return;
      }
    }
  }
  cx() { return this.player.x + this.player.w / 2; }
  cy() { return this.player.y + this.player.h / 2; }
  damage(n, quiet = false) {
    if (this.done || this.over) return;
    this.grace = Math.max(0, this.grace - n);
    this.shake = 8;
    const now = performance.now();
    if (!quiet || !this._lastHurt || now - this._lastHurt > 500) { SFX.hurt(); this._lastHurt = now; }
    if (this.grace <= 0) { this.over = true; this.running = false; this.hooks.gameover?.(); }
  }
  heal(n) { this.grace = Math.min(100, this.grace + n); }
  collide(x, y, w, h) {
    const r = { x, y, w, h };
    for (const wl of this.def.walls) if (rectsOverlap(r, wl)) return true;
    return x < 0 || y < 0 || x + w > 1600 || y + h > 1000;
  }
  update(dt) {
    if (!this.running || this.done || this.over) return;
    this.t += dt;
    const k = this.keys, p = this.player;
    let dx = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
    let dy = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);
    const run = k['shift'];
    p.moving = !!(dx || dy);
    if (p.moving) { p.idle = 0; const l = Math.hypot(dx, dy); dx /= l; dy /= l; if (dx) p.face = dx > 0 ? 1 : -1; }
    else p.idle += dt;
    let sp = p.speed * (run ? 1.6 : 1) * (1 - Math.min(0.45, p.gold * 0.07));
    // pride: running on bridges shakes
    const onBridge = (this.def.bridges || []).some(b => rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, b));
    if (this.def.mechanic === 'pride' && onBridge && run) { this.shake = 4; if (Math.random() < dt * 2) this.damage(4); }
    // sloth idle drain
    if (this.def.mechanic === 'sloth' && !p.moving) this.grace = Math.max(1, this.grace - this.def.drainIdle * dt);
    // move with collision per-axis
    const nx = p.x + dx * sp * dt;
    if (!this.collide(nx, p.y, p.w, p.h)) p.x = nx;
    const ny = p.y + dy * sp * dt;
    if (!this.collide(p.x, ny, p.w, p.h)) p.y = ny;
    // footsteps
    this.stepAcc += dt * (p.moving ? (run ? 11 : 7) : 0);
    if (this.stepAcc > 1) { this.stepAcc = 0; SFX.step(); }
    // camera
    const W = 960, H = 600;
    this.cam.x += ((p.x - W / 2) - this.cam.x) * Math.min(1, dt * 5);
    this.cam.y += ((p.y - H / 2) - this.cam.y) * Math.min(1, dt * 5);
    this.cam.x = Math.max(-50, Math.min(1600 - W + 50, this.cam.x));
    this.cam.y = Math.max(-50, Math.min(1000 - H + 50, this.cam.y));
    // beacons
    for (const b of this.beacons) {
      if (!b.lit && Math.hypot(b.x - this.cx(), b.y - this.cy()) < 55) {
        b.lit = true; this.heal(15); SFX.checkpoint();
        this.hooks.toast?.(`Beacon rekindled (${this.beacons.filter(x => x.lit).length}/4) 🔥`);
        this.hooks.onObjective?.(this.objectiveText());
      }
    }
    // pickups
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      pk.bob += dt * 3;
      if (Math.hypot(pk.x - this.cx(), pk.y - this.cy()) < 42) {
        pk.taken = true;
        if (pk.kind === 'gold') { p.gold++; this.damage(8); SFX.bad(); this.hooks.toast?.('Gold weighs you down… (-grace, slower)'); }
        else if (pk.kind === 'envyGold') { this.damage(18); SFX.bad(); this.hooks.toast?.('That harvest was not yours. A wraith stirs!'); this.spawnWraith(pk); }
        else if (pk.kind === 'bread') { this.heal(20); SFX.pickup(); }
        else { this.count++; this.heal(8); SFX.pickup(); this.hooks.toast?.(this.def.mechanic === 'forgive' ? `Shard of the bond (${this.count}/${this.def.need})` : this.def.mechanic === 'greed' ? `Manna (${this.count}/${this.def.need})` : `Lily (${this.count}/${this.def.need})`); }
        this.hooks.onObjective?.(this.objectiveText());
      }
    }
    // checkpoints
    for (const c of (this.def.checkpoints || [])) {
      if (Math.hypot(c.x - this.cx(), c.y - this.cy()) < 50) {
        if (this.checkpoint.x !== c.x || this.checkpoint.y !== c.y) { this.checkpoint = { ...c }; this.heal(40); SFX.checkpoint(); this.hooks.toast?.('Checkpoint altar — grace restored ✦'); }
      }
    }
    // enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.t += dt;
      if (e.type === 'patrol') e.x = e.ox + Math.sin(e.t * 0.9) * e.range;
      else if (e.type === 'chaser') {
        const d = Math.hypot(this.cx() - e.x, this.cy() - e.y) || 1;
        if (d < 380) { e.x += (this.cx() - e.x) / d * e.speed * dt; e.y += (this.cy() - e.y) / d * e.speed * dt; }
      }
      if (Math.hypot(e.x - this.cx(), e.y - this.cy()) < 34) {
        if (this.def.mechanic === 'wrath') { this.damage(6 * dt * 10 * 0.16, true); if (!e.hintShown) { e.hintShown = true; this.hooks.toast?.('Press E beside him to SPARE, not to strike!'); } }
        else this.damage(25 * dt, true);
      }
    }
    // hazards
    for (const h of (this.def.hazards || [])) {
      if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, h)) this.damage(30 * dt);
    }
    // pride crowns
    if (this.def.crowns) {
      this.crownT += dt;
      if (this.crownT > 1.1) { this.crownT = 0; this.crowns.push({ x: Math.random() * 1500 + 50, y: -30, vy: 160 + Math.random() * 120 + this.t * 2 }); }
      for (const c of this.crowns) {
        c.y += c.vy * dt;
        if (Math.hypot(c.x - this.cx(), c.y - this.cy()) < 30) { this.damage(14); SFX.bad(); c.y = 2000; }
      }
      this.crowns = this.crowns.filter(c => c.y < 1100);
    }
    // exit
    const ex = this.def.exit;
    const needMet = this.levelGoalMet();
    if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, ex)) {
      if (this.def.mechanic === 'forgive' && !this.exitOpen) { this.hooks.toast?.('Chained shut. Forgive him first (E beside him).'); }
      else if (!needMet) { this.hooks.toast?.('The gate is dim — complete your task first.'); if (!this._nag || this.t - this._nag > 4) { this._nag = this.t; SFX.bad(); } }
      else { this.done = true; this.running = false; SFX.gate(); setTimeout(() => SFX.victory(), 400); this.hooks.complete?.({ gold: p.gold, grace: Math.round(this.grace) }); }
    }
    if (this.shake > 0) this.shake *= Math.max(0, 1 - dt * 6);
  }
  spawnWraith(at) { this.enemies.push({ x: at.x, y: at.y, ox: at.x, oy: at.y, type: 'chaser', speed: 95, t: 0, alive: true }); }
  levelGoalMet() {
    const m = this.def.mechanic;
    if (m === 'sloth') return this.beacons.every(b => b.lit);
    if (['greed', 'envy', 'wrath', 'lies', 'forgive'].includes(m)) return this.count >= this.def.need;
    return true;
  }
  respawn() {
    this.player.x = this.checkpoint.x; this.player.y = this.checkpoint.y;
    this.grace = 100; this.over = false; this.running = true;
  }
  render(settings) {
    const c = this.ctx, d = this.def;
    const lvl = d.id;
    const bright = lvl / 6; // 0 dark -> 1 light
    const sx = this.shake > 0.3 && settings.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0.3 && settings.shake ? (Math.random() - 0.5) * this.shake : 0;
    // sky
    const g = c.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, d.sky[1]); g.addColorStop(1, d.sky[0]);
    c.fillStyle = g; c.fillRect(0, 0, 960, 600);
    // stars / light particles
    c.save();
    for (let i = 0; i < 60; i++) {
      const px = (i * 173 + lvl * 97) % 960, py = (i * 311 + Math.floor(this.t * (10 + bright * 20)) % 600 + i * 13) % 600;
      c.globalAlpha = 0.15 + bright * 0.5;
      c.fillStyle = '#fff';
      c.fillRect(px, py, bright > 0.6 ? 3 : 2, bright > 0.6 ? 3 : 2);
    }
    c.restore();
    c.save();
    c.translate(-Math.round(this.cam.x + sx), -Math.round(this.cam.y + sy));
    // ground
    c.fillStyle = d.sky[0]; c.fillRect(this.cam.x - 60, this.cam.y - 60, 1080, 720);
    // decorative grid glow
    c.strokeStyle = d.accent + '22'; c.lineWidth = 1;
    for (let gx = 0; gx < 1600; gx += 80) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, 1000); c.stroke(); }
    for (let gy = 0; gy < 1000; gy += 80) { c.beginPath(); c.moveTo(0, gy); c.lineTo(1600, gy); c.stroke(); }
    // walls
    for (const w of d.walls) {
      c.fillStyle = '#1d2742'; c.fillRect(w.x, w.y, w.w, w.h);
      c.fillStyle = d.accent + '55'; c.fillRect(w.x, w.y, w.w, 3);
    }
    // bridges
    for (const b of (d.bridges || [])) { c.fillStyle = '#3a2f18'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = '#e8c46a'; c.fillRect(b.x, b.y, b.w, 4); }
    // hazards
    for (const h of (d.hazards || [])) { c.fillStyle = '#ff4d4d33'; c.fillRect(h.x, h.y, h.w, h.h); }
    // checkpoints (altars)
    for (const ch of (d.checkpoints || [])) {
      c.fillStyle = '#2b3a6b'; c.fillRect(ch.x - 16, ch.y - 10, 32, 22);
      c.fillStyle = '#9fd8ff'; c.beginPath(); c.arc(ch.x, ch.y - 14, 6 + Math.sin(this.t * 4) * 1.5, 0, 7); c.fill();
    }
    // beacons
    for (const b of this.beacons) {
      c.fillStyle = '#333'; c.fillRect(b.x - 8, b.y - 6, 16, 20);
      if (b.lit) { const r = 26 + Math.sin(this.t * 5) * 5; const rg = c.createRadialGradient(b.x, b.y - 14, 2, b.x, b.y - 14, r); rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#ff9b3d00'); c.fillStyle = rg; c.beginPath(); c.arc(b.x, b.y - 14, r, 0, 7); c.fill(); c.fillStyle = '#ffb13d'; c.beginPath(); c.arc(b.x, b.y - 14, 7, 0, 7); c.fill(); }
      else { c.fillStyle = '#556'; c.beginPath(); c.arc(b.x, b.y - 14, 5, 0, 7); c.fill(); }
    }
    // pickups
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      const bobY = Math.sin(pk.bob) * 4;
      const colors = { manna: '#ffe9a8', gold: '#e8c46a', lily: '#8fb4ff', envyGold: '#ffd24d', bread: '#d8a86a', shard: '#8fd8ff' };
      const emoji = { manna: '🍞', gold: '🪙', lily: '💠', envyGold: '🌾', bread: '🍞', shard: '💧' };
      c.font = '22px serif'; c.textAlign = 'center';
      c.globalAlpha = 0.35; c.fillStyle = colors[pk.kind] || '#fff';
      c.beginPath(); c.arc(pk.x, pk.y + bobY, 16, 0, 7); c.fill(); c.globalAlpha = 1;
      c.fillText(emoji[pk.kind] || '✦', pk.x, pk.y + 8 + bobY);
    }
    // tablets
    for (const t of (this.tablets || [])) {
      c.fillStyle = t.true ? '#e8ecff' : '#5a3a3a';
      c.fillRect(t.x - 14, t.y - 20, 28, 34);
      c.fillStyle = t.true ? '#7fb4ff' : '#ff7b7b';
      c.fillRect(t.x - 14, t.y - 20, 28, 5);
      c.font = '16px serif'; c.textAlign = 'center'; c.fillText(t.true ? '🤍' : '🌫️', t.x, t.y + 2);
    }
    // npcs + betrayer
    const drawFigure = (x, y, robe, glow) => {
      if (glow) { const rg = c.createRadialGradient(x, y, 2, x, y, 40); rg.addColorStop(0, glow); rg.addColorStop(1, '#0000'); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 40, 0, 7); c.fill(); }
      c.fillStyle = robe; c.beginPath(); c.arc(x, y - 8, 9, 0, 7); c.fill();
      c.fillRect(x - 8, y, 16, 18);
    };
    for (const n of this.npcs) drawFigure(n.x, n.y, '#7f8db3', d.accent + '44');
    if (d.betrayer) drawFigure(d.betrayer.x, d.betrayer.y, this.exitOpen ? '#cfe8ff' : '#4a4a5a', this.exitOpen ? '#ffffff88' : '#ff000033');
    // enemies
    for (const e of this.enemies) {
      if (!e.alive) { c.globalAlpha = 0.35; drawFigure(e.x, e.y, '#9fd8a8', '#9fd8a855'); c.globalAlpha = 1; c.font = '14px serif'; c.fillText('🙏', e.x, e.y - 24); continue; }
      const pulse = Math.sin(this.t * 6 + e.id) * 2;
      const rg = c.createRadialGradient(e.x, e.y, 2, e.x, e.y, 34 + pulse); rg.addColorStop(0, '#ff5b3d88'); rg.addColorStop(1, '#0000');
      c.fillStyle = rg; c.beginPath(); c.arc(e.x, e.y, 34 + pulse, 0, 7); c.fill();
      c.fillStyle = '#2a0f0f'; c.beginPath(); c.arc(e.x, e.y - 6, 11, 0, 7); c.fill();
      c.fillStyle = '#ff6b4d'; c.beginPath(); c.arc(e.x - 4, e.y - 8, 2.4, 0, 7); c.arc(e.x + 4, e.y - 8, 2.4, 0, 7); c.fill();
      c.fillStyle = '#3a1414'; c.fillRect(e.x - 10, e.y + 4, 20, 16);
    }
    // crowns
    c.font = '22px serif'; c.textAlign = 'center';
    for (const cr of this.crowns) c.fillText('👑', cr.x, cr.y);
    // exit gate
    const ex = d.exit;
    const open = this.levelGoalMet() && (d.mechanic !== 'forgive' || this.exitOpen);
    const gr = c.createRadialGradient(ex.x + ex.w / 2, ex.y + ex.h / 2, 4, ex.x + ex.w / 2, ex.y + ex.h / 2, 90);
    gr.addColorStop(0, open ? '#ffffff' : '#333a55'); gr.addColorStop(1, '#0000');
    c.fillStyle = gr; c.beginPath(); c.arc(ex.x + ex.w / 2, ex.y + ex.h / 2, 90, 0, 7); c.fill();
    c.fillStyle = open ? '#f5ecd7' : '#2a3352'; c.fillRect(ex.x, ex.y, ex.w, ex.h);
    c.fillStyle = open ? '#fff' : '#8fa3c7'; c.font = '34px serif'; c.textAlign = 'center';
    c.fillText(open ? '✦' : '🔒', ex.x + ex.w / 2, ex.y + ex.h / 2 + 12);
    // player (pilgrim with growing light)
    const p = this.player;
    const lightR = 70 + bright * 90 + (p.moving ? 8 : 0);
    const lg = c.createRadialGradient(this.cx(), this.cy(), 4, this.cx(), this.cy(), lightR);
    lg.addColorStop(0, '#ffe9a855'); lg.addColorStop(1, '#0000');
    c.fillStyle = lg; c.beginPath(); c.arc(this.cx(), this.cy(), lightR, 0, 7); c.fill();
    const bob = p.moving ? Math.sin(this.t * 12) * 2 : 0;
    c.fillStyle = '#0e1428'; c.fillRect(p.x - 2, p.y + 4 + bob, p.w + 4, p.h);
    c.fillStyle = '#e8d5a8'; c.beginPath(); c.arc(this.cx(), p.y + 8 + bob, 8, 0, 7); c.fill();
    c.fillStyle = '#3f5a9e'; c.fillRect(p.x, p.y + 14 + bob, p.w, 16);
    c.fillStyle = '#e8c46a'; c.fillRect(p.x + (p.face > 0 ? p.w - 5 : 1), p.y + 16 + bob, 4, 8);
    // interact prompt
    const near = [...this.npcs, ...(this.tablets || []).map(t => ({ x: t.x, y: t.y })), ...(d.betrayer ? [d.betrayer] : [])]
      .some(n => Math.hypot(n.x - this.cx(), n.y - this.cy()) < 80);
    if (near) { c.fillStyle = '#fff'; c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText('[E] ✦', this.cx(), p.y - 12); }
    c.restore();
    // vignette: darker early, luminous late
    const v = c.createRadialGradient(480, 300, 200, 480, 300, 620);
    v.addColorStop(0, '#0000'); v.addColorStop(1, `rgba(0,0,10,${0.55 - bright * 0.4})`);
    c.fillStyle = v; c.fillRect(0, 0, 960, 600);
  }
  start() { this.running = true; this.last = performance.now(); }
}
