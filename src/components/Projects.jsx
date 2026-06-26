import { Github, ExternalLink, Cpu, ChevronRight } from 'lucide-react'

const projects = [
  {
    title: 'Common Operating Picture Completer',
    subtitle: 'AI/ML-Powered Military Data Structuring System',
    description:
      'An Android application that transforms unstructured voice and text inputs into structured, actionable military reports — enhancing situational awareness and operational efficiency in real-world defense scenarios.',
    features: [
      'Multi-agent AI pipeline: Urgency Model, Sentiment Model, and Entity Extraction Model working in tandem',
      'Voice input processing with real-time transcription and geolocation-based logging',
      'Biometric authentication and masked message display for operational security',
      'Structured data output that standardizes fragmented field communications',
    ],
    tags: ['Android Studio', 'Kotlin', 'Java', 'AI/ML', 'Multi-Agent System', 'NLP', 'Biometric Auth'],
    color: '#00d4ff',
    github: '#', // Replace with actual GitHub link
    demo: null,
    featured: true,
  },
  {
    title: 'Portfolio Website',
    subtitle: 'Personal Brand & Developer Portfolio',
    description:
      'This portfolio website — built with React, Vite, and Tailwind CSS — showcasing a clean, responsive, and professional personal brand with smooth animations and a polished dark UI.',
    features: [
      'Fully responsive design optimized for desktop, tablet, and mobile',
      'Scroll-reveal animations and smooth section transitions',
      'Component-based React architecture for easy content editing',
      'Deployed on Vercel with zero-config CI/CD pipeline',
    ],
    tags: ['React', 'Vite', 'Tailwind CSS', 'JavaScript', 'Vercel'],
    color: '#10b981',
    github: '#', // Replace with your GitHub repo
    demo: '#',
    featured: false,
  },
]

function ProjectCard({ project, featured }) {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col ${
        featured ? 'md:col-span-2' : ''
      }`}
      style={{ borderColor: `${project.color}15` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${project.color}40`
        e.currentTarget.style.boxShadow = `0 0 50px ${project.color}18`
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${project.color}15`
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {project.featured && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold text-navy-900"
                  style={{ background: project.color }}
                >
                  Featured
                </span>
              )}
              {project.placeholder && (
                <span className="px-2 py-0.5 rounded text-xs font-medium border border-slate-600 text-slate-500">
                  Placeholder
                </span>
              )}
            </div>
            <h3 className="text-white font-bold text-xl mb-1 group-hover:text-cyan-400 transition-colors">
              {project.title}
            </h3>
            <p className="text-sm" style={{ color: project.color }}>
              {project.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {project.github && project.github !== '#' && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                aria-label="GitHub"
              >
                <Github size={15} />
              </a>
            )}
            {project.demo && project.demo !== '#' && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                aria-label="Live Demo"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-5">{project.description}</p>

        <ul className="space-y-2 mb-6 flex-1">
          {project.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: project.color }} />
              {f}
            </li>
          ))}
        </ul>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                background: `${project.color}10`,
                border: `1px solid ${project.color}22`,
                color: project.color,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,20,40,0.4)' }}
      />
      <div className="orb orb-cyan w-80 h-80 top-0 right-1/4 opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // projects
          </p>
          <h2 className="section-heading">Things I've Built</h2>
          <p className="section-subheading mx-auto">
            A selection of projects that demonstrate my ability to design, develop, and ship
            real software solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <div
              key={project.title}
              className={`reveal reveal-delay-${i + 1} ${project.featured ? 'md:col-span-2' : ''}`}
            >
              <ProjectCard project={project} featured={project.featured} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 reveal">
          <p className="text-slate-400 mb-4">
            More projects are in progress. Check back soon or view my GitHub.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex"
          >
            <Github size={16} />
            View GitHub Profile
          </a>
        </div>
      </div>
    </section>
  )
}
