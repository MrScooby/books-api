import axios from 'axios'
import scrapBookData from './scrap_book_data'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

// Trimmed-down copy of a real lubimyczytac.pl book page. The sidebar anchor is
// what makes the .author scoping necessary: the live page carries ~50 of those.
const pageHtml = `
<html><body>
  <h1 class="book__title"> Lot na Amalteę. Stażyści </h1>
  <span class="author pb-2">
    <a class="dashBoardActivity__singleInfoBookAuthor" href="https://lubimyczytac.pl/autor/3326/arkadij-strugacki">Arkadij Strugacki</a>,&nbsp;
    <a class="dashBoardActivity__singleInfoBookAuthor" href="https://lubimyczytac.pl/autor/3905/borys-strugacki">Borys Strugacki</a>
  </span>
  <button class="btn-rate" data-bookid="102826"></button>
  <a class="book__category"> fantasy, science fiction </a>
  <div id="book-details"><dl><dt>Liczba stron:</dt><dd>272</dd></dl></div>
  <meta property="books:isbn" content="9788375105926">
  <a id="js-lightboxCover" href="https://s.lubimyczytac.pl/cover.jpg"></a>

  <div class="recommendations">
    <a href="https://lubimyczytac.pl/autor/999/inny-autor">Inny Autor</a>
  </div>
</body></html>
`

describe('scrapBookData', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should scrape every author from the book header', async () => {
    mockedAxios.get.mockResolvedValue({ data: pageHtml })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.authors).toEqual(['Arkadij Strugacki', 'Borys Strugacki'])
  })

  it('should ignore author links outside the book header', async () => {
    mockedAxios.get.mockResolvedValue({ data: pageHtml })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.authors).not.toContain('Inny Autor')
  })

  it('should scrape the remaining fields', async () => {
    mockedAxios.get.mockResolvedValue({ data: pageHtml })

    const data = await scrapBookData('http://lc.test/book')

    expect(data).toEqual({
      lcId: 102826,
      title: 'Lot na Amalteę. Stażyści',
      authors: ['Arkadij Strugacki', 'Borys Strugacki'],
      genre: 'Fantastyka, fantasy, science fiction',
      pages: 272,
      ISBN: '9788375105926',
      imgUrl: 'https://s.lubimyczytac.pl/cover.jpg'
    })
  })

  // " horror " and "horror" are two different rows under the unique constraint
  // on Genres.name, so the genre goes through normalizeGenre.
  it('should normalise the genre', async () => {
    mockedAxios.get.mockResolvedValue({ data: pageHtml })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.genre).toBe('Fantastyka, fantasy, science fiction')
  })

  it('should capitalise a genre that has no alias', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<a class="book__category"> reportaż </a>'
    })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.genre).toBe('Reportaż')
  })

  it('should keep the whole title when it has no leading whitespace', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<h1 class="book__title">Solaris</h1>'
    })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.title).toBe('Solaris')
  })

  it('should return no authors when the header markup changes', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<h1 class="book__title">Solaris</h1><a class="link-name">Stanisław Lem</a>'
    })

    const data = await scrapBookData('http://lc.test/book')

    expect(data.authors).toEqual([])
  })

  it('should report the status code when the page responds with an error', async () => {
    mockedAxios.get.mockRejectedValue({ response: { status: 404 } })

    await expect(scrapBookData('http://lc.test/missing')).rejects.toThrow(
      'Failed to fetch http://lc.test/missing: HTTP 404'
    )
  })

  it('should report the underlying reason when the request never lands', async () => {
    mockedAxios.get.mockRejectedValue({
      message: 'connect ECONNREFUSED',
      cause: { message: 'getaddrinfo ENOTFOUND lc.test' }
    })

    await expect(scrapBookData('http://lc.test/book')).rejects.toThrow(
      'getaddrinfo ENOTFOUND lc.test'
    )
  })
})
