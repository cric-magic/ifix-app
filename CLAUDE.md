# IFix — Project Rules

## Stack
- React + TypeScript + Vite
- Ant Design v6 (`antd`)
- React Router v6
- Deployed on Vercel, source on GitHub (private)

## Theming

### Never hardcode colors — always reference a token
No literal hex/rgb/rgba color values anywhere in the codebase (components, CSS, static config). Every color must trace back to Ant Design's token system, via whichever of these three fits the context:

- **Inside a component's render** — `theme.useToken()`:
  ```tsx
  import { theme } from 'antd'
  const { token } = theme.useToken()
  ```
- **In a plain CSS file** (`index.css`) — antd's cssVar mode exposes every token as a CSS custom property; reference it directly instead of copying the resolved value:
  ```css
  .example { background: var(--ant-color-fill-secondary); border-color: var(--ant-color-border-secondary); }
  ```
- **In static config outside any component** (e.g. `ConfigProvider`'s own `components` overrides in `src/App.tsx`, which can't call `useToken()` on themselves) — precompute with `theme.getDesignToken()` once at module scope and reference the result:
  ```tsx
  const baseToken = theme.getDesignToken({ algorithm: theme.darkAlgorithm, token: seedTokens })
  // ...later: itemSelectedBg: baseToken.colorFillTertiary
  ```

If a spot check ever turns up a literal color value, convert it to one of the above — don't leave it "because it happens to match."

### Semantic token mappings
| Intent | Token |
|---|---|
| Success / paid | `token.colorSuccess` |
| Warning / due | `token.colorWarning` |
| Error / overdue | `token.colorError` |
| Primary accent | `token.colorPrimary` |
| Muted / disabled | `token.colorTextDisabled` |
| Secondary text | `token.colorTextSecondary` |
| Subtle bg | `token.colorFillSecondary` |
| Error row bg | `token.colorErrorBg` |
| Card / panel bg | `token.colorBgElevated` |
| Border | `token.colorBorderSecondary` |

### Icon colors
Icons render via `currentColor`, so there is no separate icon color scale — reuse the text token scale:

| Tier | Token | When |
|---|---|---|
| Primary | `token.colorText` | Hover / active / focused state only |
| Secondary | `token.colorTextSecondary` | Default state — this is the baseline for all icons |
| Tertiary | `token.colorTextTertiary` | De-emphasized icons (rare) |

Rule: **icons default to secondary; only hover/active/focus bumps to primary.** Never leave an icon at primary color at rest.

This is enforced two ways:
- Ant Design's own icon slots (Select arrow, DatePicker suffix, clear buttons) read the `colorIcon`/`colorIconHover` tokens, set in `src/App.tsx` to secondary/primary respectively.
- Custom Lucide icons (inside `Button` icons, `Input` prefixes) aren't covered by those tokens, so `src/index.css` has explicit rules scoped to `.ant-btn-icon svg` and `.ant-input-prefix svg` (excluding solid/primary buttons, which keep their forced light-on-color text).

### Custom Lucide icons rendered outside a CSS-covered slot — use solid colors, not alpha tokens
Any Lucide icon whose color you set directly (inline `style`, an `Avatar`'s `icon` prop, a wrapping `div`'s `color`) — i.e. anywhere **not** already covered by the `colorIcon`/`colorIconHover` tokens or the `.ant-btn-icon svg` / `.ant-input-prefix svg` CSS rules above — must use `ICON_COLOR_SECONDARY` / `ICON_COLOR_PRIMARY` from `src/constants/iconColors.ts`, never the alpha-based `token.colorText*` tokens.

Lucide icons are stroked paths, and several have crossing/overlapping segments (`ImageOff`'s diagonal slash through the box, `Plus`'s two bars meeting at the center, etc.). A semi-transparent stroke double-renders at those intersections and shows a visible seam — solid colors don't have this problem, which is exactly why `iconColors.ts` exists as a separate scale from the text tokens. If you see a faint diagonal or crossed line artifact on an icon, this is almost always the cause — check what's driving its color first.

### Component overrides (in `src/App.tsx` ConfigProvider)
- `Card` — borderless (`colorBorderSecondary: 'transparent'`), slightly darker bg (`#0d0d0d`)
- `Menu` — muted active state (10% primary opacity bg)

### Theme is configured in `src/App.tsx` via `ConfigProvider`
- Change `colorPrimary` there to shift the entire app palette
- `theme.darkAlgorithm` is active — all tokens adapt automatically
- Do not override colors at the component level unless there is no token equivalent

### Layout rules
- Sidebar (`Sider`) background must be `transparent` — inherits from body
- Sidebar has no border
- Content area has no hardcoded background — inherits from Ant Design Layout
- `index.css` must not contain hardcoded color values

### Panel header actions: list views vs. detail views
`.ifix-table-panel` is used on both list pages (Catalog, Unit list) and detail pages (Product Detail's "Product Details" and "Units" panels). The two use opposite placement for header actions:
- **List/index views** (e.g. `ProductsPage`, `UnitsListPage`) — filters and the primary action button (`Create Product`, `Add Unit`) render in their own row **above** the panel, not inside it. The panel itself has no header row.
- **Detail views** (e.g. `ProductDetailPage`'s `OverviewTab`/`UnitsTab`) — the title and action button render **inside** the panel's own header row (56px height, `padding: '0 20px'`, bottom border), matching the layout used for `Product Details` / `N Units`.

When adding a new panel, check which kind of page it's on before deciding where the header actions go.

### DevTools panel (`src/components/DevToolsPanel.tsx`)
- Uses `theme.useToken()` — inherits from the same `ConfigProvider` as the app
- Positioned fixed at bottom-center, z-index 9999, outside the app viewport wrapper
- Must always stay in sync with the app theme — no hardcoded colors

## Role-based access
- Roles: `admin`, `retail`
- Permission helpers in `src/constants/roles.ts`: `canEditInstallment()`, `canViewBranchFilter()`, `canConfigurePenalty()`
- Retail users only see their own branch data

## Form state
- Ant Design Form instances lose values on unmount (between wizard steps)
- Always capture form values into React state on each "Next" click using `form.getFieldsValue()`
- Never read from an unmounted Form instance

## Deployment
- `git push` → Vercel auto-deploys from GitHub
- If auto-deploy fails, run `vercel --prod` from the project root
- `vercel.json` has a SPA rewrite rule — do not remove it
