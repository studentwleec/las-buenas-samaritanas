// Central save / settings store (localStorage). No dependencies.
const KEY = 'pilgrims-ascent-v1';
const defaults = () => ({ unlocked: 0, done: [], settings: { music: 70, sfx: 85, shake: true, hints: true } });

export const Save = {
  data: defaults(),
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...defaults(), ...JSON.parse(raw) };
    } catch { this.data = defaults(); }
    return this.data;
  },
  write() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {} },
  complete(i) {
    if (!this.data.done.includes(i)) this.data.done.push(i);
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(i + 1, 7));
    this.write();
  },
  reset() { this.data = defaults(); this.write(); }
};
