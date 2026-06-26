import { useState } from 'react'

const skillCategories = [
  {
    id: 'languages',
    label: 'Languages',
    color: '#00d4ff',
    skills: [
      { name: 'Java', level: 85 },
      { name: 'Python', level: 82 },
      { name: 'JavaScript', level: 80 },
      { name: 'Kotlin', level: 75 },
      { name: 'C++', level: 70 },
      { name: 'C', level: 68 },
      { name: 'HTML/CSS', level: 88 },
    ],
  },
  {
    id: 'web',
    label: 'Web & Mobile',
    color: '#7c3aed',
    skills: [
      { name: 'React', level: 72 },
      { name: 'Node.js', level: 65 },
      { name: 'Android Dev', level: 78 },
      { name: 'REST APIs', level: 75 },
      { name: 'Responsive Design', level: 82 },
      { name: 'Bootstrap', level: 76 },
    ],
  },
  {
    id: 'it',
    label: 'IT & Networking',
    color: '#10b981',
    skills: [
      { name: 'Network Mgmt', level: 88 },
      { name: 'LTE / Cradlepoint', level: 85 },
      { name: 'Google Workspace', level: 90 },
      { name: 'VoIP Support', level: 82 },
      { name: 'Hardware Troubleshoot', level: 85 },
      { name: 'Endpoint Setup', level: 80 },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Platforms',
    color: '#f59e0b',
    skills: [
      { name: 'GitHub', level: 85 },
      { name: 'VS Code', level: 90 },
      { name: 'Android Studio', level: 80 },
      { name: 'NetCloud Manager', level: 88 },
      { name: 'IntelliJ IDEA', level: 78 },
      { name: 'Linux', level: 72 },
      { name: 'Microsoft Suite', level: 85 },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    color: '#ef4444',
    skills: [
      { name: 'MySQL', level: 74 },
      { name: 'SQL', level: 76 },
      { name: 'Database Design', level: 70 },
    ],
  },
  {
    id: 'soft',
    label: 'Professional',
    color: '#06b6d4',
    skills: [
      { name: 'Problem Solving', level: 95 },
      { name: 'Technical Support', level: 92 },
      { name: 'Documentation', level: 83 },
      { name: 'Collaboration', level: 88 },
      { name: 'Adaptability', level: 90 },
      { name: 'Critical Thinking', level: 90 },
    ],
  },
]

function SkillBar({ name, level, color, delay }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-slate-300 text-sm font-medium">{name}</span>
        <span className="text-xs font-mono" style={{ color }}>{level}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${level}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}

export default function Skills() {
  const [active, setActive] = useState('languages')
  const current = skillCategories.find((c) => c.id === active)

  return (
    <section id="skills" className="py-24 relative overflow-hidden">
      <div className="orb orb-cyan w-72 h-72 bottom-0 left-0 opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // technical skills
          </p>
          <h2 className="section-heading">What I Work With</h2>
          <p className="section-subheading mx-auto">
            A versatile toolkit spanning software development, IT operations, and business
            technology management.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 reveal">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active === cat.id
                  ? 'text-navy-900 font-semibold'
                  : 'text-slate-400 hover:text-white glass-card'
              }`}
              style={
                active === cat.id
                  ? { background: cat.color, boxShadow: `0 0 20px ${cat.color}55` }
                  : {}
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skill bars panel */}
        <div className="max-w-3xl mx-auto reveal">
          <div
            className="glass-card rounded-2xl p-8"
            style={{ boxShadow: `0 0 40px ${current.color}11` }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-1 h-8 rounded-full"
                style={{ background: current.color }}
              />
              <h3 className="text-white font-bold text-xl">{current.label}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-10">
              {current.skills.map((skill, i) => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  level={skill.level}
                  color={current.color}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>
        </div>

        {/* All skill tags grid */}
        <div className="mt-16 reveal">
          <p className="text-center text-slate-500 text-sm mb-6 font-mono">// all technologies</p>
          <div className="flex flex-wrap justify-center gap-2">
            {skillCategories.flatMap((c) => c.skills.map((s) => s.name)).map((name) => (
              <span key={name} className="tag">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
