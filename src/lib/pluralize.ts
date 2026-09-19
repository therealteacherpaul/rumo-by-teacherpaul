/** Count labels in Portuguese: zero uses the plural form. */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
