import { Download, Eye, FileText } from 'lucide-react'

export default function ResumeSection() {
  return (
    <section id="resume" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'rgba(18,12,6,0.50)' }} />
      <div className="orb orb-cyan w-96 h-96 top-0 left-0 opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="font-mono text-sm tracking-widest uppercase mb-3" style={{ color: '#c9985a' }}>
            // resume
          </p>
          <h2 className="section-heading">Full Resume</h2>
          <p className="section-subheading mx-auto">
            Want a complete overview of my experience, education, and technical skills? Download or view my resume below.
          </p>
        </div>

        <div className="reveal">
          <div className="glass-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(201,152,90,0.06)' }}>
            {/* Preview area */}
            <div
              className="h-72 flex flex-col items-center justify-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(201,152,90,0.05), rgba(139,100,51,0.05))',
                borderBottom: '1px solid rgba(201,152,90,0.10)',
              }}
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(201,152,90,0.10)', border: '1px solid rgba(201,152,90,0.22)' }}>
                <FileText size={36} style={{ color: '#c9985a' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" style={{ color: '#f0ebe2' }}>Amer Kadric — Resume</p>
                <p className="text-sm mt-1" style={{ color: '#9e8e7e' }}>
                  IT Manager & Software Developer · Wayne State University CS Graduate
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/resume.pdf" download="Amer_Kadric_Resume.pdf" className="btn-primary w-full sm:w-auto justify-center">
                <Download size={18} />
                Download Resume
              </a>
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-outline w-full sm:w-auto justify-center">
                <Eye size={18} />
                View in Browser
              </a>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: '1px solid rgba(201,152,90,0.08)' }}>
              {[
                { label: 'Current Role', value: 'IT Manager' },
                { label: 'Degree', value: 'B.S. Computer Science' },
                { label: 'GPA', value: '3.72 / 4.0' },
                { label: 'Location', value: 'Detroit, MI' },
              ].map((fact) => (
                <div key={fact.label} className="p-5 text-center" style={{ borderRight: '1px solid rgba(201,152,90,0.06)' }}>
                  <p className="font-semibold text-sm" style={{ color: '#f0ebe2' }}>{fact.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b5e52' }}>{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
