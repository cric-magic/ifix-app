interface Props {
  // Supplied by Form.Item, or passed directly (Price Check's quote).
  value?: number
  onChange?: (months: number) => void
  months: number[]
}

// A payment term as a set of chips ("3 mo", "6 mo", "12 mo"…) — every
// choice on screen and one tap away. Shared by Price Check's quote and the
// contract's Template & Terms step, so the two read the same.
//
// Separate chips that wrap, not a segmented bar: a template can offer any
// number of terms, and a bar squeezes them all into one row (six on a
// phone truncated to "12 …"). Each chip keeps its full padding and the row
// simply wraps. The picked one takes the primary border, like the Branch
// step's choice cards (.ifix-choice-card). Nothing shows as picked until a
// term is chosen.
export function TermChips({ value, onChange, months }: Props) {
  return (
    <div role="radiogroup" className="ifix-term-chips">
      {months.map(m => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={m === value}
          className="ifix-term-chip"
          data-selected={m === value || undefined}
          onClick={() => onChange?.(m)}
        >
          {m} mo
        </button>
      ))}
    </div>
  )
}
