import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative py-12" style={{ borderTop: '1px solid rgba(201,152,90,0.08)', background: '#080603' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #c9985a, #8b6433)', color: '#0c0906' }}>
                AK
              </span>
              <span className="font-bold" style={{ color: '#f0ebe2' }}>Amer Kadric</span>
            </div>
            <p className="text-sm" style={{ color: '#6b5e52' }}>IT Manager &amp; Software Developer · Detroit, Michigan</p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {[
              { href: 'https://www.linkedin.com/in/amer-kadric', icon: <Linkedin size={16} />, label: 'LinkedIn' },
              { href: 'https://github.com/AmerKadric', icon: <Github size={16} />, label: 'GitHub' },
              { href: 'mailto:kadricameer@gmail.com', icon: <Mail size={16} />, label: 'Email' },
            ].map((s) => (
              <a key={s.label} href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ border: '1px solid rgba(201,152,90,0.14)', color: '#6b5e52' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#c9985a'; e.currentTarget.style.borderColor = 'rgba(201,152,90,0.38)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b5e52'; e.currentTarget.style.borderColor = 'rgba(201,152,90,0.14)' }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Back to top */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-sm group transition-colors"
            style={{ color: '#6b5e52' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c9985a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e52')}
            aria-label="Back to top">
            Back to top
            <span className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors"
              style={{ borderColor: 'rgba(201,152,90,0.14)' }}>
              <ArrowUp size={13} />
            </span>
          </button>
        </div>

        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(201,152,90,0.06)' }}>
          <p className="text-xs" style={{ color: '#3d3028' }}>
            © {new Date().getFullYear()} Amer Kadric. Built with React &amp; Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  )
}
