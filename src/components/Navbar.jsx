import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Resume', href: '#resume' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Highlight active nav link based on scroll position
      const sections = navLinks.map((l) => l.href.slice(1))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href) => {
    setMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(10, 15, 30, 0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,212,255,0.08)' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => handleNavClick('#home')}
          className="flex items-center gap-2 group"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-navy-900"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
          >
            AK
          </span>
          <span className="font-semibold text-white hidden sm:block group-hover:text-cyan-400 transition-colors">
            Amer Kadric
          </span>
        </button>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNavClick(link.href)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSection === link.href.slice(1)
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <a
            href="/resume.pdf"
            download
            className="hidden sm:inline-flex btn-primary text-xs px-4 py-2"
          >
            Download CV
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ background: 'rgba(10, 15, 30, 0.97)' }}
      >
        <ul className="px-4 py-4 flex flex-col gap-1 border-t border-white/5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNavClick(link.href)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeSection === link.href.slice(1)
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
          <li className="mt-2">
            <a
              href="/resume.pdf"
              download
              className="btn-primary w-full justify-center"
              onClick={() => setMenuOpen(false)}
            >
              Download Resume
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
