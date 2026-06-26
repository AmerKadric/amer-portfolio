import { Download, Eye, FileText } from 'lucide-react'

export default function ResumeSection() {
  return (
    <section id="resume" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,20,40,0.6)' }}
      />
      <div className="orb orb-cyan w-96 h-96 top-0 left-0 opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // resume
          </p>
          <h2 className="section-heading">Full Resume</h2>
          <p className="section-subheading mx-auto">
            Want a complete overview of my experience, education, and technical skills? Download or
            view my resume below.
          </p>
        </div>

        <div className="reveal">
          <div
            className="glass-card rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.08)' }}
          >
            {/* Preview area */}
            <div
              className="h-72 flex flex-col items-center justify-center gap-4 border-b"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                <FileText size={36} className="text-cyan-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Amer Kadric — Resume</p>
                <p className="text-slate-500 text-sm mt-1">
                  {/*
                    RESUME FILE LOCATION:
                    Place your resume PDF at: public/resume.pdf
                    The download and view buttons will automatically link to it.
                  */}
                  Information Technology Manager & Software Developer · Wayne State University CS Graduate
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/resume.pdf"
                download="Amer_Kadric_Resume.pdf"
                className="btn-primary w-full sm:w-auto justify-center"
              >
                <Download size={18} />
                Download Resume
              </a>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline w-full sm:w-auto justify-center"
              >
                <Eye size={18} />
                View in Browser
              </a>
            </div>

            {/* Quick facts strip */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)', divide: 'rgba(255,255,255,0.05)' }}
            >
              {[
                { label: 'Current Role', value: 'Information Technology Manager' },
                { label: 'Degree', value: 'B.S. Computer Science' },
                { label: 'GPA', value: '3.72 / 4.0' },
                { label: 'Location', value: 'Detroit, MI' },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="p-5 text-center"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <p className="text-white font-semibold text-sm">{fact.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

