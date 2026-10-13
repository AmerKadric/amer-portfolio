// Builds /quick-view/ — a plain, crawlable one-page summary generated from
// src/data.js, so search engines and busy recruiters can read everything
// without the game UI (the main site's #/ routes are invisible to Google).
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const SITE = 'https://www.amerkadric.com'

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const link = (href, text) => `<a href="${esc(href)}"${href.startsWith('http') ? ' rel="noopener"' : ''}>${esc(text)}</a>`

async function loadData() {
  const url = pathToFileURL(resolve('src/data.js')).href
  return import(`${url}?t=${Date.now()}`)
}

function render({ profile, experience, projects, about, skills }) {
  const edu = about.education
  const description = `${profile.name} — ${profile.role} in ${profile.location}. Experience, projects, skills, and education at a glance.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(profile.name)} | Quick View</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${SITE}/quick-view/" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:title" content="${esc(profile.name)} | ${esc(profile.role)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${SITE}/quick-view/" />
<meta property="og:image" content="${SITE}/og-image.png" />
<style>
  :root {
    --bg: #f6f6f4; --card: #fff; --text: #1d1d1b; --muted: #5d5d58; --line: #e2e2dc;
    --accent: #3c7a24; --tag: #edf3e8;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #161615; --card: #1f1f1d; --text: #ececea; --muted: #a3a39d; --line: #33332f; --accent: #8fd45f; --tag: #26301f; }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 56px; }
  a { color: var(--accent); }
  h1 { margin: 0; font-size: 2rem; line-height: 1.2; }
  h2 { margin: 40px 0 12px; font-size: 1.1rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  h3 { margin: 0; font-size: 1.05rem; }
  p { margin: 0 0 10px; }
  ul { margin: 8px 0 0; padding-left: 20px; }
  .role { margin: 4px 0 12px; font-size: 1.15rem; color: var(--muted); }
  .links { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 8px; }
  .back { display: inline-block; margin-bottom: 24px; font-size: .9rem; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 18px 20px; margin-bottom: 12px; }
  .meta { color: var(--muted); font-size: .92rem; margin: 2px 0 8px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 12px 0 0; }
  .tags li { background: var(--tag); border-radius: 4px; padding: 2px 8px; font-size: .82rem; }
  .skills { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  footer { margin-top: 40px; color: var(--muted); font-size: .85rem; }
</style>
</head>
<body>
<main>
  <a class="back" href="/">← Interactive version</a>
  <header>
    <h1>${esc(profile.name)}</h1>
    <p class="role">${esc(profile.role)} · ${esc(profile.location)}</p>
    <div class="links">
      ${link(`mailto:${profile.email}`, profile.email)}
      ${link(profile.linkedin, 'LinkedIn')}
      ${link(profile.github, 'GitHub')}
      ${link(profile.resume, 'Resume (PDF)')}
    </div>
  </header>

  <section>
    <h2>About</h2>
    ${about.bio.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
  </section>

  <section>
    <h2>Experience</h2>
    ${experience
      .map(
        (job) => `<article class="card">
      <h3>${esc(job.title)} — ${esc(job.company)}</h3>
      <p class="meta">${esc(job.period)} · ${esc(job.location)}</p>
      <ul>${job.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </article>`,
      )
      .join('\n    ')}
  </section>

  <section>
    <h2>Projects</h2>
    ${projects
      .map((p) => {
        const links = [p.demo && link(p.demo, 'Live site'), p.github && link(p.github, 'GitHub')].filter(Boolean)
        return `<article class="card">
      <h3>${esc(p.title)}</h3>
      <p class="meta">${esc(p.year)} · ${esc(p.status)}${links.length ? ` · ${links.join(' · ')}` : ''}</p>
      <p>${esc(p.description)}</p>
      <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </article>`
      })
      .join('\n    ')}
  </section>

  <section>
    <h2>Skills</h2>
    <div class="skills">
      ${skills
        .map(
          (group) => `<div class="card">
        <h3>${esc(group.label)}</h3>
        <ul>${group.items.map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul>
      </div>`,
        )
        .join('\n      ')}
    </div>
  </section>

  <section>
    <h2>Education</h2>
    <article class="card">
      <h3>${esc(edu.degree)} — ${esc(edu.school)}</h3>
      <p class="meta">${esc(edu.college)} · ${esc(edu.period)}</p>
      <p>${edu.stats.map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')}</p>
      <p class="meta">Coursework: ${edu.coursework.map(esc).join(', ')}</p>
    </article>
  </section>

  <footer>© ${new Date().getFullYear()} ${esc(profile.name)} · ${link('/', 'amerkadric.com')}</footer>
</main>
</body>
</html>
`
}

export default function quickView() {
  return {
    name: 'quick-view',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/quick-view\/?$/.test(req.url.split('?')[0])) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(render(await loadData()))
      })
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'quick-view/index.html', source: render(await loadData()) })
    },
  }
}
