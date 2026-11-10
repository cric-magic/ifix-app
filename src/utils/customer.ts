// A person's name as shown everywhere — lists, headers, the printed
// contract: first name then last name. Stored as two fields (they're
// separate on a Thai ID card and in credit-bureau records); this is the one
// place they're joined back together.
export function customerName(person: { firstName: string; lastName: string }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}
