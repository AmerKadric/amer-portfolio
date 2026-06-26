import { useState } from 'react'
import { Mail, Linkedin, Github, MapPin, Send, CheckCircle } from 'lucide-react'

const BRONZE = '#c9985a'

const contactInfo = [
  { icon: <Mail size={18} />,    label: 'Email',    value: 'kadricameer@gmail.com',           href: 'mailto:kadricameer@gmail.com',            color: '#c9985a' },
  { icon: <Linkedin size={18} />, label: 'LinkedIn', value: 'linkedin.com/in/amer-kadric',      href: 'https://www.linkedin.com/in/amer-kadric', color: '#a07848' },
  { icon: <Github size={18} />,  label: 'GitHub',   value: 'github.com/AmerKadric',            href: 'https://github.com/AmerKadric',           color: '#8b6433' },
  { icon: <MapPin size={18} />,  label: 'Location', value: 'Detroit, Michigan',                href: null,                                       color: '#d4a85c' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle')

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      // FORMSPREE: uncomment and replace with your endpoint
      // const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //   method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      // })
      // if (res.ok) { setStatus('success'); setForm({ name:'', email:'', subject:'', message:'' }) }
      // else setStatus('error')
      await new Promise((r) => setTimeout(r, 1200))
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setStatus('idle'), 4000)
    } catch { setStatus('error') }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(201,152,90,0.12)',
    color: '#f0ebe2',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="orb orb-purple w-80 h-80 bottom-0 right-0 opacity-40" />
      <div className="orb orb-cyan w-64 h-64 top-0 left-1/4 opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="font-mono text-sm tracking-widest uppercase mb-3" style={{ color: BRONZE }}>// contact</p>
          <h2 className="section-heading">Get In Touch</h2>
          <p className="section-subheading mx-auto">
            Have a project, opportunity, or technical challenge? I'd be happy to connect and explore how I can help.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-4 reveal">
            {contactInfo.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <a href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="glass-card rounded-xl p-4 flex items-center gap-4 group transition-all duration-200 block"
                    style={{ borderColor: `${item.color}12` }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${item.color}35`; e.currentTarget.style.boxShadow = `0 0 25px ${item.color}0e` }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${item.color}12`; e.currentTarget.style.boxShadow = '' }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}12`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#6b5e52' }}>{item.label}</p>
                      <p className="text-sm font-medium transition-colors" style={{ color: '#c8bfb2' }}
                        onMouseEnter={(e) => (e.target.style.color = item.color)}
                        onMouseLeave={(e) => (e.target.style.color = '#c8bfb2')}>
                        {item.value}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="glass-card rounded-xl p-4 flex items-center gap-4" style={{ borderColor: `${item.color}12` }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}12`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#6b5e52' }}>{item.label}</p>
                      <p className="text-sm font-medium" style={{ color: '#c8bfb2' }}>{item.value}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3 reveal reveal-delay-2">
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                {['name', 'email'].map((field) => (
                  <div key={field}>
                    <label className="block text-xs mb-2 font-medium uppercase tracking-wider" style={{ color: '#9e8e7e' }}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      name={field} required value={form[field]} onChange={handleChange}
                      placeholder={field === 'name' ? 'Your name' : 'you@example.com'}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.40)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.12)')}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs mb-2 font-medium uppercase tracking-wider" style={{ color: '#9e8e7e' }}>Subject</label>
                <input
                  type="text" name="subject" required value={form.subject} onChange={handleChange}
                  placeholder="What's this about?"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.40)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.12)')}
                />
              </div>

              <div>
                <label className="block text-xs mb-2 font-medium uppercase tracking-wider" style={{ color: '#9e8e7e' }}>Message</label>
                <textarea
                  name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder="Tell me about your project, role, or question..."
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.40)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(201,152,90,0.12)')}
                />
              </div>

              <button type="submit" disabled={status === 'sending' || status === 'success'}
                className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
                {status === 'sending' ? (
                  <><span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0c0906' }} />Sending…</>
                ) : status === 'success' ? (
                  <><CheckCircle size={16} />Message Sent!</>
                ) : (
                  <><Send size={16} />Send Message</>
                )}
              </button>

              {status === 'error' && (
                <p className="text-sm text-center" style={{ color: '#c47040' }}>
                  Something went wrong. Please email me at{' '}
                  <a href="mailto:kadricameer@gmail.com" style={{ color: BRONZE }}>kadricameer@gmail.com</a>
                </p>
              )}

              <p className="text-xs text-center" style={{ color: '#6b5e52' }}>
                Prefer email?{' '}
                <a href="mailto:kadricameer@gmail.com" className="hover:underline" style={{ color: BRONZE }}>
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
