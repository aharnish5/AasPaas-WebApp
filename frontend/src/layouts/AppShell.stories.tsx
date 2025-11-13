import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import {
  AlertTriangle,
  CalendarClock,
  Flame,
  Headphones,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  PlusCircle,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'
import AppShell from './AppShell'

const sidebarSections = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard, isActive: true },
      { id: 'shops', href: '/shops', label: 'Shops', icon: MapPinned },
      { id: 'team', href: '/team', label: 'Team', icon: Users, badge: { label: '3', tone: 'neutral' as const } },
      { id: 'support', href: '/support', label: 'Support', icon: Headphones },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { id: 'analytics', href: '/analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'campaigns', href: '/campaigns', label: 'Campaigns', icon: Flame },
      { id: 'compliance', href: '/compliance', label: 'Compliance', icon: ShieldCheck },
      { id: 'settings', href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const defaultChildren = (
  <div className="space-y-6">
    <section className="surface-card relative overflow-hidden rounded-3xl border border-border/60 bg-[color:var(--color-surface)]/95 px-7 py-10 shadow-[var(--shadow-sm)] md:px-10 md:py-12">
      <div className="pointer-events-none absolute -top-24 right-16 h-48 w-48 rounded-full bg-[color:var(--color-primary)]/30 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/20 blur-[140px]" />
      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-4">
          <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
            <CalendarClock className="h-4 w-4" />
            Daily pulse
          </span>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text md:text-4xl">
              Welcome back, Nisha.
            </h2>
            <p className="text-sm text-text-muted">
              Courts are buzzing—convert browsers into loyal fans by joining the new weekend campaign, responding to reviews, and syncing listings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-gradient" onClick={action('cta-primary')}>
              Launch quick action
            </button>
            <button
              type="button"
              className="surface-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]"
              onClick={action('cta-secondary')}
            >
              View playbook
            </button>
          </div>
        </div>

        <div className="relative grid w-full max-w-sm gap-4 rounded-3xl border border-border/60 bg-[color:var(--color-background)]/70 p-6 shadow-[var(--shadow-glass)] backdrop-blur">
          {[{
            label: 'Conversion lift',
            value: '+18.2%',
            tone: 'text-[color:var(--color-primary)]',
          }, {
            label: 'Listings verified',
            value: '96%',
            tone: 'text-text',
          }, {
            label: 'Matches this week',
            value: '42',
            tone: 'text-[color:var(--color-accent)]',
          }].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/40 p-4 shadow-sm backdrop-blur">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-text-muted/80">
                {metric.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
            </div>
          ))}
          <span className="pointer-events-none absolute -right-8 top-10 h-24 w-24 rounded-full bg-[color:var(--color-primary)]/25 blur-3xl" />
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      {[{
        title: 'Campaign momentum',
        metric: '82% engagement',
        delta: '+12.4% vs last launch',
        Icon: Flame,
      }, {
        title: 'Review health',
        metric: '4.7 rating',
        delta: '18 replies pending',
        Icon: MessageSquare,
      }, {
        title: 'Trust guarantees',
        metric: 'All docs current',
        delta: 'Expires in 33 days',
        Icon: ShieldCheck,
      }].map(({ title, metric, delta, Icon }) => (
        <div key={title} className="surface-card rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted/70">{title}</p>
            <Icon className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-text">{metric}</h3>
          <p className="mt-2 text-xs text-text-muted">{delta}</p>
        </div>
      ))}
    </section>

    <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="surface-card rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/70">Upcoming agenda</p>
            <h3 className="mt-2 text-lg font-semibold text-text">Today at a glance</h3>
          </div>
          <button
            type="button"
            className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]"
            onClick={action('agenda-open')}
          >
            Manage schedule
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {[{
            id: 'call',
            label: 'Review huddle with Maple Street',
            time: '09:30',
            tone: 'bg-primary/10 text-[color:var(--color-primary)]',
          }, {
            id: 'inspections',
            label: 'Safety inspection slot',
            time: '13:00',
            tone: 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]',
          }, {
            id: 'coaching',
            label: 'Team coaching session',
            time: '16:15',
            tone: 'bg-[color:var(--color-secondary)]/12 text-[color:var(--color-secondary)]',
          }].map(({ id, label, time, tone }) => (
            <div key={id} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text">{label}</p>
                <span className="text-xs text-text-muted">Lead: Priya Singh</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tone}`}>
                {time}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="surface-card flex flex-col gap-4 rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Alerts</h3>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]"
            onClick={action('view-alerts')}
          >
            View all
          </button>
        </div>
        <div className="space-y-3 text-sm text-text-muted">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[color:var(--color-warning)]" />
            <div>
              <p className="font-semibold text-text">High inquiry volume</p>
              <p>North complex received 4x leads in 24 hrs. Acknowledge within 2 hrs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-4 w-4 text-[color:var(--color-primary)]" />
            <div>
              <p className="font-semibold text-text">Ten reviews awaiting reply</p>
              <p>Send thank-you notes to boost discovery score.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
)

const compactChildren = (
  <div className="space-y-4">
    <section className="surface-card rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/70">Pulse</p>
          <h2 className="mt-2 text-xl font-semibold text-text">Team brief</h2>
          <p className="mt-2 text-xs text-text-muted">3 open reviews, 2 inspections, and a campaign launch queued today.</p>
        </div>
        <button type="button" className="btn-gradient px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]" onClick={action('compact-cta')}>
          Open actions
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[{
          label: 'Live shops',
          metric: '12',
        }, {
          label: 'Active campaigns',
          metric: '4',
        }, {
          label: 'SLA health',
          metric: '98%',
        }].map(({ label, metric }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-[color:var(--color-background)]/70 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-text-muted/80">{label}</p>
            <p className="mt-2 text-xl font-semibold text-text">{metric}</p>
          </div>
        ))}
      </div>
    </section>
    <section className="surface-card rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-semibold text-text">Upcoming</h3>
      <div className="mt-3 space-y-3 text-xs text-text-muted">
        <div className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2">
          <span>Reply to VIP review</span>
          <span className="text-[color:var(--color-primary)]">Due 11:30</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2">
          <span>Inventory sync</span>
          <span className="text-[color:var(--color-accent)]">14:00</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2">
          <span>Compliance refresh</span>
          <span className="text-[color:var(--color-secondary)]">16:15</span>
        </div>
      </div>
    </section>
  </div>
)

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    sidebarSections,
    topbarProps: {
      user: { name: 'Nisha Patel', email: 'nisha@aaspaas.app' },
      quickActions: [
        { id: 'create-shop', label: 'New Shop', icon: PlusCircle, onSelect: action('create-shop') },
      ],
      notifications: [
        { id: '1', title: '2 new reviews pending reply', timeAgo: 'Just now' },
      ],
      unreadNotifications: 2,
      userMenuItems: [
        { id: 'profile', label: 'Profile', onSelect: action('profile') },
        { id: 'logout', label: 'Logout', tone: 'danger' as const, onSelect: action('logout') },
      ],
    },
    children: defaultChildren,
  },
} satisfies Meta<typeof AppShell>

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const CompactLayout: Story = {
  args: {
    layout: 'compact',
    children: compactChildren,
  },
}

export default meta
