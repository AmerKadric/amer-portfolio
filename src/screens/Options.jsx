import Screen, { BackButton } from '../components/Screen'
import { setSetting, useSettings } from '../lib/settings'
import { BIOMES, BIOME_IDS, TIMES } from '../lib/biomes'
import { ADVANCEMENTS, useUnlocked } from '../lib/advancements'

const OPTIONS = [
  ['sound', 'Sound'],
  ['splash', 'Splash Text'],
  ['motion', 'Panorama Motion'],
  ['blur', 'Background Blur'],
]

const BIOME_CYCLE = ['random', ...BIOME_IDS]

export default function Options() {
  const settings = useSettings()
  const unlocked = useUnlocked()
  const ids = Object.keys(ADVANCEMENTS)
  const nextBiome = BIOME_CYCLE[(BIOME_CYCLE.indexOf(settings.biome) + 1) % BIOME_CYCLE.length]
  const nextTime = TIMES[(TIMES.indexOf(settings.time) + 1) % TIMES.length]

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
        <button type="button" className="mc-btn" onClick={() => setSetting('time', nextTime)}>
          Time: {{ day: 'Day', sunset: 'Sunset' }[settings.time] ?? 'Random'}
        </button>
      </div>
      <div className="advancements">
        <h2>Advancements: {unlocked.length}/{ids.length}</h2>
        <ul>
          {ids.map((id) => (
            <li key={id} className={unlocked.includes(id) ? 'done' : 'dim'}>
              {unlocked.includes(id) ? ADVANCEMENTS[id].title : '???'}
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  )
}
