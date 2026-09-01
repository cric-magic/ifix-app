// DiceBear avatars (https://www.dicebear.com) — deterministic per seed, so
// the same user/workspace always gets the same image without us storing an
// actual file. Antd's Avatar falls back to its own `icon` prop automatically
// if either URL ever fails to load.

// Glyphs, Duotone preset (https://www.dicebear.com/styles/glyphs/presets/)
// for people — a single glyph color per avatar (deep teal, #0f3d38) so mark
// and ground share one hue and only the shape/seed varies.
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(seed)}&glyphColor=0f3d38`
}

// Identicon, Duotone preset (https://www.dicebear.com/styles/identicon/presets/)
// for workspaces — one indigo grid on a pale indigo ground, visually
// distinct from the people-facing Glyphs style so the two never get
// confused for each other at a glance.
export function getWorkspaceAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=dfe3f5&rowColor=3d4272`
}
