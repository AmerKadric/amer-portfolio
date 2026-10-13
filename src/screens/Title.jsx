import { useState } from 'react'
import { Github, Linkedin } from 'lucide-react'
import { profile, splashes } from '../data'
import { useSettings } from '../lib/settings'
import { playClick } from '../lib/sound'
import { rerollSplash } from '../lib/advancements'

const pick = (prev) => {
  let next
  do next = splashes[Math.floor(Math.random() * splashes.length)]
  while (next === prev && splashes.length > 1)
  return next
}

export default function Title() {
  const { splash } = useSettings()
  const [text, setText] = useState(() => pick())

  return (
    <main className="title-screen">
      <h1 className="sr-only">{profile.name} — Portfolio</h1>
      <div className="logo" aria-hidden="true">
        <img className="logo-img" src="/logo.webp" alt="" width="1921" height="633" />
        {splash && (
          <button
            type="button"
            className="splash"
            title="Click for another"
            onClick={() => {
              playClick()
              setText(pick(text))
              rerollSplash()
            }}
          >
            {text}
          </button>
        )}
      </div>

      <nav className="title-menu" aria-label="Main menu">
        <a className="mc-btn" href="#/experience">Experience</a>
        <a className="mc-btn" href="#/projects">Projects</a>
        <a className="mc-btn" href="#/about">About Me</a>
        <div className="title-row">
          <a className="mc-btn square" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github />
          </a>
          <a className="mc-btn" href="#/skills">Skills</a>
          <a className="mc-btn" href="#/contact">Contact</a>
          <a className="mc-btn square" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin />
          </a>
        </div>
      </nav>
    </main>
  )
}
