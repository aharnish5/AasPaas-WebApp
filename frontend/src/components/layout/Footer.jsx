import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, Instagram, Linkedin, Twitter } from 'lucide-react'

const footerLinks = [
  {
    heading: 'Explore',
    items: [
      { label: 'Discover Shops', to: '/search' },
      { label: 'Become a Vendor', to: '/signup/vendor' },
      { label: 'Customer Stories', to: '/about' },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help Center', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
]

const socialLinks = [
  { label: 'Instagram', icon: Instagram, href: 'https://www.instagram.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://www.twitter.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com' },
]

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-white/5 bg-gradient-to-b from-[#06071e] via-[#040417] to-[#020212] text-white">
      <div className="container-custom relative py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-1/2">
          <div className="mx-auto h-48 w-48 rounded-full bg-[rgba(123,93,255,0.24)] blur-3xl opacity-60" />
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b5dff] to-[#f95763] text-white">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[0.16em] uppercase">Aas Paas</p>
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">Mapping local magic</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/70">
              Discover handmade crafts, essential services, and hidden culinary gems just around the corner.
              We amplify the heartbeat of India’s neighbourhood vendors through design, data, and storytelling.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              <span className="rounded-full bg-white/5 px-3 py-1">Hyperlocal</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Community</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Verified</span>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">{section.heading}</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-2 transition hover:text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Stay in touch</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-white/60" />
                  support@aaspaas.com
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-white/60" />
                  +91 123 456 7890
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Join the community</h3>
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/10"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Aas Paas. Mapping the heartbeat of India.</p>
          <p className="text-xs uppercase tracking-[0.24em]">Built with love in every lane.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

