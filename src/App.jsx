import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Education from './components/Education'
import ResumeSection from './components/ResumeSection'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Education />
        <ResumeSection />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
