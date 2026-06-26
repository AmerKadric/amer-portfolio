import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react'

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer
      className="relative py-12 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#020817' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-navy-900"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
              >
                AK
              </span>
              <span className="text-white font-bold">Amer Kadric</span>
            </div>
            <p className="text-slate-500 text-sm">
              Information Technology Manager &amp; Software Developer · Birmingham, Michigan
            </p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/amer-kadric"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="mailto:kadricameer@gmail.com"
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="Email"
            >
              <Mail size={16} />
            </a>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-sm group"
            aria-label="Back to top"
          >
            Back to top
            <span className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-cyan-400/40 transition-colors">
              <ArrowUp size={13} />
            </span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Amer Kadric. Built with React &amp; Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  )
}

