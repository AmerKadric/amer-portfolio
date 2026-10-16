import { getSettings } from './settings'

let ctx

// A short synthesized "tock", similar in spirit to a menu button click.
export function playClick() {
  if (!getSettings().sound) return
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime

    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
    const src = ctx.createBufferSource()
    src.buffer = noise
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1700
    band.Q.value = 1.2
    const ng = ctx.createGain()
    ng.gain.value = 0.5
    src.connect(band).connect(ng).connect(ctx.destination)
    src.start(t)

    const osc = ctx.createOscillator()
    const og = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(720, t)
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.07)
    og.gain.setValueAtTime(0.12, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(og).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  } catch {}
}

// Two rising notes for the "Advancement Made!" toast.
export function playChime() {
  if (!getSettings().sound) return
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime
    ;[[660, 0], [990, 0.12]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, t + delay)
      g.gain.exponentialRampToValueAtTime(0.05, t + delay + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.3)
      osc.connect(g).connect(ctx.destination)
      osc.start(t + delay)
      osc.stop(t + delay + 0.32)
    })
  } catch {}
}

// Short burst of filtered noise plus a falling tone (shared by the game's hit sounds)
function thud({ freq, endFreq, noiseFreq, gain, length }) {
  if (!getSettings().sound) return
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
    const src = ctx.createBufferSource()
    src.buffer = noise
    const band = ctx.createBiquadFilter()
    band.type = 'lowpass'
    band.frequency.value = noiseFreq
    const ng = ctx.createGain()
    ng.gain.value = gain
    src.connect(band).connect(ng).connect(ctx.destination)
    src.start(t)

    const osc = ctx.createOscillator()
    const og = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + length)
    og.gain.setValueAtTime(gain * 0.6, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + length)
    osc.connect(og).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + length + 0.02)
  } catch {}
}

// The player getting hurt: a low "oof"
export const playHurt = () => thud({ freq: 220, endFreq: 90, noiseFreq: 700, gain: 0.35, length: 0.22 })

// Hitting a creature: a quick, punchy smack
export const playHit = () => thud({ freq: 420, endFreq: 160, noiseFreq: 2200, gain: 0.25, length: 0.12 })
