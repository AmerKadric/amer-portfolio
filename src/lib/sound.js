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
