import { normalizeGenre } from './genre_aliases'

describe('normalizeGenre', () => {
  it('should capitalise the first letter', () => {
    expect(normalizeGenre('reportaż')).toBe('Reportaż')
    expect(normalizeGenre('literatura piękna')).toBe('Literatura piękna')
  })

  it('should leave an already canonical name alone', () => {
    expect(normalizeGenre('Reportaż')).toBe('Reportaż')
  })

  it('should trim surrounding whitespace', () => {
    expect(normalizeGenre('  horror  ')).toBe('Horror')
  })

  it('should resolve a renamed category through the alias map', () => {
    expect(normalizeGenre('fantasy, science fiction')).toBe(
      'Fantastyka, fantasy, science fiction'
    )
  })

  it('should resolve an alias regardless of casing', () => {
    expect(normalizeGenre('Fantasy, science fiction')).toBe(
      'Fantastyka, fantasy, science fiction'
    )
    expect(normalizeGenre(' FANTASY, SCIENCE FICTION ')).toBe(
      'Fantastyka, fantasy, science fiction'
    )
  })

  it('should keep a category it has never seen, only capitalised', () => {
    expect(normalizeGenre('gry i zabawy')).toBe('Gry i zabawy')
  })

  it('should collapse casing variants onto the same name', () => {
    expect(normalizeGenre('klasyka')).toBe(normalizeGenre('Klasyka'))
  })

  it('should return an empty string when there is nothing to normalise', () => {
    expect(normalizeGenre('')).toBe('')
    expect(normalizeGenre('   ')).toBe('')
  })
})
