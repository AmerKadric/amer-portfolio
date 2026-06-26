import { Code2, Network, Wrench, Globe, Cpu, Users } from 'lucide-react'

const highlights = [
  {
    icon: <Code2 size={20} />,
    title: 'Software Development',
    desc: 'Building functional applications across Android, web, and backend systems using Python, Java, JavaScript, and Kotlin.',
  },
  {
    icon: <Network size={20} />,
    title: 'Network & IT Management',
    desc: 'Managing LTE-based connectivity and IT infrastructure across 100+ business locations with real uptime accountability.',
  },
  {
    icon: <Globe size={20} />,
    title: 'Web Development',
    desc: 'Maintaining and updating company websites — handling content, configuration, and code-level fixes on production systems.',
  },
  {
    icon: <Wrench size={20} />,
    title: 'Technical Troubleshooting',
    desc: 'Diagnosing and resolving hardware, software, VoIP, and network issues that directly impact business operations.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'AI/ML Integration',
    desc: 'Developed a multi-agent AI system combining voice input, NLP, and structured data extraction for real-world use.',
  },
  {
    icon: <Users size={20} />,
    title: 'Business Technology Support',
    desc: 'Supporting end users, coordinating with ISPs and vendors, and keeping multi-location business technology reliable.',
  },
]

export default function About() {
  return (
    <section id="about" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'rgba(13,20,40,0.5)' }} />
      <div className="orb orb-purple w-96 h-96 top-0 right-0 opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">
            // about me
          </p>
          <h2 className="section-heading">Who I Am</h2>
          <p className="section-subheading mx-auto">
            A Computer Science graduate who builds things, manages systems, and solves problems that matter.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Bio text */}
          <div className="reveal">
            <div
              className="glass-card rounded-2xl p-8 space-y-5"
              style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
            >
              <p className="text-slate-300 leading-relaxed">
                My name is Amer Kadric — a 24-year-old Bosnian-American and Computer Science
                graduate from Wayne State University with a 3.72 GPA. I currently work as an{' '}
                <span className="text-white font-semibold">IT Manager at Lady Jane's Haircuts for Men</span>{' '}
                — where I'm responsible for keeping technology running across{' '}
                <span className="text-cyan-400 font-semibold">101 salon locations nationwide</span>.
              </p>
              <p className="text-slate-300 leading-relaxed">
                My work sits at the intersection of software development and real-world IT operations.
                I manage LTE-based network infrastructure, administer Google Workspace, troubleshoot
                hardware and VoIP systems, maintain company websites, and provide technical support
                that directly impacts how businesses operate day to day.
              </p>
              <p className="text-slate-300 leading-relaxed">
                On the software side, I design and develop applications across multiple languages and
                platforms — bringing the same discipline and ownership to code that I bring to
                infrastructure. I understand how to architect systems, collaborate with teams, and
                deliver software that solves real problems at scale.
              </p>
              <p className="text-slate-300 leading-relaxed">
                What sets me apart is that I don't just write code in isolation — I apply technology
                to real business environments, work with vendors and ISPs, support end users at scale,
                and take full ownership of the systems I manage. I bring both technical depth and
                operational awareness to everything I do.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {[
                  { value: '101', label: 'Locations Managed' },
                  { value: '3.72', label: 'GPA' },
                  { value: '5+', label: 'Languages' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold accent-gradient">{stat.value}</p>
                    <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((item, i) => (
              <div
                key={item.title}
                className={`reveal reveal-delay-${i + 1} glass-card rounded-xl p-5 group hover:border-cyan-400/30 transition-all duration-300 cursor-default`}
                style={{
                  borderColor: 'rgba(0,212,255,0.08)',
                  boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-cyan-400 group-hover:scale-110 transition-transform duration-200"
                  style={{ background: 'rgba(0,212,255,0.1)' }}
                >
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
