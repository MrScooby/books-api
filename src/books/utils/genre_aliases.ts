/*
 * Canonical genre names.
 *
 * lubimyczytac.pl renders its categories in lower case and has renamed some of
 * them over the years, so scraping them verbatim fragmented Genres.name: the
 * database ended up holding "Reportaż" next to "reportaż", and
 * "Fantastyka, fantasy, science fiction" next to "Fantasy, science fiction",
 * each with its own slice of the collection. Genres.name is unique and
 * case-sensitive, so those really are separate genres as far as the schema is
 * concerned.
 *
 * Everything that reaches the database goes through normalizeGenre(), which
 * capitalises the first letter — matching how the genres have always been shown
 * in the app — and resolves renames through GENRE_ALIASES.
 */

// Keys are lower case; look-ups are case-insensitive. Only genuine renames
// belong here — plain casing differences are handled by the capitalisation rule
// below, so there is nothing to add when a new category shows up.
export const GENRE_ALIASES: Record<string, string> = {
  'fantasy, science fiction': 'Fantastyka, fantasy, science fiction'
}

export function normalizeGenre(raw: string): string {
  const trimmed = raw.trim()

  if (!trimmed) {
    return ''
  }

  const alias = GENRE_ALIASES[trimmed.toLowerCase()]

  if (alias) {
    return alias
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}
