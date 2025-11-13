import { Github } from 'lucide-react'
import Button from '../components/ui/Button'

const About = () => {
  return (
    <div className="container-custom py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold text-text">About Aas Paas</h1>
        <p className="max-w-3xl text-base text-text-muted sm:text-lg">
          We map the heartbeat of Indian neighbourhoods by connecting people with authentic local vendors. From tea stalls
          to tailors, Aas Paas helps small businesses be discovered and loved again.
        </p>
        <div className="pt-2">
          <a
            href="https://github.com/aharnish5/AasPaas-WebApp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-text shadow-[var(--shadow-xs)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
            aria-label="View Aas Paas on GitHub (opens in new tab)"
          >
            <Github className="h-4 w-4" />
            View GitHub Repository
          </a>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          title: 'Our Mission',
          body: 'Empower neighbourhood businesses with simple digital tools so they can be found, trusted, and supported by their local community.'
        }, {
          title: 'What We Do',
          body: 'Unified search, reviews, maps, and AI-enhanced onboarding make it effortless for vendors to go online and for customers to discover the right place.'
        }, {
          title: 'Why It Matters',
          body: 'Local commerce builds resilient cities. Every listing we create and every review we host brings people closer to the small businesses around them.'
        }].map((card) => (
          <div key={card.title} className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-text">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="glass-card rounded-[28px] p-8">
        <h2 className="text-2xl font-semibold text-text">Principles</h2>
        <ul className="mt-4 grid gap-3 text-sm text-text-muted md:grid-cols-2">
          <li>Design with dignity for both customers and vendors.</li>
          <li>Default to clarity: simple onboarding, simple discovery.</li>
          <li>Champion trust with verified listings and community reviews.</li>
          <li>Be fast, accessible, and friendly across devices.</li>
        </ul>
        <div className="mt-6">
          <a
            href="https://github.com/aharnish5/AasPaas-WebApp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-text shadow-[var(--shadow-xs)] ring-1 ring-[color:var(--color-border)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
          >
            <Github className="h-4 w-4" />
            Star us on GitHub
          </a>
        </div>
      </section>
    </div>
  )
}

export default About

