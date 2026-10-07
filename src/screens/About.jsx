import { useState } from 'react'
import { Network, Wrench, Globe, Shield, Headphones, Users, GraduationCap } from 'lucide-react'
import Screen, { Tags } from '../components/Screen'
import { about, profile } from '../data'

const ICONS = [Network, Wrench, Globe, Shield, Headphones, Users]

export default function About() {
  const [openSlot, setOpenSlot] = useState(null)
  const edu = about.education

  return (
    <Screen title="About Me">
      <div className="about scroll">
        <aside className="about-card">
          <div className="photo-frame">
            <picture>
              <source srcSet="/profile.webp" type="image/webp" />
              <img src="/profile.png" alt={profile.name} />
            </picture>
          </div>
          <div className="nameplate">{profile.name}</div>
          <dl className="facts">
            {about.facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Tags items={about.chips} />
          <div className="about-actions">
            <a className="mc-btn small" href={profile.resume} download>Resume</a>
            <a className="mc-btn small" href="#/contact">Contact</a>
          </div>
        </aside>

        <div className="about-main">
          <div className="panel warm bio">
            {about.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="section-head">
            <h2>What I do</h2>
            <span className="dim">click a slot to open it</span>
          </div>
          <div className="slot-list">
            {about.highlights.map((h, i) => {
              const Icon = ICONS[i % ICONS.length]
              const isOpen = openSlot === i
              return (
                <button
                  key={h.title}
                  type="button"
                  className={`slot-row ${isOpen ? 'open' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpenSlot(isOpen ? null : i)}
                >
                  <span className="slot"><Icon /></span>
                  <span className="slot-text">
                    <span className="kicker">{h.kicker}</span>
                    <span className="slot-title">{h.title}</span>
                    {isOpen && <span className="slot-desc">{h.desc}</span>}
                  </span>
                  <span className="plus">{isOpen ? '−' : '+'}</span>
                </button>
              )
            })}
          </div>

          <div className="section-head">
            <h2>Education</h2>
            <span className="dim">{edu.period}</span>
          </div>
          <div className="panel edu">
            <div className="edu-head">
              <span className="slot"><GraduationCap /></span>
              <div>
                <div className="slot-title">{edu.school}</div>
                <div className="dim">{edu.college} · {edu.degree}</div>
              </div>
            </div>
            <div className="edu-stats">
              {edu.stats.map(([k, v]) => (
                <div key={k}>
                  <b>{v}</b>
                  <span className="dim">{k}</span>
                </div>
              ))}
            </div>
            <Tags items={edu.coursework} />
          </div>
        </div>
      </div>
    </Screen>
  )
}
