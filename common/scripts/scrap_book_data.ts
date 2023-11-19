/* Scrap book data from lubimyczytac.pl */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { BookEntity } from 'src/books/entities/book.entity'

export interface URLdata
  extends Pick<BookEntity, 'ISBN' | 'lcId' | 'pages' | 'title' | 'imgUrl'> {
  authors: string[]
  genre: string
}

async function getURLbody(url: string): Promise<string> {
  try {
    const pageHtml = await axios
      .get(url, { responseType: 'document' })
      .then((res) => {
        return res.data
      })
      .catch((e) => {
        console.log('axios request failed. errors: ', e.cause.errors)
      })

    return pageHtml
  } catch (e) {
    throw new Error('Axios request failed. CHeck if URL is correct.')
  }
}

export default async function scrapBookData(url: string): Promise<URLdata> {
  const urlBody = await getURLbody(url)
  const $ = cheerio.load(urlBody)

  const authors = []

  $('a.link-name').each((index, value) => {
    authors.push((value.children[0] as unknown as Text).data)
  })

  const bookData: URLdata = {
    lcId: Number($('button.btn-rate').attr('data-bookid')),
    title: $('h1.book__title').text().substring(1).trim(),
    authors: authors,
    genre: $('a.book__category').text(),
    pages: Number(
      $('#book-details dl dt:contains("Liczba stron:")').next().text()
    ),
    ISBN: $('meta[property="books:isbn"]').attr('content'),
    imgUrl: $('#js-lightboxCover').attr('href')
  }

  return bookData
}
