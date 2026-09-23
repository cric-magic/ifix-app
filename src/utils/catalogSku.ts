import type { ProductType } from '../types/product'

// Words that carry no identifying information in a model name.
const NOISE_WORDS = new Set(['GEN', 'GENERATION', 'EDITION', 'SERIES', 'THE'])

// "5th" / "2nd" -> "5" / "2"; leaves "M2" and "S23" intact.
function stripOrdinal(token: string): string {
  return /^\d+(ST|ND|RD|TH)$/.test(token) ? token.replace(/(ST|ND|RD|TH)$/, '') : token
}

// Model tokens: the first word contributes two letters, later words one
// each, and anything carrying digits is kept whole. "iPhone 14 Pro" becomes
// IP + 14 + P.
//
// This defines the standard going forward rather than reproducing the
// hand-written codes already in the merchant seed data — those were written
// by eye and aren't internally consistent (iPhone abbreviated to IP but iPad
// to IPAD, MacBook to MB but AirPods to AP), so no single rule reproduces
// them all. Existing merchant SKUs keep whatever code they already have.
function modelToken(model: string): string {
  // "+" is a model name in its own right (Galaxy S25 vs S25+), not
  // punctuation — splitting it away made both models GAS25 and their SKUs
  // collide wherever they share a storage and colour. Spelt as a Plus word
  // first so it contributes a P like any other trailing word.
  const words = model.toUpperCase().replace(/\+/g, ' PLUS ').split(/[^A-Z0-9]+/).filter(Boolean)
  return words
    .map(stripOrdinal)
    .filter(w => !NOISE_WORDS.has(w))
    .map((word, i) => {
      if (/\d/.test(word)) return word
      return i === 0 ? word.slice(0, 2) : word.slice(0, 1)
    })
    .join('')
}

// "128GB" -> "128", "1TB" -> "1TB". Gigabytes are the common case and the
// unit adds nothing; terabytes keep it so 1TB can't read as 1GB.
function storageToken(storage?: string): string | null {
  if (!storage) return null
  const gb = storage.toUpperCase().match(/^(\d+)GB$/)
  return gb ? gb[1] : storage.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Initial of each word, extended from the final word until it reaches three
// characters — so "Space Black" and "Phantom Black" stay distinguishable
// (SBL vs PBL) where a naive "first three of the last word" would collapse
// both to BLA.
function colorToken(color: string): string {
  const words = color.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
  if (words.length === 0) return ''
  let token = words.map(w => w[0]).join('')
  const last = words[words.length - 1]
  for (let i = 1; token.length < 3 && i < last.length; i++) token += last[i]
  return token.slice(0, 4)
}

// The standard catalog SKU code: model, storage, colour, and a -U suffix for
// used stock. Callers preview this live while the form is filled and may
// overwrite it before saving, so it's a starting point rather than a
// guarantee — uniqueness is enforced on the field itself.
export function generateCatalogSkuCode(input: {
  model: string
  storage?: string
  color: string
  type: ProductType
}): string {
  const parts = [modelToken(input.model), storageToken(input.storage), colorToken(input.color)]
    .filter((p): p is string => !!p)
  const base = parts.join('-')
  return input.type === 'used' ? `${base}-U` : base
}
