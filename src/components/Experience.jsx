import { MapPin, Calendar, ChevronRight } from 'lucide-react'

const experiences = [
  {
    title: 'Information Technology Manager',
    company: "Lady Jane's Haircuts for Men",
    location: 'Birmingham, MI',
    period: 'Jan 2026 – Present',
    current: true,
    color: '#00d4ff',
    description:
      'Leading IT operations and network infrastructure management across a 101-location national salon franchise, ensuring reliable technology for day-to-day business operations.',
    bullets: [
      'Monitor and maintain LTE-based network connectivity across 101 salon locations, ensuring consistent internet availability and minimizing operational downtime',
      'Administer NetCloud Manager to oversee Cradlepoint LTE routers — including real-time device status, alert management, and configuration updates',
      'Coordinate with ISPs and technology vendors to diagnose and resolve network performance issues, escalating complex cases when necessary',
      'Troubleshoot and support VoIP desk phones, routing equipment, and on-site network hardware across multiple locations',
      'Administer Google Workspace for the organization — managing user provisioning, access control, and authentication issues at scale',
      'Provide Tier 1–2 technical support, endpoint configuration, and issue resolution for end users across all business locations',
      'Maintain and update company websites, handling content changes, configuration updates, and code-level fixes on production systems',
    ],
    tags: ['NetCloud Manager', 'Cradlepoint', 'Google Workspace', 'VoIP', 'Network Mgmt', 'Web Maintenance'],
  },
  {
    title: 'Student Intern — Software Developer',
    company: 'National Security Innovation Network (NSIN)',
    location: 'Remote',
    period: 'Sep 2024 – Dec 2024',
    current: false,
    color: '#7c3aed',
    description:
      'Contributed to a cross-functional development team building an Android application that converts unstructured voice and text input into structured, actionable data.',
    bullets: [
      'Developed and integrated front-end features for voice input processing, message display, and navigation within the Android application',
      'Collaborated with team members to define system architecture, design data models, and clarify feature requirements',
      'Improved application usability through UI/UX refinements, making complex workflows accessible and intuitive',
      'Tested application functionality across multiple scenarios and resolved bugs to improve reliability and performance',
      'Documented system design decisions, use cases, and implementation details to support future development cycles',
    ],
    tags: ['Android Studio', 'Kotlin', 'Java', 'System Architecture', 'Agile', 'Documentation'],
  },
  {
    title: 'Administrative Assistant',
    company: 'My Virtual Academy',
    location: 'Remote',
    period: 'Nov 2021 – Jan 2026',
    current: false,
    color: '#10b981',
    description:
      'Provided professional administrative and communication support in a fast-paced virtual environment, maintaining organized workflows and responsive service.',
    bullets: [
      'Managed inbound and outbound communications including phone calls, emails, and visitor coordination with professionalism and timeliness',
      'Supported daily business operations by maintaining organized records, scheduling, and correspondence workflows',
    ],
    tags: ['Communication', 'Organization', 'Remote Work', 'Customer Service'],
  },
]

export default function Experience() {
  return (
    <section id="experience" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,20,40,0.6)' }}
      />
      <div className="orb orb-purple w-80 h-80 top-1/2 right-0 opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // work experience
          </p>
          <h2 className="section-heading">Professional Experience</h2>
          <p className="section-subheading mx-auto">
            Real-world roles where I've applied software development and IT expertise to keep
            technology reliable and business operations running.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px hidden md:block"
            style={{ background: 'linear-gradient(to bottom, #00d4ff44, #7c3aed44, transparent)' }}
          />

          <div className="space-y-12">
            {experiences.map((exp, i) => (
              <div
                key={exp.company}
                className={`reveal reveal-delay-${i + 1} relative grid md:grid-cols-2 gap-6 md:gap-12 ${
                  i % 2 === 0 ? '' : 'md:direction-rtl'
                }`}
              >
                {/* Timeline dot (desktop) */}
                <div
                  className="absolute left-0 md:left-1/2 top-6 w-4 h-4 rounded-full border-2 -translate-x-1/2 hidden md:block z-10"
                  style={{
                    borderColor: exp.color,
                    background: '#0a0f1e',
                    boxShadow: `0 0 12px ${exp.color}88`,
                  }}
                />

                {/* Card — alternates left/right on desktop */}
                <div className={`${i % 2 === 0 ? 'md:col-start-1' : 'md:col-start-2'} col-span-1`}>
                  <div
                    className="glass-card rounded-2xl p-6 group hover:border-opacity-40 transition-all duration-300"
                    style={{
                      borderColor: `${exp.color}22`,
                      boxShadow: '0 0 30px rgba(0,0,0,0.25)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow = `0 0 40px ${exp.color}22`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = '0 0 30px rgba(0,0,0,0.25)')
                    }
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-lg">{exp.title}</h3>
                          {exp.current && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium text-navy-900"
                              style={{ background: exp.color }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <p className="font-semibold" style={{ color: exp.color }}>
                          {exp.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {exp.period}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {exp.location}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{exp.description}</p>

                    <ul className="space-y-2 mb-5">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-slate-300 text-sm">
                          <ChevronRight
                            size={14}
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: exp.color }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md text-xs font-medium"
                          style={{
                            background: `${exp.color}12`,
                            border: `1px solid ${exp.color}25`,
                            color: exp.color,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
