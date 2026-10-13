import { useEffect, useMemo, useState } from 'react'
import { Volume2, VolumeX, Settings } from 'lucide-react'
import Title from './screens/Title'
import Experience from './screens/Experience'
import Projects from './screens/Projects'
import About from './screens/About'
import Skills from './screens/Skills'
import Contact from './screens/Contact'
import Options from './screens/Options'
import Toast from './components/Toast'
import Backdrop from './components/Backdrop'
import Panorama from './components/Panorama'
import { go, useRoute } from './lib/router'
import { setSetting, useSettings } from './lib/settings'
import { playClick } from './lib/sound'
import { unlock, visitScreen } from './lib/advancements'
import { profile } from './data'
import { loadWorld, pickScene } from './lib/sceneLoader'


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
  const { sound, biome: biomeSetting, time: timeSetting } = useSettings()
  // Pick the scene once per setting change, and start building it in the background immediately
  const scene = useMemo(() => {
    const picked = pickScene(biomeSetting, timeSetting)
    loadWorld(picked.biome, picked.time)
    return picked
  }, [biomeSetting, timeSetting])
  const [worldReady, setWorldReady] = useState(false)
  const [Current, label] = SCREENS[route] ?? [Title, null]

  useEffect(() => visitScreen(route), [route])

  useEffect(() => {
    document.title = label ? `${label} | ${profile.name}` : `${profile.name} | ${profile.role}`
  }, [label])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && route && go('')
    const onClick = (e) => {
      const btn = e.target.closest('.mc-btn, .enchant-row, .slot-row, .entry')
      if (btn && !btn.disabled) playClick()
      if (e.target.closest(`a[href="${profile.resume}"]`)) unlock('resume')
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
      <Backdrop scene={scene} hidden={worldReady} />
      <Panorama scene={scene} onReady={setWorldReady} />
      <div className="screen-wrap" key={route}>
        <Current />
      </div>
      <Toast />

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
        <a className="mc-btn small" href="/quick-view/" title="Plain one-page summary">
          Quick View
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
