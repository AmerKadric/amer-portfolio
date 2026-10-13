import { generateWorld, transferables } from './worldgen'

// Builds the world off the main thread so the page stays responsive meanwhile
self.onmessage = ({ data: { biome, time } }) => {
  const world = generateWorld(biome, time)
  self.postMessage({ world }, transferables(world))
}
