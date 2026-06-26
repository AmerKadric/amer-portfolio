import { ArrowDown, Github, Linkedin, Mail, Download, ExternalLink } from 'lucide-react'

export default function Hero() {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid-pattern"
    >
      {/* Background orbs */}
      <div className="orb orb-cyan w-96 h-96 top-10 -left-20" />
      <div className="orb orb-purple w-80 h-80 bottom-10 -right-10" />
      <div className="orb orb-cyan w-64 h-64 top-1/2 right-1/4 opacity-50" />

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-left">

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight opacity-0 animate-fade-up"
              style={{ animationFillMode: 'forwards' }}>
              Amer{' '}
              <span className="accent-gradient">Kadric</span>
            </h1>

            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
              <span className="h-px w-8 bg-cyan-400/60" />
              <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">
                Information Technology Manager &amp; Software Developer
              </p>
              <span className="h-px w-8 bg-cyan-400/60" />
            </div>

            <h2 className="text-xl sm:text-2xl text-slate-300 font-light mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-0 animate-fade-up"
              style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
              Turning real-world technology challenges into{' '}
              <span className="text-white font-medium">
                reliable, scalable solutions
              </span>{' '}
              — through code, systems thinking, and hands-on IT leadership.
            </h2>

            <p className="text-slate-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed opacity-0 animate-fade-up"
              style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
              Computer Science graduate with professional experience managing IT
              infrastructure across 100+ locations, developing software, and
              building systems that businesses actually depend on.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
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
            <div className="flex items-center justify-center lg:justify-start gap-4 opacity-0 animate-fade-up"
              style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
              <a
                href="https://www.linkedin.com/in/amer-kadric"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200 hover:bg-cyan-400/5"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200 hover:bg-cyan-400/5"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="mailto:kadricameer@gmail.com"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200 hover:bg-cyan-400/5"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Right: Profile image */}
          <div className="flex-shrink-0 flex items-center justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="relative">
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full animate-glow"
                style={{
                  background: 'conic-gradient(from 0deg, #00d4ff, #7c3aed, #00d4ff)',
                  padding: '2px',
                  borderRadius: '50%',
                }}
              />
              {/* Spinning border */}
              <div
                className="absolute -inset-1 rounded-full opacity-40"
                style={{
                  background: 'conic-gradient(from 180deg, #00d4ff, transparent, #7c3aed, transparent, #00d4ff)',
                  animation: 'spin 8s linear infinite',
                }}
              />

              {/* Glassmorphism card wrapping image */}
              <div
                className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden"
                style={{
                  border: '3px solid rgba(0, 212, 255, 0.35)',
                  boxShadow: '0 0 50px rgba(0,212,255,0.2), 0 0 100px rgba(124,58,237,0.1)',
                }}
              >
                {/*
                  PROFILE IMAGE
                  Replace /profile.jpg with your actual photo.
                  Place your photo at: public/profile.jpg
                */}
                <img
                  src="/profile.jpg"
                  alt="Amer Kadric — Information Technology Manager and Software Developer"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    // Fallback if image not found
                    e.target.style.display = 'none'
                    e.target.parentElement.style.background =
                      'linear-gradient(135deg, #0d1428 0%, #1e2d4a 100%)'
                    e.target.parentElement.innerHTML += `
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;">
                        <span style="font-size:64px;font-weight:800;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">AK</span>
                        <span style="color:#64748b;font-size:11px;text-align:center;padding:0 12px">Add profile.jpg to /public folder</span>
                      </div>`
                  }}
                />
              </div>

              {/* Floating tech badges */}
              <div
                className="absolute -top-3 -right-4 px-3 py-1.5 rounded-full text-xs font-semibold text-navy-900 animate-float"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0891b2)', animationDelay: '0s' }}
              >
                Python
              </div>
              <div
                className="absolute -bottom-2 -left-6 px-3 py-1.5 rounded-full text-xs font-semibold text-navy-900 animate-float"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', animationDelay: '2s' }}
              >
                IT Manager
              </div>

              <div
                className="absolute top-1/2 -right-10 px-3 py-1.5 rounded-full text-xs font-semibold text-navy-900 animate-float"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', animationDelay: '4s' }}
              >
                Java
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <button
            onClick={scrollToAbout}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors animate-float"
            aria-label="Scroll to About section"
          >
            <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
            <ArrowDown size={16} />
          </button>
        </div>
      </div>

      {/* Spinning keyframe (inline since Tailwind doesn't have it by default) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}

