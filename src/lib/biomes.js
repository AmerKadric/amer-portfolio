// Biome definitions for the background panorama. Each one controls terrain
// shape, which blocks cover the ground, what grows on it, and the sky.
//
// height(n, ridge): n is smooth noise (typically 0.26–0.73), ridge is 0–1 and
// peaks along sharp lines — only the mountains use it.
// trees.kinds: tree type → share of trees. plants: [type, chance, ground block].
// shore: plants along water. features: pumpkin patches and boulders.
// animals: which mobs graze near the camera. cloudCover: 0–1 share of sky.

const forestSurface = (top, depth, { sea }) => {
  const beach = top <= sea + 1
  if (depth === 0) return beach ? 'sand' : top > 21 ? 'stone' : 'grass'
  if (depth < 4) return beach ? 'sand' : 'dirt'
  return 'stone'
}

export const BIOMES = {
  forest: {
    label: 'Forest',
    palette: { grass: [96, 160, 56], leaves: [58, 120, 38], bark: [106, 84, 52], ring: [160, 128, 80] },
    sky: ['#5f8fdc', '#a9c6f2', '#c4d8f6'],
    fog: ['#bcd2f4', 28, 62],
    height: (n) => 4 + n * 22,
    sea: 10,
    water: 'water',
    surface: forestSurface,
    trees: { kinds: { oak: 0.7, birch: 0.3 }, chance: 0.024, maxTop: 21 },
    plants: [
      ['tallGrass', 0.14, 'grass'], ['poppy', 0.012, 'grass'], ['dandelion', 0.016, 'grass'],
      ['redMushroom', 0.003, 'grass'], ['brownMushroom', 0.003, 'grass'],
    ],
    shore: { sugarCane: 0.12, lilyPad: 0.05 },
    features: { pumpkin: 0.0012, boulder: 0.0006, boulderBlock: 'mossyCobble' },
    animals: { kinds: { sheep: 0.4, cow: 0.3, pig: 0.3 }, count: 8 },
    cloudCover: 0.42,
  },

  taiga: {
    label: 'Snowy Taiga',
    palette: { grass: [96, 150, 70], leaves: [40, 84, 52], bark: [70, 52, 34], ring: [130, 100, 66] },
    sky: ['#8ea6c8', '#c2cfe0', '#dfe6ee'],
    fog: ['#dbe3ec', 24, 58],
    height: (n) => 5 + n * 22,
    sea: 10,
    water: 'ice',
    surface: (top, depth, { sea }) => {
      if (depth === 0) return top <= sea ? 'snow' : top > 22 ? 'snow' : 'snowGrass'
      if (depth < 4) return 'dirt'
      return 'stone'
    },
    trees: { kinds: { spruce: 1 }, chance: 0.03, maxTop: 22 },
    snowyLeaves: true,
    plants: [['fern', 0.03, 'snowGrass'], ['berryBush', 0.012, 'snowGrass']],
    features: { boulder: 0.0016, boulderBlock: 'mossyCobble' },
    cloudCover: 0.55,
    light: 0.92,
  },

  desert: {
    label: 'Desert',
    palette: { grass: [96, 160, 56], leaves: [58, 120, 38], bark: [106, 84, 52], ring: [160, 128, 80] },
    sky: ['#6d9fe2', '#b6d0f0', '#eee2c6'],
    fog: ['#e8ddc4', 30, 66],
    height: (n) => 6 + n * 12,
    sea: 7,
    water: 'water',
    surface: (top, depth) => {
      if (depth < 3) return 'sand'
      if (depth < 7) return 'sandstone'
      return 'stone'
    },
    trees: { kinds: { cactus: 1 }, chance: 0.012, minAboveSea: 1 },
    plants: [['deadBush', 0.014, 'sand']],
    shore: { sugarCane: 0.18 },
    cloudCover: 0.12,
    light: 1.06,
  },

  mountains: {
    label: 'Mountains',
    palette: { grass: [100, 152, 70], leaves: [52, 110, 44], bark: [92, 70, 44], ring: [150, 118, 76] },
    sky: ['#4f86dc', '#9cc0f0', '#c8dbf6'],
    fog: ['#c3d6f3', 30, 66],
    // Stretch the noise to 0–1, push the high end into peaks, and carve ridges into them
    height: (n, ridge) => {
      const m = Math.min(1.1, Math.max(0, (n - 0.26) / 0.47))
      return 6 + m * 12 + Math.max(0, m - 0.35) ** 2 * 55 + Math.max(0, m - 0.4) * ridge * 22
    },
    sea: 9,
    water: 'water',
    minEye: 34, // look out over the peaks rather than up from a valley
    surface: (top, depth, { sea }) => {
      if (depth === 0) {
        if (top > 34) return 'snow'
        if (top > 24) return 'stone'
        return top <= sea + 1 ? 'sand' : 'grass'
      }
      if (depth < 3 && top <= 24) return top <= sea + 1 ? 'sand' : 'dirt'
      return 'stone'
    },
    trees: { kinds: { spruce: 0.8, oak: 0.2 }, chance: 0.02, maxTop: 22 },
    plants: [['tallGrass', 0.08, 'grass'], ['brownMushroom', 0.002, 'grass']],
    gravelPeaks: true,
    features: { boulder: 0.002, boulderBlock: 'cobble' },
    animals: { kinds: { sheep: 1 }, count: 6 },
    cloudCover: 0.32,
  },

  savanna: {
    label: 'Savanna',
    palette: { grass: [150, 150, 70], leaves: [104, 124, 44], bark: [110, 104, 96], ring: [176, 92, 52] },
    sky: ['#6b98d6', '#b4c9e4', '#e3dbc2'],
    fog: ['#ddd6bf', 30, 66],
    // Stepped plateaus
    height: (n) => {
      const h = 6 + n * 16
      return h > 15 ? 15 + Math.floor((h - 15) / 3) * 3 : h
    },
    sea: 8,
    water: 'water',
    surface: forestSurface,
    trees: { kinds: { acacia: 1 }, chance: 0.012, maxTop: 30 },
    plants: [['tallGrass', 0.22, 'grass']],
    shore: { sugarCane: 0.08 },
    features: { pumpkin: 0.0008 },
    animals: { kinds: { cow: 0.6, sheep: 0.4 }, count: 7 },
    cloudCover: 0.26,
    light: 1.06,
  },
}

export const BIOME_IDS = Object.keys(BIOMES)

// Occasionally (1 in 4) a random visit lands at sunset
export const TIMES = ['random', 'day', 'sunset']
export const pickTime = (setting) => (setting === 'day' || setting === 'sunset' ? setting : Math.random() < 0.25 ? 'sunset' : 'day')

export const SUNSET = {
  sky: ['#34508f', '#d98d68', '#f4bb7c'],
  fog: '#e8b088',
  tint: '#ffd6b8', // warms every block
  light: 0.82,
  cloud: '#f3c3ae',
}

export function pickBiome(setting) {
  if (BIOMES[setting]) return setting
  return BIOME_IDS[Math.floor(Math.random() * BIOME_IDS.length)]
}
