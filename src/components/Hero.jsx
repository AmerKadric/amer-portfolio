import { ArrowDown, Github, Linkedin, Mail, Download, ExternalLink } from 'lucide-react'

const BRONZE = '#c9985a'
const BRONZE_DARK = '#8b6433'

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Per-section orbs */}
      <div className="orb orb-cyan w-96 h-96 top-10 -left-20" />
      <div className="orb orb-purple w-80 h-80 bottom-10 -right-10" />

      <div
        className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,152,90,0.06) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight opacity-0 animate-fade-up"
              style={{ color: '#f0ebe2', animationFillMode: 'forwards' }}
            >
              Amer{' '}
              <span className="accent-gradient">Kadric</span>
            </h1>

            <div
              className="flex items-center justify-center lg:justify-start gap-2 mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
            >
              <span className="h-px w-8" style={{ background: `${BRONZE}99` }} />
              <p className="font-mono text-sm tracking-widest uppercase" style={{ color: BRONZE }}>
                IT Manager &amp; Software Developer
              </p>
              <span className="h-px w-8" style={{ background: `${BRONZE}99` }} />
            </div>

            <h2
              className="text-xl sm:text-2xl font-light mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-0 animate-fade-up"
              style={{ color: '#c8bfb2', animationDelay: '0.25s', animationFillMode: 'forwards' }}
            >
              Turning real-world technology challenges into{' '}
              <span style={{ color: '#f0ebe2', fontWeight: 500 }}>reliable, scalable solutions</span>{' '}
              — through code, systems thinking, and hands-on IT leadership.
            </h2>

            <p
              className="max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed opacity-0 animate-fade-up"
              style={{ color: '#9e8e7e', animationDelay: '0.35s', animationFillMode: 'forwards' }}
            >
              Computer Science graduate with professional experience managing IT infrastructure
              across 100+ locations, developing software, and building systems that businesses
              actually depend on.
            </p>

            {/* CTA buttons */}
            <div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}
            >
              <button
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary"
              >
                <ExternalLink size={16} />
                View My Work
              </button>
              <a href="/resume.pdf" download className="btn-outline">
                <Download size={16} />
                Download Resume
              </a>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline"
              >
                <Mail size={16} />
                Contact Me
              </button>
            </div>

            {/* Social links */}
            <div
              className="flex items-center justify-center lg:justify-start gap-4 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}
            >
              {[
                { href: 'https://www.linkedin.com/in/amer-kadric', icon: <Linkedin size={18} />, label: 'LinkedIn' },
                { href: 'https://github.com/AmerKadric', icon: <Github size={18} />, label: 'GitHub' },
                { href: 'mailto:kadricameer@gmail.com', icon: <Mail size={18} />, label: 'Email' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ border: '1px solid rgba(201,152,90,0.18)', color: '#9e8e7e' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = BRONZE
                    e.currentTarget.style.borderColor = 'rgba(201,152,90,0.45)'
                    e.currentTarget.style.background = 'rgba(201,152,90,0.07)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9e8e7e'
                    e.currentTarget.style.borderColor = 'rgba(201,152,90,0.18)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right: profile image */}
          <div
            className="flex-shrink-0 flex items-center justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <div className="relative">
              {/* Spinning conic border */}
              <div
                className="absolute -inset-1 rounded-full opacity-40"
                style={{
                  background: `conic-gradient(from 180deg, ${BRONZE}, transparent, ${BRONZE_DARK}, transparent, ${BRONZE})`,
                  animation: 'spin 10s linear infinite',
                }}
              />

              {/* Image frame */}
              <div
                className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden"
                style={{
                  border: `3px solid rgba(201,152,90,0.40)`,
                  boxShadow: `0 0 50px rgba(201,152,90,0.18), 0 0 100px rgba(139,100,51,0.10)`,
                }}
              >
                <img
                  src="/profile.jpg"
                  alt="Amer Kadric — IT Manager and Software Developer"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #1a120a 0%, #2a1e10 100%)'
                    e.target.parentElement.innerHTML += `
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:64px;font-weight:800;background:linear-gradient(135deg,#c9985a,#8b6433);-webkit-background-clip:text;-webkit-text-fill-color:transparent">AK</span>
                      </div>`
                  }}
                />
              </div>

              {/* Floating badges */}
              <div
                className="absolute -top-3 -right-4 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: `linear-gradient(135deg, ${BRONZE}, #a07040)`, color: '#0c0906', animationDelay: '0s' }}
              >
                Python
              </div>
              <div
                className="absolute -bottom-2 -left-6 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: `linear-gradient(135deg, ${BRONZE_DARK}, #5c4020)`, color: '#f0ebe2', animationDelay: '2s' }}
              >
                IT Manager
              </div>
              <div
                className="absolute top-1/2 -right-10 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: `linear-gradient(135deg, #a07848, #6b5030)`, color: '#f0ebe2', animationDelay: '4s' }}
              >
                Java
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="flex justify-center mt-16">
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 transition-colors animate-float"
            style={{ color: '#6b5e52' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BRONZE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e52')}
            aria-label="Scroll to About"
          >
            <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
            <ArrowDown size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}
