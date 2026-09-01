---
name: figma-ifix-layout
description: "IFix-specific layout conventions for building screens/frames in this project's Figma file (fileKey yAbHjXejz73CntKOj4HzXj, the \"Sync\" file). Load this alongside figma-use and figma-generate-design/figma-generate-library whenever writing use_figma code that lays out IFix screens, sections, or documentation frames — before creating any gap between elements or any spacing/radius/color value."
disable-model-invocation: false
---

# IFix Figma Layout Conventions

This project's design system already traces every padding/margin/gap to a documented Spacing scale (see `CLAUDE.md`'s "## Spacing" section and the `Spacing` variable collection in the Figma file). Figma layouts built for IFix must follow the same discipline — a gap in Figma should be exactly as traceable as a gap in the codebase.

## The core rule: gaps come from auto-layout `itemSpacing`, never spacer frames

**Never create an empty rectangle or frame purely to occupy vertical/horizontal space between two elements.** This is the Figma equivalent of a hardcoded pixel value with no name — it can't be found, audited, or bulk-updated the way a bound variable can.

```javascript
// WRONG — a spacer frame standing in for a gap
const spacer = figma.createFrame();
spacer.resize(360, 16);
spacer.fills = [];
parent.appendChild(spacer);

// CORRECT — the parent's own itemSpacing, bound to a real Spacing variable
parent.layoutMode = 'VERTICAL';
parent.setBoundVariable('itemSpacing', spacingVar); // e.g. "Spacing 4" = 16px
```

Every frame that lays out more than one child should be `layoutMode: 'VERTICAL'` or `'HORIZONTAL'` (auto-layout), with `itemSpacing` bound via `setBoundVariable('itemSpacing', spacingVar)` — not a bare number, and never a manual spacer.

## One flex container = one gap value — nest to get multiple gaps

A single auto-layout frame can only have one `itemSpacing`. When a real layout needs different gaps between different pairs of children (e.g. a tight 4px between a label and its input, but a looser 16px between separate form fields), **group the tightly-related elements into their own auto-layout sub-frame** rather than trying to fake varying gaps at one level.

Example — a form with a title/subtitle pair (4px gap), two form fields (16px gap between them, 4px internally between each field's own label and input), and a button 24px below everything:

```
Content (itemSpacing = Spacing "6" = 24px)
├─ Header (itemSpacing = Spacing "1" = 4px)
│  ├─ Title
│  └─ Subtitle
├─ Fields (itemSpacing = Spacing "4" = 16px)
│  ├─ Email Field (itemSpacing = Spacing "1" = 4px)
│  │  ├─ "Email" label
│  │  └─ Input
│  └─ Password Field (itemSpacing = Spacing "1" = 4px)
│     ├─ Password Label Row (primaryAxisAlignItems: SPACE_BETWEEN — no fixed gap)
│     └─ Input
└─ Button
```

Note the "Password Label Row": when the real CSS behind a layout uses `justify-content: space-between` rather than a fixed gap (check the source before assuming), reproduce that with `primaryAxisAlignItems: 'SPACE_BETWEEN'` and no `itemSpacing` binding — don't force a gap value onto something that doesn't have one in the app.

## Same discipline for padding, radius, and border

- Padding: `frame.setBoundVariable('paddingTop', spacingVar)` (and left/right/bottom) — not literal numbers, and definitely not empty frames for padding either.
- Radius: `node.setBoundVariable('topLeftRadius', radiusVar)` etc. (all four corners individually — there's no single `cornerRadius` variable binding).
- Border width: `node.setBoundVariable('strokeWeight', borderVar)`.
- Color: always `figma.variables.setBoundVariableForPaint(paint, 'color', colorVar)` — never a literal `{r,g,b}` on a fill/stroke that has a corresponding token.

If a value genuinely has no matching variable (rare — check the Spacing/Radius/Border/Color collections first), it's fine as a literal, but treat that as the exception, not the default.

## The `resize()`-before-sizing-mode gotcha

`resize()` resets a frame's sizing modes to `FIXED` as a side effect. When building a group that should **hug its content** (`primaryAxisSizingMode: 'AUTO'`), call `resize()` first (to set an initial width) and set the `AUTO` sizing mode **after** — otherwise the resize silently locks the frame at whatever placeholder height you passed in, and everything after it in the layout gets clipped or overlaps.

```javascript
// CORRECT order for a hugging vertical group
const g = figma.createFrame();
g.layoutMode = 'VERTICAL';
g.resize(360, 10);                    // 1. set width via a throwaway height
g.primaryAxisSizingMode = 'AUTO';     // 2. THEN switch to hug — this wins
g.counterAxisSizingMode = 'FIXED';
```

## Lucide icons: color and stroke weight

The Lucide Icons library is now added to this Figma file (`libraryKey lk-bb9003bb582645a86560f4e77c313c7f0453c981b522aab23082f71a5769e9f78761bf4d4cdcba4424aa03dc5e3d4cded805666ad3c5ae175a97c2361ea32009`). `search_design_system` scoped to it via `includeLibraryKeys` finds exact icons by their bare Lucide name ("mail", "lock", "eye", "eye-off") — do not prefix the query with "lucide", that returns unrelated Heroicons results instead.

**Color**: bind the icon's stroke to the `Icon/colorIcon` (default/secondary) or `Icon/colorIconHover` (hover/active/primary) Color variables — not `Text/colorTextSecondary` or any other text-scale token. These trace to `src/constants/iconColors.ts`'s `ICON_COLOR_SECONDARY`/`ICON_COLOR_PRIMARY` (and the light-variant override in `App.tsx`'s `VARIANT_SEEDS`), the same rule CLAUDE.md's "Icon colors" section documents for the app itself: icons default to secondary, only hover/active/focus bumps to primary.

```javascript
const iconVectors = icon.findAll(n => 'strokes' in n && n.strokes && n.strokes.length > 0);
for (const v of iconVectors) {
  const newStrokes = v.strokes.map(s => ({ ...s }));
  const bound = figma.variables.setBoundVariableForPaint(newStrokes[0], 'color', iconColorVar); // Icon/colorIcon
  v.strokes = [bound, ...newStrokes.slice(1)];
}
```

**Stroke weight**: imported Lucide components are built on a 24×24 canvas with `strokeWeight: 2`. Resizing the instance to match the app's actual render size (e.g. `size={15}`) with a plain `icon.resize(15, 15)` shrinks the bounding box and child geometry but does **not** scale `strokeWeight` — that property only follows `rescale()`, not `resize()`. Left unscaled, the icon renders with the full 2px stroke at a fraction of its native size, looking noticeably thicker than the app's real Lucide render (where the browser scales the whole SVG viewBox, including `stroke-width`, uniformly).

Fix by setting `strokeWeight` explicitly to the proportional value after resizing:

```javascript
icon.resize(15, 15); // or whatever size matches the app's `size={n}` prop
const scaledStrokeWeight = 2 * (15 / 24); // 2 = Lucide's native strokeWeight at 24×24, 15 = target size
for (const v of icon.findAll(n => 'strokeWeight' in n)) {
  v.strokeWeight = scaledStrokeWeight;
}
```

Always check the app's actual `strokeWidth` prop on the source `<Icon .../>` usage before assuming 2 (Lucide's own default) — if a screen overrides it, scale from that value instead.

**Standard icon size: 16px, stroke 1.25 — fixed values, not the per-size scaling formula above.** Confirmed by the user directly in the Figma file (they added the Header's sidebar-toggle icon by hand as a worked example): every icon placed in an IFix screen build should default to **16×16 with `strokeWeight: 1.25`**, regardless of what literal `size={n}` prop the source JSX happens to pass. This intentionally overrides the "derive strokeWeight from the real size" rule above for the *default* icon size in a screen build — 16/1.25 is this project's chosen Figma standard, not a re-derivation of a specific component's literal size.

**Exception: empty-state icons stay large.** `TableEmptyState`'s icon (`icon={<Users size={22} .../>}` etc.) keeps its own bigger size (22px, per the component's real prop) with stroke scaled from *that* size using the formula (`2 × 22/24 ≈ 1.83`) — the 16/1.25 standard is for ordinary inline icons (buttons, headers, inputs, nav), not the oversized icon inside an empty-state illustration.

**Icons that sit in a clickable slot (buttons, header actions) get a 24×24 hit-box wrapper frame** around the 16×16 icon — named "Icon" — even though only the inner icon is visibly sized. This matches antd's small-button hit area and was how the user's own manual edit structured it:

```javascript
const hitbox = figma.createFrame();
hitbox.name = 'Icon';
hitbox.layoutMode = 'HORIZONTAL';
hitbox.primaryAxisAlignItems = 'CENTER';
hitbox.counterAxisAlignItems = 'CENTER';
hitbox.resize(24, 24);
hitbox.fills = [];
// ...append the 16×16 icon instance inside hitbox, centered.
```

**Header's 3-column grid needs a balancing empty node.** When a Header (or any `SPACE_BETWEEN`/grid-style row meant to center its middle content) has a real icon button on the left, add a matching empty 24×24 frame on the right even though it renders nothing — this mirrors the real app's `grid-template-columns: 1fr auto 1fr` (AppLayout.tsx's Header), where the third column exists purely so the center breadcrumb stays visually centered rather than pushed by an unbalanced left column.

## Don't guess padding/gap on antd-driven components — compute it

For input-family components (`Input`, `Select`, `InputNumber`, `DatePicker`) and anything else whose spacing comes from antd's token math rather than a value hardcoded in this app's own JSX, **do not eyeball a "close enough" Spacing value**. antd derives padding from a formula, and the result frequently lands on a scale value that isn't the first one you'd guess.

This app already hit this: an Input's vertical padding was first built in Figma as a guessed 4px (Spacing 1), but the real value — per antd's own `initComponentToken` in `node_modules/antd/es/input/style/token.js` — is:

```
paddingBlock = round((controlHeight - fontSize × lineHeight) / 2 × 10) / 10 - lineWidth
             = round((36 - 14 × 1.5714286) / 2 × 10) / 10 - 1
             = 6                                            // = Spacing "1.5", not Spacing "1"
```

Before binding any padding/gap on a component whose spacing isn't a literal in this app's own source:

1. **Find the antd component token source** in `node_modules/antd/es/<component>/style/token.js` (or `index.js` for values computed inline, e.g. `inputAffixPadding: token.paddingXXS` in `input/style/index.js`) — grep for the CSS property name (`padding`, `margin`, `gap`) to find the formula.
2. **Check this app's own overrides** in `App.tsx`'s `ConfigProvider` components block first — an explicit override (e.g. `Input.paddingInline: 12`) always wins over antd's computed default.
3. **Compute the real number**, then match it to the nearest Spacing/Radius/Border scale entry — don't reverse the order (picking a scale value first and hoping it's close).
4. **Bind every padding side, not just the one that "looks like it needs a variable."** The same Input bug also had `paddingLeft`/`paddingRight` sitting as unbound literals even though their value (12px) was numerically correct — CLAUDE.md's "trace every value to the scale via a bound variable" rule applies to all four padding sides equally, not just the ones you noticed while building.

If a real live instance of the component is easier to inspect than the antd source (e.g. via the app's own [InspectorOverlay](../../../src/components/InspectorOverlay.tsx) or browser devtools computed styles), that's an equally valid — often faster — way to get the real number; the source-code derivation above is the fallback when there's no running instance to measure.

**Antd's own component-token math isn't the final word — check `index.css` for an override on top of it.** This app hit a second, compounding version of the same mistake: the Email/Password input's icon-to-placeholder gap was built in Figma as 4px, derived from antd's `inputAffixPadding: token.paddingXXS` (which does compute to 4). But `index.css` has:

```css
.ant-input-affix-wrapper .ant-input-prefix {
  margin-inline-end: 8px !important;
}
```

This app-level override wins at runtime, so the real gap is **8px** (Spacing 2), not antd's own 4px default. The lesson: after computing a value from antd's token source, **always also grep `src/index.css`** for a selector targeting that same component/property (`.ant-input-*`, `.ant-btn-*`, etc.) before trusting the antd-only derivation — this app has several such overrides (see the icon-color rules a few lines below this one in the same file) and any of them can silently supersede the "official" computed default.

## Radius must be bound to a variable too — same rule as padding/gap/color

`borderRadius` follows the exact same discipline as Spacing/Border/Color in this file — it is **not** optional or "close enough as a literal." Every corner radius on a node with a real Radius-scale equivalent (XS=2, SM=4, Base=6, LG=8, XL=12, Pill=999 — see CLAUDE.md's "## Radius" table and the `Radius` variable collection in this Figma file) must be bound via `setBoundVariable`, on **all four corners individually** — there is no single `cornerRadius` variable-binding shortcut:

```javascript
const radiusVar = /* look up e.g. "Radius Base" (6px) from the Radius collection */;
node.setBoundVariable('topLeftRadius', radiusVar);
node.setBoundVariable('topRightRadius', radiusVar);
node.setBoundVariable('bottomLeftRadius', radiusVar);
node.setBoundVariable('bottomRightRadius', radiusVar);
```

Setting a plain `node.cornerRadius = 6` gets the right pixel value on screen but leaves it unbound — indistinguishable from a hardcoded literal to anyone auditing the file later, and it won't update if the Radius scale ever changes. Check any node you've already built (inputs, buttons, cards) for this — a numerically-correct-but-unbound radius is the same category of bug as the unbound `paddingLeft`/`paddingRight` caught earlier in this file.

## Bind text to the real text styles — never raw fontSize/fontName

This file already has 8 text styles built in Foundations (Heading 1–5, Body Large, Body, Body Small — see CLAUDE.md's typography scale). Any text node whose size matches one of them **must be bound via `textStyleId`**, not built with a manual `fontName`/`fontSize` pair:

```javascript
// WRONG — numerically correct but unbound, same category of bug as unbound padding/radius
const t = figma.createText();
t.fontName = { family: 'Google Sans Flex', style: 'Regular' };
t.fontSize = 14;

// CORRECT — bind the style itself
const bodyStyle = (await figma.getLocalTextStylesAsync()).find(s => s.name === 'Body');
await figma.loadFontAsync(bodyStyle.fontName);
t.textStyleId = bodyStyle.id;
```

`textStyleId` only controls font family/weight/size/line-height/letter-spacing — `fills`, `textAlignHorizontal`, and other properties are unaffected and can still be set independently after applying the style.

This was missed for an entire screen build (Members): every text node across both Members screens was built with raw `fontSize`/`fontName` instead of the real styles. Fixing it after the fact also surfaced a second bug — several nodes (table header labels, status tags, pagination) had been guessed at 13px with no real source basis, when the app actually uses plain `token.fontSize` (14px, i.e. the `Body` style) in all of those places. Binding to the real style is also a forcing function to get the *size* right, not just to make the value traceable — a guessed size is much more likely to survive unnoticed as a bare literal than as a style binding, since applying a style forces picking one of the 8 real values instead of typing whatever number seems close.

**Sizes with no scale equivalent stay literal, same exception as Spacing/Radius.** E.g. the sidebar workspace name and header breadcrumb are `15px SemiBold` in the real app (an inline literal in `AppLayout.tsx`, not one of the 8 documented sizes) — leave these as plain `fontSize`/`fontName`, don't force them onto the nearest style.

## Screen frame size: always 1440 × 1024

Every top-level screen frame built for IFix (Sign In, Forgot Password, Reset Password, Set Password, and any future page) must be created at **1440 × 1024**, not an arbitrary or content-hugging size. This is a fixed viewport convention for this project's Figma screens, independent of how much content a given screen actually has.

```javascript
const screen = figma.createFrame();
screen.resize(1440, 1024);
screen.primaryAxisSizingMode = 'FIXED';
screen.counterAxisSizingMode = 'FIXED';
```

If a screen's content (e.g. a centered auth form) doesn't fill the frame, center it within the full 1440×1024 canvas — don't shrink the frame to fit the content. Check any already-built screen against this before treating it as final; the first Sign In trial screen was built at 1024×700 and needs to be resized to match.

## Alpha-tinted variable-bound fills need a two-step assignment

`figma.variables.setBoundVariableForPaint({ type: 'SOLID', opacity: X, color: {...} }, 'color', colorVar)` **silently drops the `opacity`** on the first assignment to `node.fills`/`node.strokes` — the binding takes, but the paint renders fully opaque regardless of what `opacity` was passed in, in any position in the object literal. This showed up building Alert boxes (a `colorSuccess`-tinted background meant to render at 12% opacity instead rendered as a solid block, hiding the icon inside it — the alert cannot be visually diagnosed with a full-page screenshot at reduced resolution; it needs a per-node check).

**Fix: assign the bound paint once first, then re-read it from the node and reassign with opacity forced.** The first assignment establishes the variable binding; the second, plain reassignment is what makes the opacity stick:

```javascript
// WRONG — opacity is lost, renders fully opaque
node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', opacity: 0.12, color: {r:0,g:0,b:0} }, 'color', colorVar)];

// CORRECT — two-step: bind first, then reassign with opacity
node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: {r:0,g:0,b:0} }, 'color', colorVar)];
node.fills = node.fills.map(f => ({ ...f, opacity: 0.12 }));
```

Same applies to `strokes`. This is a real Plugin API quirk, not a project convention — but every semantic-colored tinted surface in this file (Alert boxes, the sidebar's selected-menu-item highlight) needs it, so treat "opacity on a bound paint" as always requiring the two-step pattern.

## Auto-layout hug: set BOTH sizing-mode axes, not just the one you're thinking about

`primaryAxisSizingMode = 'AUTO'` only controls the axis matching `layoutMode` (width for `HORIZONTAL`, height for `VERTICAL`) — the *other* axis (`counterAxisSizingMode`) stays at whatever `resize()` last set it to (typically `FIXED` at the placeholder height/width) unless set explicitly. Building an Alert box that should hug its content in both directions — `layoutSizingHorizontal: 'FILL'` (width fills the 360px content column) plus content-hugging height — silently rendered as a collapsed 10px-tall bar because only `primaryAxisSizingMode` was set to `AUTO`; `counterAxisSizingMode` was never touched and stayed `FIXED` from the initial `resize(360, 10)` placeholder call.

When a frame needs to hug content on an axis, set that axis's sizing mode explicitly regardless of which one is "primary" for its `layoutMode` — don't assume setting one covers both:

```javascript
alert.layoutMode = 'HORIZONTAL';
alert.resize(360, 10);
alert.primaryAxisSizingMode = 'AUTO';    // controls width (primary, since HORIZONTAL)
alert.counterAxisSizingMode = 'AUTO';    // controls height (counter axis) — easy to forget, and FILL on the other axis doesn't imply this
content.appendChild(alert);
alert.layoutSizingHorizontal = 'FILL';   // width overridden to fill the parent instead of hugging — fine, independent of the height fix above
```

## colorBgLayout vs colorBgContainer — check which one a real user actually sees

Don't assume a screen's root frame is `colorBgLayout` just because it's "the whole page." This app has an extra layer real users never see: `DesktopStageLayout.tsx` wraps every route (except `/design-docs`) in a **desktop-simulator backdrop** — a dot-grid canvas painted `colorBgLayout`, purely dev-tool/prototype chrome for browsing the app in a resizable "window." The actual page content (`<Outlet>`, i.e. whatever the route renders) sits *inside* that simulated window, on the window's own background: `colorBgContainer` (`#0a0a0a` for neutral — not pure black).

This caused a real bug: all 7 auth screens (Sign In, Forgot/Reset Password, Set Password) were built with their root frame bound to `Background/colorBgLayout`, modeling them as "the whole simulated desktop" instead of "the window content" — the wrong layer. Fixed by rebinding all 7 to `Background/colorBgContainer`.

**How to tell which one applies to a given screen:**
- **Has its own app-shell chrome that shows the true page canvas around it** (e.g. Members' `AppLayout` — a transparent `Sider` revealing the canvas behind it, with a separate bordered "Main" wrapper on top) → the screen's own outer frame is genuinely `colorBgLayout` (correct as built), and only the inner wrapper card is `colorBgContainer`.
- **No app shell of its own — auth pages, or anything else rendered directly as `DesktopStageLayout`'s `<Outlet>` content** → the screen's root frame is `colorBgContainer`, full stop. There is no `colorBgLayout` moment for these at all in the real app; that token only exists one layer further out, in chrome this project's Figma screens don't (and shouldn't) reproduce.

When building a new screen, check `router/index.tsx` and whatever layout component actually wraps that route before assuming which background applies — don't default to `colorBgLayout` just because a screen looks "full page."

## Recurring bug pattern: numerically-correct-but-unbound values

This same category of bug has shown up independently for padding, radius, icon color, and text styles (see the sections above) — a value that renders pixel-correct on screen but was set as a bare literal instead of bound to the token/style that actually governs it. Each occurrence was individually easy to miss, because the screenshot looks right — the only way to catch it is to specifically check bindings, not visuals.

**Before considering any screen build "done," audit it — don't just screenshot-check it:**

- **Padding/gap** — every `padding*`/`itemSpacing` should show up in `node.boundVariables`, not just have the right numeric value. (See "Don't guess padding/gap" above.)
- **Radius** — every `topLeftRadius`/`topRightRadius`/`bottomLeftRadius`/`bottomRightRadius` bound individually, not a bare `cornerRadius = 6`.
- **Color** — every fill/stroke bound via `setBoundVariableForPaint`, never a literal `{r,g,b}` that happens to match.
- **Text** — every text node whose size matches one of the 8 Foundations styles bound via `textStyleId`, not a manual `fontName`/`fontSize` pair.

A quick script to check any of these is cheap — e.g. `node.findAll(n => 'boundVariables' in n).filter(n => !n.boundVariables?.paddingTop && n.paddingTop)` for padding, or checking `n.textStyleId === ''` on text nodes with a scale-matching size. Run a check like this across a screen's full node tree as a final step, the same way `get_screenshot` is used to catch visual issues — an unbound value has no visual signature, so screenshot review alone will never catch it.

## Reference

See `figma-use`'s `variable-patterns.md` for the full `setBoundVariable`/`setBoundVariableForPaint` API surface, and `gotchas.md` for other sizing-mode pitfalls (e.g. `FILL` must be set *after* `appendChild`, which is the same family of bug as the `resize()` ordering issue above).
