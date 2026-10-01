function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

// Illustrative-only figures derived deterministically from the user id.
// Only for accounts that have activated — one still in `created` has never
// signed in, so it has no contracts or collections (see UserTable).
export function mockCreatedContracts(userId: string): number {
  return hash(userId + 'contracts') % 24
}

export function mockMonthlyCollection(userId: string): number {
  return (hash(userId + 'collection') % 180 + 20) * 1000
}
