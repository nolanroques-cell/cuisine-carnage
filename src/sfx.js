// Tiny Web Audio synth for the game's sound effects. The project ships no
// audio files, so every sound is an oscillator with an envelope. All calls are
// guarded: audio must never be able to take the game down.

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(o) {
  const c = ac();
  if (!c) return;
  try {
    const t = c.currentTime + (o.delay ?? 0);
    const dur = o.dur ?? 0.1;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq ?? 440, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch { /* audio is optional */ }
}

export const sfx = {
  click: () => tone({ freq: 600, dur: 0.05, type: 'triangle', gain: 0.08 }),
  pop: () => tone({ freq: 300, to: 520, dur: 0.09, type: 'triangle', gain: 0.12 }),
  coin: () => {
    tone({ freq: 880, dur: 0.07, type: 'square', gain: 0.07 });
    tone({ freq: 1318, dur: 0.12, type: 'square', gain: 0.06, delay: 0.07 });
  },
  ding: () => tone({ freq: 1568, dur: 0.35, type: 'triangle', gain: 0.14 }),
  chop: () => tone({ freq: 220, to: 55, dur: 0.14, type: 'square', gain: 0.22 }),
  splat: () => tone({ freq: 160, to: 40, dur: 0.3, type: 'sawtooth', gain: 0.18 }),
  angry: () => {
    tone({ freq: 130, dur: 0.12, type: 'sawtooth', gain: 0.1 });
    tone({ freq: 110, dur: 0.16, type: 'sawtooth', gain: 0.1, delay: 0.13 });
  },
  fail: () => tone({ freq: 240, to: 110, dur: 0.3, type: 'sawtooth', gain: 0.12 }),
  buy: () => {
    [523, 659, 784].forEach((f, i) =>
      tone({ freq: f, dur: 0.14, type: 'triangle', gain: 0.1, delay: i * 0.09 }));
  },
  cook: () => tone({ freq: 520, to: 700, dur: 0.12, type: 'sine', gain: 0.08 }),
  pew: () => tone({ freq: 900, to: 180, dur: 0.13, type: 'square', gain: 0.14 }),
  flame: () => tone({ freq: 140, to: 60, dur: 0.4, type: 'sawtooth', gain: 0.18 }),
  boom: () => tone({ freq: 90, to: 30, dur: 0.5, type: 'sawtooth', gain: 0.25 }),
};