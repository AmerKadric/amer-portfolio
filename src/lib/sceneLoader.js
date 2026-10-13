import { pickBiome, pickTime } from './biomes'

// Lives in the main bundle so the world can start building in a Web Worker the
// moment the page starts, in parallel with downloading the 3D engine.

export const pickScene = (biomeSetting, timeSetting) => ({
  biome: pickBiome(biomeSetting),
  time: pickTime(timeSetting),
})

let cache = null // the most recent request, so the 3D view picks up work already in flight

export function loadWorld(biome, time) {
  const key = `${biome}|${time}`
  if (cache?.key === key) return cache.promise
  const fallback = (resolve) => import('./worldgen').then((m) => resolve(m.generateWorld(biome, time)))
  const promise = new Promise((resolve) => {
    let worker
    try {
      worker = new Worker(new URL('./worldgen.worker.js', import.meta.url), { type: 'module' })
    } catch {
      fallback(resolve)
      return
    }
    worker.onmessage = ({ data }) => {
      worker.terminate()
      resolve(data.world)
    }
    worker.onerror = () => {
      worker.terminate()
      fallback(resolve)
    }
    worker.postMessage({ biome, time })
  })
  cache = { key, promise }
  return promise
}
