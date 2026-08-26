// DiceBear avatars (https://www.dicebear.com) — deterministic per seed, so
// the same user/workspace always gets the same image without us storing an
// actual file. Antd's Avatar falls back to its own `icon` prop automatically
// if either URL ever fails to load.

// Adventurer Neutral (https://www.dicebear.com/styles/adventurer-neutral/) for people.
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(seed)}`
}

// Identicon (https://www.dicebear.com/styles/identicon/) for workspaces —
// visually distinct from the people-facing adventurer-neutral style so the
// two never get confused for each other at a glance.
export function getWorkspaceAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`
}
