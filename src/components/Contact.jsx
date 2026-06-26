import { useState } from 'react'
import { Mail, Linkedin, Github, MapPin, Phone, Send, CheckCircle } from 'lucide-react'

/*
  HOW TO MAKE THE CONTACT FORM SEND EMAILS:
  Option 1 — Formspree (easiest, free):
    1. Go to https://formspree.io and create a free account
    2. Create a new form and get your form endpoint, e.g. https://formspree.io/f/xyzabc
    3. Replace the action URL below with your Formspree endpoint
    4. The form will start sending emails to your address immediately

  Option 2 — EmailJS:
    1. Go to https://emailjs.com and create a free account
    2. Follow their React SDK setup guide
    3. Replace handleSubmit with their emailjs.send() call
*/

const contactInfo = [
  {
    icon: <Mail size={18} />,
    label: 'Email',
    value: 'kadricameer@gmail.com',
    href: 'mailto:kadricameer@gmail.com',
    color: '#00d4ff',
  },
  {
    icon: <Phone size={18} />,
    label: 'Phone',
    value: '(586) 265-1843',
    href: 'tel:+15862651843',
    color: '#7c3aed',
  },
  {
    icon: <Linkedin size={18} />,
    label: 'LinkedIn',
    value: 'linkedin.com/in/amer-kadric',
    href: 'https://www.linkedin.com/in/amer-kadric',
    color: '#10b981',
  },
  {
    icon: <Github size={18} />,
    label: 'GitHub',
    value: 'github.com/amerkadric', // Update with your actual GitHub username
    href: 'https://github.com', // Update with your actual GitHub URL
    color: '#f59e0b',
  },
  {
    icon: <MapPin size={18} />,
    label: 'Location',
    value: 'Detroit, Michigan',
    href: null,
    color: '#ef4444',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  /*
    Replace this with actual Formspree/EmailJS logic.
    For Formspree, change the fetch URL to your endpoint.
  */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    try {
      // FORMSPREE: Replace with your endpoint
      // const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(form),
      // })
      // if (res.ok) { setStatus('success'); setForm({ name:'', email:'', subject:'', message:'' }) }
      // else setStatus('error')

      // Simulated success for now (remove when wiring up real service)
        const res = await fetch('https://formspree.io/f/xbdvoaly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            setStatus('success')
            setForm({ name: '', email: '', subject: '', message: '' })
            setTimeout(() => setStatus('idle'), 4000)
        } else {
            setStatus('error')
        }
      setForm({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="orb orb-purple w-80 h-80 bottom-0 right-0 opacity-40" />
      <div className="orb orb-cyan w-64 h-64 top-0 left-1/4 opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // contact
          </p>
          <h2 className="section-heading">Get In Touch</h2>
          <p className="section-subheading mx-auto">
            Have a project, opportunity, or technical challenge? I'd be happy to connect and
            explore how I can help.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-4 reveal">
            {contactInfo.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-opacity-40 transition-all duration-200 block"
                    style={{ borderColor: `${item.color}15` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${item.color}40`
                      e.currentTarget.style.boxShadow = `0 0 25px ${item.color}12`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${item.color}15`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">{item.label}</p>
                      <p className="text-white text-sm font-medium group-hover:text-cyan-400 transition-colors">
                        {item.value}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div
                    className="glass-card rounded-xl p-4 flex items-center gap-4"
                    style={{ borderColor: `${item.color}15` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">{item.label}</p>
                      <p className="text-white text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3 reveal reveal-delay-2">
            <form
              onSubmit={handleSubmit}
              className="glass-card rounded-2xl p-8 space-y-5"
              style={{ boxShadow: '0 0 40px rgba(0,0,0,0.25)' }}
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400/60 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project, role, or question..."
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={16} />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>

              {status === 'error' && (
                <p className="text-red-400 text-sm text-center">
                  Something went wrong. Please email me directly at kadricameer@gmail.com
                </p>
              )}

              <p className="text-slate-600 text-xs text-center">
                Prefer email?{' '}
                <a href="mailto:kadricameer@gmail.com" className="text-cyan-400 hover:underline">
                  kadricameer@gmail.com
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
