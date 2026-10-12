import Screen, { BackButton } from '../components/Screen'
import { setSetting, useSettings } from '../lib/settings'
import { BIOMES, BIOME_IDS } from '../lib/biomes'

const OPTIONS = [
  ['sound', 'Sound'],
  ['splash', 'Splash Text'],
  ['motion', 'Panorama Motion'],
  ['blur', 'Background Blur'],
]

const BIOME_CYCLE = ['random', ...BIOME_IDS]

export default function Options() {
  const settings = useSettings()
  const nextBiome = BIOME_CYCLE[(BIOME_CYCLE.indexOf(settings.biome) + 1) % BIOME_CYCLE.length]

  return (
    <Screen title="Options" footer={<BackButton label="Done" />}>
      <div className="options">
        {OPTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="mc-btn"
            aria-pressed={settings[key]}
            onClick={() => setSetting(key, !settings[key])}
          >
            {label}: {settings[key] ? 'ON' : 'OFF'}
          </button>
        ))}
        <button type="button" className="mc-btn" onClick={() => setSetting('biome', nextBiome)}>
          Biome: {BIOMES[settings.biome]?.label ?? 'Random'}
        </button>
      </div>
    </Screen>
  )
}
