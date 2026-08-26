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
- **Detail views** (e.g. `ProductDetailPage`'s `OverviewTab`/`UnitsTab`) — the title and action button render **inside** the panel's own header row (56px height, `paddingLeft: 16, paddingRight: 8`, bottom border), matching the layout used for `Product Details` / `N Units`. The right side is trimmed to 8px (not 16px) so it lines up with the action button's own centering gap instead of double-padding past it; a header with no button uses a plain `padding: '0 16px'`.

When adding a new panel, check which kind of page it's on before deciding where the header actions go.

### DevTools panel (`src/components/DevToolsPanel.tsx`)
- Uses `theme.useToken()` — inherits from the same `ConfigProvider` as the app
- Positioned fixed at bottom-center, z-index 9999, outside the app viewport wrapper
- Must always stay in sync with the app theme — no hardcoded colors

## Spacing
Every `padding`, `margin`, and `gap` value must come from this scale — no other raw pixel numbers for spacing:

| Value | px |
|---|---|
| `0` | 0 |
| `px` | 1 |
| `0.5` | 2 |
| `1` | 4 |
| `1.5` | 6 |
| `2` | 8 |
| `3` | 12 |
| `4` | 16 |
| `6` | 24 |
| `8` | 32 |
| `12` | 48 |
| `16` | 64 |
| `24` | 96 |
| `32` | 128 |
| `64` | 256 |
| `96` | 384 |

The scale still has gaps by design (e.g. nothing between 16 and 24, or between 24 and 32) — when a spacing decision falls between two scale values, round down to the tighter one, not up.

**Exceptions** — values derived from another element's exact dimensions, not chosen freely, are exempt from the scale (changing them would misalign something, not just look different):
- `43px` in `index.css` (`.ifix-nested-table-indent`) — matches the outer table's expand-toggle column width exactly.

`AppLayout.tsx`'s sidebar icon buttons (workspace trigger, account trigger, nav item back-buttons, the Products chevron) previously used `4.5px`/`8.5px` — exact centering math for antd's own small-button height (`controlHeightSM`, ~27px, a framework token this project doesn't set directly). These are now rounded to `4px`/`8px` (Spacing 1 / Spacing 2) instead, on the same "everything traces to the scale" principle as the rest of this section — accepting a sub-pixel offset against antd's own button height rather than carrying a scale exception for it.

Likewise, antd's own `Dropdown`/`Menu` item vertical padding is internally computed as `(controlHeight - fontSize * lineHeight) / 2` — with this app's `controlHeight: 36`, that came out to `7px`, not a value set directly anywhere. Pinned to `8px` (Spacing 2) via `Dropdown.paddingBlock` in `App.tsx`'s `ConfigProvider`, same principle.

## Radius
Every `borderRadius` in the app comes from this scale:

| Name | px |
|---|---|
| `XS` | 2 |
| `SM` | 4 |
| `Base` | 6 |
| `LG` | 8 |
| `XL` | 12 |
| `Pill` | 999 |

`XS`/`SM`/`Base`/`LG` are antd's own default `borderRadiusXS`/`borderRadiusSM`/`borderRadius`/`borderRadiusLG` tokens (unchanged by this app's theme) — a literal `6` in a style object is fine as long as it's on this scale, the same convention as the Spacing scale above; it doesn't need to be written as `token.borderRadius` to "count" as linked, though doing so is also fine where a component already has `token` in scope. `XL` (12) and `Pill` (999) are this project's own additions on top of antd's scale, for surfaces antd's scale doesn't reach — `XL` for window chrome/drawers/big cards (`DesktopStageLayout.tsx`, `PlaceholderPage.tsx`, `TableEmptyState.tsx`), `Pill` for fully-rounded tags and the `Segmented` thumb (`Tag.borderRadiusSM`/`Segmented.borderRadiusSM` in `App.tsx`).

**Exception**: `Segmented.borderRadiusSM: baseToken.borderRadius - 0.5` in `App.tsx` — the thumb's radius has to shrink by exactly the wrapper's own border width (0.5px) to stay concentric with it (a shape inset from another rounded shape only reads as "nested" when its radius shrinks by the inset amount). Derived math, not a free choice — same category as the `4.5px`/`8.5px` case above, except this one is legitimately unrepresentable on the scale (5.5px isn't a real size, it's `Base` minus a hairline) so it stays as-is rather than rounding.

A perfect circle (`borderRadius: '50%'`, e.g. `DotTag.tsx`'s status dot) is a distinct shape concept, not a corner-rounding amount, and isn't part of this scale.

## Consistency
When building a new feature (a table, a form, an empty state, a detail page, etc.), first check how the same kind of thing is already done elsewhere in the app and match it — don't invent a new pattern for something that already has one. This applies to visual treatment, component structure, and copy alike.

- **Table empty states** — every table with search/filtering renders its empty state via the shared `TableEmptyState` component (`src/components/TableEmptyState.tsx`), wired through antd `Table`'s `locale.emptyText`, not antd's plain default row. Two variants:
  - **No results from a search/filter** — content-specific icon (e.g. `Users` for people, `Smartphone` for device units — never a generic search icon), title "No {things} found", description "Try a different {field a}, {field b}, or {field c}."
  - **Truly empty (no filter active)** — same icon, title "No {things} yet", description "{Things} you add will show up here."
  - See `UnitsListPage.tsx` (original) and `UserTable.tsx` for the reference implementation.
- **Detail pages** — mirror the layout of an existing detail page for the same kind of entity (e.g. a new user-facing detail view should look like `AccountGeneralPage.tsx`/`UserDetailPage.tsx`'s header + `SettingsCard` sections) rather than composing a new layout from scratch.
- Before adding a new visual pattern, search the codebase for how a similar need was already solved (empty states, panel headers, table action columns, avatar sizing, icon color handling, etc.) and reuse it.

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
