# UI/UX Redesign & Migration Plan

Goal: Deliver a modern, immersive, animation-rich interface without regressing existing functionality. This guide outlines phased migration steps spanning design tokens, component rewrites, data flows, and rollout strategy.

## 1. Principles for the New Experience
- **Consistent Visual Language**: Gradient palettes inspired by current hero, glassmorphism surfaces, soft shadows, rounded geometry.
- **Motion as Feedback**: Use Framer Motion variants for page transitions, component entrance, micro-interactions (buttons, toggles, cards). Keep animations under 300 ms; respect reduced-motion media query.
- **Information Hierarchy**: Promote location context, vendor uniqueness, and call-to-action clarity. Provide skeleton loaders for geo queries.
- **Accessibility**: Minimum contrast ratio 4.5:1, keyboard navigation, focus outlines, ARIA labels for map and analytics graphs.
- **Performance**: Defer heavy modules (Mapbox, analytics charts) via dynamic imports and React.lazy; implement image lazy-loading with blur placeholders.

## 2. Phase-by-Phase Roadmap

### Phase 0 – Foundation (Week 0-1)
1. **Design Tokens**: Centralize color, spacing, typography in `styles/theme.ts` + Tailwind config. Introduce CSS variables (`:root`) for light/dark palettes.
2. **Globals Refactor**: Extract inline animations (e.g., `Home.jsx`) into reusable utility classes or Framer Motion variants.
3. **Tooling**: Enable Storybook dark-mode toggle, add Chromatic or Loki for visual regression.

### Phase 1 – Shared Shell & Navigation (Week 2-3)
1. **AppShell Redesign**: Build responsive shell with sticky header, collapsible vendor sidebar, floating quick actions.
2. **Navbar/Footer**: Implement redesign in Storybook first, integrate `Topbar`/`Sidebar` with accessibility improvements (skip links, aria roles).
3. **ProtectedRoute UX**: Replace spinner with branded loader overlay.
4. **Theme Switcher**: Finalize `useTheme` hook integration; add toggle in navbar with persisted preference.

### Phase 2 – Core Journeys (Week 4-6)
1. **Home / Landing**: 
   - Replace inline CSS with Tailwind/Framer combination.
   - Add hero background animation via Lottie or Canvas (lightweight).
   - Introduce “Trending Areas” carousel, vendor testimonials (cards).
2. **Search Results**:
   - Split layout: map + list with responsive toggle.
   - Implement sticky filter panel, animated chips, skeleton states.
   - Add infinite scroll or pagination with subtle fade-in.
3. **Shop Detail**:
   - Gallery carousel (swipe-enabled), badges (open now, price range).
   - Sticky action bar (call vendor, get directions, add to favorites).
4. **Authentication**:
   - Unified auth modal with tab switcher (customer/vendor).
   - Gradient backgrounds, step-by-step vendor onboarding wizard.

### Phase 3 – Vendor Portal (Week 7-8)
1. **Dashboard**: 
   - Cards with KPI counters, area charts (Recharts + animations).
   - Task list (complete profile, upload images).
2. **Shop Management**:
   - Multi-step form with progress indicator, animated validation states.
   - integrate AI suggestions panel (Gemini results) with accept/merge controls.
3. **Analytics**:
   - Expand stats to include heatmap/time series (Mapbox layers) and review sentiment.
4. **Reviews Moderation**:
   - Table with filter chips, inline reply editor, helpful vote insights.

### Phase 4 – Progressive Enhancement (Week 9+)
1. **Offline-first**: Cache location search & vendor data via Workbox; show toast when offline.
2. **Push Notifications**: Browser notifications for vendor reviews (requires backend support).
3. **Micro-interactions**: Sound/animation for adding favorites, confetti for successful onboarding.
4. **A/B Testing**: Feature flags controlling new UI; integrate LaunchDarkly/Split or simple env-based toggles.

## 3. Technical Migration Strategy

| Step | Action | Notes |
| --- | --- | --- |
| 1 | Create feature flag context (`UIFlagProvider`) controlling redesigned routes. | Use query param override for QA. |
| 2 | Build new components in isolation (`/components/v2/*`), documented in Storybook. | Ensure TS types exported for props. |
| 3 | Introduce `Route` wrappers (e.g., `<HomeV2 />`) behind flag, gradually expand coverage. | Keep old components until parity reached. |
| 4 | Refactor API hooks to React Query for server state. | Introduce `QueryClient` while maintaining Redux for auth. |
| 5 | Optimize bundles: split vendor portal via dynamic import, prefetch on hover. | Track bundle size via `vite build --report`. |
| 6 | Migrate forms to React Hook Form + Zod resolver for consistent validation states. | Provide shared error animations. |

## 4. Testing & Quality
- **Visual Regression**: Add Storybook stories for new components; run Chromatic per PR.
- **E2E Scripts**: Expand Playwright tests to cover new flows (login, search, vendor create shop). Use feature flag toggles in tests.
- **Performance Budgets**: Lighthouse >= 90 for PWA, Performance, Accessibility. Use `npm run build && npx lighthouse http://localhost:4173`.
- **Analytics QA**: Validate new charts with mock data; ensure timezone-safe formatting.

## 5. Risk Mitigation
- Maintain parity by shipping V2 components behind flags; release toggles gradually to cohorts (internal team → vendor beta → general).
- Provide rollback path by flipping flag env variable (e.g., `VITE_UI_V2_ENABLED=false`).
- Monitor error logs (Sentry recommended) and user feedback (Hotjar or similar) during rollout.

## 6. Future Enhancements
- **Super App**: Consider PWA install banner, background sync, add-to-calendar for vendor promotions.
- **AR Mapping**: Explore 3D map overlays or AR directions (long-term).
- **Gamification**: Badges for reviewers, vendor achievements, streak animations.

## 7. Task Tracker (Sample)
| Priority | Task | Owner | Estimate | Status |
| --- | --- | --- | --- | --- |
| High | Build V2 AppShell & navigation | Frontend | 5d | ☐ |
| High | Implement new search list/map layout | Frontend | 6d | ☐ |
| Medium | React Query integration for shop data | Frontend | 4d | ☐ |
| Medium | Design token documentation | Design | 3d | ☐ |
| Low | Offline caching with Workbox | Frontend | 3d | ☐ |

Keep this doc updated as design decisions evolve. Pair with `docs/ARCHITECTURE.md` and `docs/API.md` to ensure backend endpoints continue meeting UI requirements throughout the migration.


