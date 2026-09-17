import { Network, Wrench, Globe, Users, Shield, HeadphonesIcon } from 'lucide-react'

const highlights = [
  {
    icon: <Network size={20} />,
    title: 'Network & IT Management',
    desc: 'Managing LTE-based connectivity and IT infrastructure across 100+ business locations with real uptime accountability.',
  },
  {
    icon: <Wrench size={20} />,
    title: 'Technical Troubleshooting',
    desc: 'Diagnosing and resolving hardware, software, VoIP, and network issues that directly impact business operations.',
  },
  {
    icon: <Globe size={20} />,
    title: 'Web & Systems Maintenance',
    desc: 'Maintaining company websites and internal systems — handling content, configuration, and code-level fixes on production.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Google Workspace Admin',
    desc: 'Managing user provisioning, access control, and authentication across the organization at scale.',
  },
  {
    icon: <HeadphonesIcon size={20} />,
    title: 'End User Support',
    desc: 'Providing Tier 1–2 technical support, endpoint configuration, and issue resolution across all business locations.',
  },
  {
    icon: <Users size={20} />,
    title: 'Vendor & ISP Coordination',
    desc: 'Working directly with ISPs and technology vendors to resolve network performance issues and manage escalations.',
  },
]

export default function About() {
  return (
    <section id="about" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'rgba(13,20,40,0.5)' }} />
      <div className="orb orb-purple w-96 h-96 top-0 right-0 opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-3">// about me</p>
          <h2 className="section-heading">Who I Am</h2>
          <p className="section-subheading mx-auto">
            A Computer Science graduate who manages technology at scale and solves real problems.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Bio */}
          <div className="reveal">
            <div className="glass-card rounded-2xl p-8 space-y-5" style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}>
              <p className="text-slate-300 leading-relaxed">
                My name is Amer Kadric — a 24-year-old Bosnian-American and Computer Science
                graduate from Wayne State University with a 3.72 GPA. I currently work as an{' '}
                <span className="text-white font-semibold">Information Technology Manager at Lady Jane's Haircuts for Men</span>{' '}
                — where I'm responsible for keeping technology running across{' '}
                <span className="text-cyan-400 font-semibold">101 salon locations nationwide</span>.
              </p>
              <p className="text-slate-300 leading-relaxed">
                I manage LTE-based network infrastructure, administer Google Workspace, troubleshoot
                hardware and VoIP systems, maintain company websites, and provide technical support
                that directly impacts how businesses operate day to day.
              </p>
              <p className="text-slate-300 leading-relaxed">
                What sets me apart is that I take full ownership of the systems I manage — working
                with vendors and ISPs, supporting end users at scale, and applying both technical
                depth and operational awareness to everything I do.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {[
                  { value: '101', label: 'Locations Managed' },
                  { value: '3.72', label: 'GPA' },
                  { value: '4+', label: 'Years Experience' },
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
              <div key={item.title}
                className={`reveal reveal-delay-${i + 1} glass-card rounded-xl p-5 group hover:border-cyan-400/30 transition-all duration-300 cursor-default`}
                style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-cyan-400"
                  style={{ background: 'rgba(0,212,255,0.1)' }}>
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
