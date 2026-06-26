import { GraduationCap, Award, BookOpen, Calendar } from 'lucide-react'

const coursework = [
  'Data Structures & Algorithms',
  'Object-Oriented Programming',
  'Computer Architecture',
  'Operating Systems',
  'Databases',
  'Discrete Mathematics',
  'Arduino Programming',
  'Java',
]

export default function Education() {
  return (
    <section id="education" className="py-24 relative overflow-hidden">
      <div className="orb orb-purple w-80 h-80 bottom-0 left-1/4 opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // education
          </p>
          <h2 className="section-heading">Academic Background</h2>
          <p className="section-subheading mx-auto">
            A strong Computer Science foundation built at Wayne State University's College of
            Engineering.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div
            className="glass-card rounded-2xl p-8 md:p-10 reveal"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <GraduationCap size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">
                    Wayne State University
                  </h3>
                  <p className="text-cyan-400 font-semibold">College of Engineering</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Bachelor of Science — Computer Science
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <MapPin size={13} />
                  Detroit, Michigan
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={13} />
                  Sep 2020 – Dec 2024
                </span>
              </div>
            </div>

            {/* GPA Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Cumulative GPA', value: '3.72', icon: <Award size={16} />, color: '#00d4ff' },
                { label: 'Major GPA', value: '3.85', icon: <BookOpen size={16} />, color: '#7c3aed' },
                { label: 'Graduation', value: 'Dec 2024', icon: <GraduationCap size={16} />, color: '#10b981' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: `${item.color}10`, border: `1px solid ${item.color}20` }}
                >
                  <div className="flex justify-center mb-2" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <p className="text-xl font-bold text-white">{item.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Relevant Coursework */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                Relevant Coursework
              </h4>
              <div className="flex flex-wrap gap-2">
                {coursework.map((course) => (
                  <span key={course} className="tag">{course}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Inline since lucide MapPin isn't imported above
function MapPin({ size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
