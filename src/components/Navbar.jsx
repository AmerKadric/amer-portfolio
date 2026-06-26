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
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(12, 9, 6, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,152,90,0.10)' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => handleNavClick('#home')} className="flex items-center gap-2 group">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #c9985a, #8b6433)',
              color: '#0c0906',
            }}
          >
            AK
          </span>
          <span
            className="font-semibold hidden sm:block transition-colors"
            style={{ color: '#f0ebe2' }}
            onMouseEnter={(e) => (e.target.style.color = '#c9985a')}
            onMouseLeave={(e) => (e.target.style.color = '#f0ebe2')}
          >
            Amer Kadric
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNavClick(link.href)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                style={
                  activeSection === link.href.slice(1)
                    ? { color: '#c9985a', background: 'rgba(201,152,90,0.10)' }
                    : { color: '#9e8e7e' }
                }
                onMouseEnter={(e) => {
                  if (activeSection !== link.href.slice(1)) e.currentTarget.style.color = '#f0ebe2'
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== link.href.slice(1)) e.currentTarget.style.color = '#9e8e7e'
                }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href="/resume.pdf" download className="hidden sm:inline-flex btn-primary text-xs px-4 py-2">
            Download CV
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-md transition-colors"
            style={{ color: '#9e8e7e' }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ background: 'rgba(12,9,6,0.97)', borderTop: '1px solid rgba(201,152,90,0.08)' }}
      >
        <ul className="px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNavClick(link.href)}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={
                  activeSection === link.href.slice(1)
                    ? { color: '#c9985a', background: 'rgba(201,152,90,0.10)' }
                    : { color: '#c8bfb2' }
                }
              >
                {link.label}
              </button>
            </li>
          ))}
          <li className="mt-2">
            <a href="/resume.pdf" download className="btn-primary w-full justify-center" onClick={() => setMenuOpen(false)}>
              Download Resume
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
