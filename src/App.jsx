import { Suspense, lazy, useEffect } from 'react'
import { Volume2, VolumeX, Settings } from 'lucide-react'
import Title from './screens/Title'
import Experience from './screens/Experience'
import Projects from './screens/Projects'
import About from './screens/About'
import Skills from './screens/Skills'
import Contact from './screens/Contact'
import Options from './screens/Options'
import { go, useRoute } from './lib/router'
import { setSetting, useSettings } from './lib/settings'
import { playClick } from './lib/sound'
import { profile } from './data'

// Three.js is the bulk of the bundle — load it after the menu has painted
const Panorama = lazy(() => import('./components/Panorama'))

const SCREENS = {
  experience: [Experience, 'Experience'],
  projects: [Projects, 'Projects'],
  about: [About, 'About Me'],
  skills: [Skills, 'Skills'],
  contact: [Contact, 'Contact'],
  options: [Options, 'Options'],
}

export default function App() {
  const route = useRoute()
  const { sound } = useSettings()
  const [Current, label] = SCREENS[route] ?? [Title, null]

  useEffect(() => {
    document.title = label ? `${label} | ${profile.name}` : `${profile.name} | ${profile.role}`
  }, [label])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && route && go('')
    const onClick = (e) => {
      const btn = e.target.closest('.mc-btn, .enchant-row, .slot-row, .entry')
      if (btn && !btn.disabled) playClick()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [route])

  return (
    <>
      <Suspense fallback={null}>
        <Panorama />
      </Suspense>
      <div className="screen-wrap" key={route}>
        <Current />
      </div>

      <div className="corner corner-left">
        <button
          type="button"
          className="mc-btn square small"
          aria-label={sound ? 'Mute sounds' : 'Unmute sounds'}
          aria-pressed={!sound}
          onClick={() => setSetting('sound', !sound)}
        >
          {sound ? <Volume2 /> : <VolumeX />}
        </button>
        <a className="mc-btn square small" href="#/options" aria-label="Options">
          <Settings />
        </a>
        {!route && <span className="version">{profile.version}</span>}
      </div>

      {!route && (
        <footer className="corner corner-right">
          © {new Date().getFullYear()} {profile.name}. Not an official Minecraft product.
          <br />
          Not approved by or associated with Mojang or Microsoft.
        </footer>
      )}
    </>
  )
}
