import { Mail, Linkedin, Github, MapPin, FileDown } from 'lucide-react'
import Screen from '../components/Screen'
import { profile } from '../data'

const rows = [
  { icon: Mail, color: '#b8443a', title: 'Email', value: profile.email, href: `mailto:${profile.email}`, note: 'Best way to reach me.' },
  { icon: Linkedin, color: '#0a66c2', title: 'LinkedIn', value: profile.linkedin.replace(/^https:\/\/(www\.)?/, ''), href: profile.linkedin, external: true },
  { icon: Github, color: '#3a3a3a', title: 'GitHub', value: profile.github.replace(/^https:\/\//, ''), href: profile.github, external: true },
  { icon: FileDown, color: '#5d8f3a', title: 'Resume', value: 'Download PDF', href: profile.resume, download: true },
  { icon: MapPin, color: '#8a6a3a', title: 'Location', value: profile.location, note: 'Open to remote and on-site roles.' },
]

export default function Contact() {
  return (
    <Screen title="Contact">
      <div className="panel scroll">
        {rows.map(({ icon: Icon, color, title, value, href, note, external, download }) => {
          const Tag = href ? 'a' : 'div'
          const linkProps = href
            ? { href, ...(external && { target: '_blank', rel: 'noopener noreferrer' }), ...(download && { download: true }) }
            : {}
          return (
            <Tag key={title} className={`entry ${href ? 'link' : ''}`} {...linkProps}>
              <div className="entry-icon" style={{ backgroundColor: color }}><Icon /></div>
              <div className="entry-main">
                <h2>{title}</h2>
                <p className="value">{value}</p>
                {note && <p className="dim">{note}</p>}
              </div>
            </Tag>
          )
        })}
      </div>
    </Screen>
  )
}
