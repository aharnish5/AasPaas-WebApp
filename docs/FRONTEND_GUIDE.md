# Frontend Guide

## Stack
- React 18 + Vite 5 + TypeScript 5
- TailwindCSS 3, Radix UI, Lucide icons, Recharts
- Redux Toolkit, React Hook Form + zod
- Storybook 7, Vitest + Testing Library

## Structure
```
frontend/src
├─ components/
│  ├─ ui/               # primitives (Button, Input, Modal, etc.)
│  ├─ layout/           # AppShell, Navbar, Footer
│  ├─ shop/             # ShopCard, ShopImageCarousel
│  ├─ search/           # AddressAutocomplete, SearchBar
│  └─ ...
├─ pages/
│  ├─ Home.jsx, SearchResults.jsx, ShopDetail.jsx
│  ├─ Directions.jsx (placeholder)
│  ├─ customer/*  (Feed, Favorites, Profile)
│  └─ vendor/*    (Dashboard, Shops, Shop, Analytics, Settings)
├─ hooks/ (useTheme.tsx, etc.)
├─ services/ (api clients)
├─ store/ (slices)
├─ styles/ (theme.ts)
└─ utils/
```

## Theming
- Tokens in `src/styles/theme.ts` become CSS variables via `useTheme.tsx` provider.
- Use Tailwind with `var(--token)` bindings in `tailwind.config.*` for colors/surfaces.
- Dark mode supported by toggling the theme provider; prefer tokenized classes.

## Modal & accessibility
- `components/ui/Modal.jsx` is SSR-safe (guarded document access).
- Accessible focus trap and ARIA attributes included.

## Development
```powershell
cd frontend; npm run dev     # start vite dev server
npm run lint                 # strict lint (hooks rules enforced)
npm test                     # unit tests via vitest
npm run storybook            # component docs (port 6006)
```

## Build
```powershell
npm run build; npm run preview
```

## Common pitfalls
- TypeScript module resolution: some imports include `.ts` specifier and `allowImportingTsExtensions` is enabled in `tsconfig.json`.
- Maps are optional; without `VITE_MAPBOX_TOKEN`, related UI hides gracefully.
- Avoid conditional hook calls; ensure hooks are top-level in components.

## Adding a page
- Add route in your router config
- Create a surface with the hero/surface pattern used in vendor pages
- Use tokenized Tailwind classes to match the design system

## Storybook notes
- Write CSF stories with default exports
- Build with `npm run storybook:build` for static docs
