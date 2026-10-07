// App wiring: screens, HUD, dialogue, progression, Heaven finale.
// Classic script — uses globals from save.js / audio.js / levels.js / engine.js (no imports, file:// safe).

const $ = id => document.getElementById(id);
Save.load();
const canvas = $('game');
let dlgQueue = [], dlgActive = false, choiceCb = null;

const game = new Game(canvas, {
  onObjective: t => { $('hud-objective').textContent = t; },
  toast: msg => {
    const el = $('toast'); el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 2600);
  },
  dialogue: (name, lines) => showDialogue(name, lines),
  choice: (title, opts, cb) => showChoice(title, opts, cb),
  onAdvance: () => advanceDialogue(),
  // E key: advance open dialogue, else interact. Always consumes (prevents double-fire skipping first line).
  onInteractConsumed: () => {
    if (!$('dialogue').classList.contains('hidden')) { advanceDialogue(); return true; }
    if (!$('choice').classList.contains('hidden')) return true;
    game.tryInteract();
    return true;
  },
  onPause: () => { if (game.running && !dlgActive) pauseGame(); },
  complete: stats => levelComplete(stats),
  gameover: () => { show('screen-gameover'); stopMusic(); }
});

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  if (id) $(id).classList.remove('hidden');
  const inGame = !id || id === 'screen-pause';
  $('hud').classList.toggle('hidden', !(game.levelActive && (inGame || !id)));
  if (!id) $('hud').classList.remove('hidden');
}
function showDialogue(name, lines) {
  dlgQueue = [...lines]; dlgActive = true; game.running = false;
  $('dlg-name').textContent = name; $('dialogue').classList.remove('hidden');
  nextLine();
}
function nextLine() {
  const l = dlgQueue.shift();
  if (l === undefined) { $('dialogue').classList.add('hidden'); dlgActive = false; game.running = true; return; }
  $('dlg-text').textContent = l; SFX.talk();
}
function advanceDialogue() {
  if (!$('dialogue').classList.contains('hidden')) {
    if (!$('choice').classList.contains('hidden')) return;
    if (dlgQueue.length) nextLine();
    else { $('dialogue').classList.add('hidden'); dlgActive = false; if (game.levelActive && pausedFor !== true) game.running = true; }
  }
}
$('dialogue').addEventListener('click', advanceDialogue);
function showChoice(title, opts, cb) {
  game.running = false; choiceCb = cb;
  const box = $('choice'); box.classList.remove('hidden');
  box.innerHTML = `<h3>${title}</h3>` + opts.map((o, i) => `<button class="btn${i === 0 ? ' primary' : ''}" data-v="${o.value}">${o.label}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => { box.classList.add('hidden'); game.running = true; choiceCb(b.dataset.v); });
}

let current = 0, pausedFor = false, settingsReturn = 'menu';
$('btn-settings').onclick = () => { settingsReturn = 'menu'; show('screen-settings'); };
function startLevel(i) {
  current = i; SFX.unlock();
  setVolumes(Save.data.settings.music, Save.data.settings.sfx);
  const def = LEVELS[i];
  game.levelActive = true;
  game.loadLevel(def);
  game.start();
  $('hud-level').textContent = def.name;
  updateHUD();
  $('intro-title').textContent = def.name;
  $('intro-theme').textContent = def.theme;
  $('intro-text').textContent = def.intro;
  $('intro-verse').textContent = def.verse;
  $('intro-goal').innerHTML = `<b>Objective:</b> ${def.goal}`;
  show('screen-intro');
  game.running = false;
  startMusic(i);
}
function updateHUD() {
  $('faith-fill').style.width = game.grace + '%';
  $('faith-fill').style.background = game.grace > 50 ? '' : 'linear-gradient(90deg,#ff5b5b,#ffb13d)';
  const d = LEVELS[current];
  const pct = game.levelGoalMet() ? 100 : Math.min(95, (game.count / (d.need || 4)) * 90 + 5);
  $('hud-progress-fill').style.width = pct + '%';
  $('hud-items').textContent = d.mechanic === 'greed' ? `🍞 ${game.count} · 🪙 ${game.player.gold}` : `✦ ${game.count}/${d.need || '—'} · grace ${Math.round(game.grace)}`;
}
function levelComplete(stats) {
  Save.complete(current);
  game.levelActive = false;
  stopMusic();
  if (current >= LEVELS.length - 1) { startHeaven(); return; }
  const def = LEVELS[current];
  $('complete-title').textContent = `${def.name} — Overcome ✦`;
  $('complete-lesson').textContent = def.lesson;
  $('complete-verse').textContent = def.verse;
  $('complete-stats').textContent = `Grace remaining: ${stats.grace}%${stats.gold ? ` · gold hoarded: ${stats.gold}` : ''} · ${(Save.data.done.length / LEVELS.length * 100).toFixed(0)}% of journey`;
  show('screen-complete');
}
function startHeaven() {
  game.levelActive = false;
  $('heaven-text').textContent = HEAVEN_TEXT.join(' ');
  show('screen-heaven');
  SFX.victory();
  // Render luminous heaven backdrop on canvas behind panel
  const c = canvas.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, '#fff8e0'); g.addColorStop(0.5, '#ffe9a8'); g.addColorStop(1, '#9fd8ff');
  c.fillStyle = g; c.fillRect(0, 0, 960, 600);
  c.fillStyle = '#ffffffcc';
  for (let i = 0; i < 40; i++) { c.globalAlpha = 0.5; c.beginPath(); c.arc((i * 173) % 960, 120 + ((i * 97) % 350), 2 + (i % 4), 0, 7); c.fill(); }
  c.globalAlpha = 1;
  c.fillStyle = '#b8860b'; c.font = 'bold 30px Georgia'; c.textAlign = 'center';
  c.fillText('✦ “Well done, good and faithful servant.” — Matthew 25:23 ✦', 480, 520);
}
function pauseGame() { game.running = false; pausedFor = true; show('screen-pause'); }
function renderLevels() {
  const grid = $('level-grid'); grid.innerHTML = '';
  LEVELS.forEach((l, i) => {
    const locked = i > Save.data.unlocked;
    const done = Save.data.done.includes(i);
    const div = document.createElement('div');
    div.className = `lvl-card${locked ? ' locked' : ''}${done ? ' done' : ''}`;
    div.innerHTML = `<div class="ico">${locked ? '🔒' : l.icon}</div><b>${l.name}</b><small>${done ? '✓ Overcome' : locked ? 'Locked' : l.sin}</small>`;
    if (!locked) div.onclick = () => { SFX.unlock(); startLevel(i); };
    grid.appendChild(div);
  });
  const h = document.createElement('div');
  h.className = 'lvl-card' + (Save.data.done.length === LEVELS.length ? ' done' : ' locked');
  h.innerHTML = `<div class="ico">☁️</div><b>Heaven</b><small>${Save.data.done.length === LEVELS.length ? '✓ Open' : 'Finish all trials'}</small>`;
  if (Save.data.done.length === LEVELS.length) h.onclick = startHeaven;
  grid.appendChild(h);
}

// Pilgrim entry codes (optional — the journey is open to all; codes just unlock the map)
const ENTRY_CODES = { JOHN812: 'all', AMEN: 'all', GRACE: 'all', FAITH777: 'all' };
$('btn-code').onclick = () => {
  const v = ($('entry-code').value || '').trim().toUpperCase();
  const msg = $('code-msg');
  if (ENTRY_CODES[v]) {
    Save.data.unlocked = LEVELS.length - 1;
    Save.write(); goMenu();
    msg.textContent = '✦ Code accepted — the whole path is open. See the Journey Map.';
  } else if (!v) { msg.textContent = 'Type a pilgrim code, or just press New Journey — no code needed.'; }
  else { msg.textContent = 'That code is not recognised. The journey itself needs no code — press New Journey. ✦'; }
};
const goMenu = () => { game.levelActive = false; game.running = false; stopMusic(); show('screen-menu'); $('hud').classList.add('hidden'); $('btn-continue').style.display = Save.data.unlocked > 0 || Save.data.done.length ? '' : 'none'; };
$('btn-new').onclick = () => { Save.reset(); applySettingsUI(); startLevel(0); };
$('btn-continue').onclick = () => startLevel(Math.min(Save.data.unlocked, LEVELS.length - 1));
$('btn-levels').onclick = () => { renderLevels(); show('screen-levels'); };
$('btn-levels-back').onclick = goMenu;
$('btn-settings').onclick = () => show('screen-settings');
$('btn-settings-back').onclick = () => {
  if (settingsReturn === 'pause') { show('screen-pause'); }
  else if (settingsReturn === 'levels') { renderLevels(); show('screen-levels'); }
  else goMenu();
};
$('btn-help').onclick = () => show('screen-help');
$('btn-help-back').onclick = goMenu;
$('btn-wipe').onclick = () => { if (confirm('Erase all progress?')) { Save.reset(); goMenu(); } };
$('btn-intro-begin').onclick = () => { show(null); game.running = true; };
$('btn-complete-next').onclick = () => startLevel(Math.min(current + 1, LEVELS.length - 1));
$('btn-complete-map').onclick = () => { renderLevels(); show('screen-levels'); };
$('btn-resume').onclick = () => { pausedFor = false; show(null); game.running = true; };
$('btn-restart').onclick = () => { pausedFor = false; startLevel(current); };
$('btn-pause-settings').onclick = () => { settingsReturn = 'pause'; show('screen-settings'); };
$('btn-quit').onclick = goMenu;
$('btn-retry').onclick = () => { show(null); game.respawn(); };
$('btn-go-map').onclick = () => { renderLevels(); show('screen-levels'); };
$('btn-heaven-replay').onclick = () => { startLevel(0); };
$('btn-heaven-menu').onclick = goMenu;

// Settings
function applySettingsUI() {
  $('set-music').value = Save.data.settings.music;
  $('set-sfx').value = Save.data.settings.sfx;
  $('set-shake').checked = Save.data.settings.shake;
  $('set-hints').checked = Save.data.settings.hints;
  $('hud-hint').style.display = Save.data.settings.hints ? '' : 'none';
}
['set-music', 'set-sfx', 'set-shake', 'set-hints'].forEach(id => $(id).addEventListener('input', () => {
  Save.data.settings = { music: +$('set-music').value, sfx: +$('set-sfx').value, shake: $('set-shake').checked, hints: $('set-hints').checked };
  Save.write(); setVolumes(Save.data.settings.music, Save.data.settings.sfx); applySettingsUI();
}));

// Main loop
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (game.levelActive && game.running) { game.update(dt); updateHUD(); }
  if (game.levelActive && !dlgActive) { try { game.render(Save.data.settings); } catch (e) { console.error(e); } }
  requestAnimationFrame(loop);
}
applySettingsUI();
goMenu();
requestAnimationFrame(loop);
