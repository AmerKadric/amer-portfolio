import { ArrowDown, Github, Linkedin, Mail, Download, ExternalLink } from 'lucide-react'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="orb orb-cyan w-96 h-96 top-10 -left-20" />
      <div className="orb orb-purple w-80 h-80 bottom-10 -right-10" />

      <div className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight">
              Amer{' '}
              <span className="accent-gradient">Kadric</span>
            </h1>

            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <span className="h-px w-8 bg-cyan-400/60" />
              <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">
                Information Technology Manager
              </p>
              <span className="h-px w-8 bg-cyan-400/60" />
            </div>

            <h2 className="text-xl sm:text-2xl text-slate-300 font-light mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Keeping technology reliable across{' '}
              <span className="text-white font-medium">100+ business locations</span>{' '}
              — through hands-on IT leadership and real-world problem solving.
            </h2>

            <p className="text-slate-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Computer Science graduate with professional experience managing IT infrastructure,
              networks, and systems that businesses depend on every day.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10">
              <button
                onClick={() => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary"
              >
                <ExternalLink size={16} />
                View Experience
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
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <a href="https://www.linkedin.com/in/amer-kadric" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200"
                aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://github.com/AmerKadric" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200"
                aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="mailto:kadricameer@gmail.com"
                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-200"
                aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Right: Profile image */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full opacity-40"
                style={{
                  background: 'conic-gradient(from 180deg, #00d4ff, transparent, #7c3aed, transparent, #00d4ff)',
                  animation: 'spin 8s linear infinite',
                }}
              />
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden"
                style={{
                  border: '3px solid rgba(0, 212, 255, 0.35)',
                  boxShadow: '0 0 50px rgba(0,212,255,0.2), 0 0 100px rgba(124,58,237,0.1)',
                }}>
                <img
                  src="/profile.png"
                  alt="Amer Kadric — Information Technology Manager"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 35%' }}
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Floating badges — IT focused */}
              <div className="absolute -top-3 -right-4 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0891b2)', color: '#020810', animationDelay: '0s' }}>
                IT Manager
              </div>
              <div className="absolute -bottom-2 -left-6 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', animationDelay: '2s' }}>
                Networking
              </div>
              <div className="absolute top-1/2 -right-10 px-3 py-1.5 rounded-full text-xs font-semibold animate-float"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#020810', animationDelay: '4s' }}>
                100+ Sites
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors"
            aria-label="Scroll down"
          >
            <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
            <ArrowDown size={16} className="animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  )
}
