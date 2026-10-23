// Synthesised chiptune music + sound effects (Web Audio) – no audio files, no copyright, works on Vercel
let ctx, master, timer, mode = null, muted = false, nextT = 0, step = 0
const mtof = m => 440 * 2 ** ((m - 69) / 12)
const SONGS = {
  lobby: { bpm: 108, arp: [0, 1, 2, 1, 0, 1, 2, 1], type: 'triangle',
    prog: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]] },
  game: { bpm: 142, arp: [0, 2, 1, 2, 0, 2, 1, 2], type: 'square',
    prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]] },
}
function init() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination)
}
function tone(freq, t, dur, type = 'square', vol = 0.06) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02)
}
function schedule() {
  const s = SONGS[mode]; if (!s) return
  const dur = 60 / s.bpm / 2
  while (nextT < ctx.currentTime + 0.3) {
    const chord = s.prog[Math.floor(step / 8) % 4]
    tone(mtof(chord[s.arp[step % 8]] + 12), nextT, dur * 0.9, s.type, 0.05)
    if (step % 2 === 0) tone(mtof(chord[0] - 24 + (step % 4 === 2 ? 12 : 0)), nextT, dur * 1.8, 'sawtooth', 0.035)
    if (mode === 'game' && step % 4 === 2) tone(180, nextT, 0.05, 'square', 0.02)
    nextT += dur; step++
  }
}
export function unlock() { init(); if (ctx.state === 'suspended') ctx.resume() }
export function music(m) {
  init(); if (ctx.state === 'suspended') ctx.resume()
  if (m === mode) return
  clearInterval(timer); mode = m; step = 0
  if (!m) return
  nextT = ctx.currentTime + 0.05; schedule(); timer = setInterval(schedule, 100)
}
export function setMuted(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.9 }
export const isMuted = () => muted
export function correct() { if (!ctx) return; const t = ctx.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(mtof(n), t + i * 0.08, 0.18, 'square', 0.09)) }
export function wrong() { if (!ctx) return; const t = ctx.currentTime; [55, 50, 46].forEach((n, i) => tone(mtof(n), t + i * 0.12, 0.25, 'sawtooth', 0.09)) }
export function tick() { if (!ctx) return; tone(1100, ctx.currentTime, 0.06, 'triangle', 0.08) }
export function fanfare() { if (!ctx) return; const t = ctx.currentTime; [67, 72, 76, 79, 84].forEach((n, i) => tone(mtof(n), t + i * 0.12, 0.3, 'square', 0.08)) }
