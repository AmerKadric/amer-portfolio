import Screen, { Tags } from '../components/Screen'
import { experience } from '../data'

export default function Experience() {
  return (
    <Screen title="Experience">
      <div className="panel scroll">
        {experience.map((job) => (
          <article key={job.company} className="xp">
            <div className="xp-when">
              <div>{job.period}</div>
              <div className="dim">{job.location}</div>
            </div>
            <div className="xp-main">
              <h2>
                {job.title} <span className="dim">— {job.company}</span>
                {job.current && <span className="badge">Current</span>}
              </h2>
              <p className="dim">{job.description}</p>
              <ul className="mc-bullets">
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <Tags items={job.tags} />
            </div>
          </article>
        ))}
      </div>
    </Screen>
  )
}
