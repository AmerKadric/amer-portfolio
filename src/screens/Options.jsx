import Screen, { BackButton } from '../components/Screen'
import { setSetting, useSettings } from '../lib/settings'

const OPTIONS = [
  ['sound', 'Sound'],
  ['splash', 'Splash Text'],
  ['motion', 'Panorama Motion'],
  ['blur', 'Background Blur'],
]

export default function Options() {
  const settings = useSettings()
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
      </div>
    </Screen>
  )
}
