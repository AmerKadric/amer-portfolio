import { useState } from 'react'

const skillCategories = [
  {
    id: 'languages', label: 'Languages', color: '#c9985a',
    skills: [
      { name: 'Java', level: 85 }, { name: 'Python', level: 82 },
      { name: 'JavaScript', level: 80 }, { name: 'Kotlin', level: 75 },
      { name: 'C++', level: 70 }, { name: 'C', level: 68 }, { name: 'HTML/CSS', level: 88 },
    ],
  },
  {
    id: 'web', label: 'Web & Mobile', color: '#a07848',
    skills: [
      { name: 'React', level: 72 }, { name: 'Node.js', level: 65 },
      { name: 'Android Dev', level: 78 }, { name: 'REST APIs', level: 75 },
      { name: 'Responsive Design', level: 82 }, { name: 'Bootstrap', level: 76 },
    ],
  },
  {
    id: 'it', label: 'IT & Networking', color: '#b8905a',
    skills: [
      { name: 'Network Mgmt', level: 88 }, { name: 'LTE / Cradlepoint', level: 85 },
      { name: 'Google Workspace', level: 90 }, { name: 'VoIP Support', level: 82 },
      { name: 'Hardware Troubleshoot', level: 85 }, { name: 'Endpoint Setup', level: 80 },
    ],
  },
  {
    id: 'tools', label: 'Tools & Platforms', color: '#d4a85c',
    skills: [
      { name: 'GitHub', level: 85 }, { name: 'VS Code', level: 90 },
      { name: 'Android Studio', level: 80 }, { name: 'NetCloud Manager', level: 88 },
      { name: 'IntelliJ IDEA', level: 78 }, { name: 'Linux', level: 72 },
      { name: 'Microsoft Suite', level: 85 },
    ],
  },
  {
    id: 'databases', label: 'Databases', color: '#8b6433',
    skills: [
      { name: 'MySQL', level: 74 }, { name: 'SQL', level: 76 }, { name: 'Database Design', level: 70 },
    ],
  },
  {
    id: 'soft', label: 'Professional', color: '#c4904e',
    skills: [
      { name: 'Problem Solving', level: 95 }, { name: 'Technical Support', level: 92 },
      { name: 'Documentation', level: 83 }, { name: 'Collaboration', level: 88 },
      { name: 'Adaptability', level: 90 }, { name: 'Critical Thinking', level: 90 },
    ],
  },
]

function SkillBar({ name, level, color }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium" style={{ color: '#c8bfb2' }}>{name}</span>
        <span className="text-xs font-mono" style={{ color }}>{level}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(201,152,90,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${level}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
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
          <p className="font-mono text-sm tracking-widest uppercase mb-3" style={{ color: '#c9985a' }}>
            // technical skills
          </p>
          <h2 className="section-heading">What I Work With</h2>
          <p className="section-subheading mx-auto">
            A versatile toolkit spanning software development, IT operations, and business technology management.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 reveal">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                active === cat.id
                  ? { background: cat.color, color: '#0c0906', fontWeight: 600, boxShadow: `0 0 18px ${cat.color}44` }
                  : { color: '#9e8e7e', background: 'rgba(201,152,90,0.06)', border: '1px solid rgba(201,152,90,0.12)' }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skill bars */}
        <div className="max-w-3xl mx-auto reveal">
          <div className="glass-card rounded-2xl p-8" style={{ boxShadow: `0 0 40px ${current.color}0a` }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 rounded-full" style={{ background: current.color }} />
              <h3 className="font-bold text-xl" style={{ color: '#f0ebe2' }}>{current.label}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-10">
              {current.skills.map((skill) => (
                <SkillBar key={skill.name} name={skill.name} level={skill.level} color={current.color} />
              ))}
            </div>
          </div>
        </div>

        {/* Tag cloud */}
        <div className="mt-16 reveal">
          <p className="text-center text-sm mb-6 font-mono" style={{ color: '#6b5e52' }}>// all technologies</p>
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
