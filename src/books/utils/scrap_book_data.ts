/* Scrap book data from lubimyczytac.pl */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { BookEntity } from '../entities/book.entity'

export interface URLdata
  extends Pick<BookEntity, 'ISBN' | 'lcId' | 'pages' | 'title' | 'imgUrl'> {
  authors: string[]
  genre: string
}

async function getURLbody(url: string): Promise<string> {
  try {
    const res = await axios.get(url, { responseType: 'document' })

    return res.data
  } catch (e: any) {
    // Keep the actual reason in the message. Swallowing it here used to leave
    // the body undefined, which then blew up inside cheerio instead.
    const reason = e.response
      ? `HTTP ${e.response.status}`
      : (e.cause?.message ?? e.message ?? 'unknown error')

    throw new Error(`Failed to fetch ${url}: ${reason}`)
  }
}

export default async function scrapBookData(url: string): Promise<URLdata> {
  const urlBody = await getURLbody(url)
  const $ = cheerio.load(urlBody)

  // Authors sit in the book header, as one anchor each. Scoping to .author
  // matters: the page links ~50 other authors from the sidebar recommendations.
  const authors = $('.author a')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((name) => name.length > 0)

  const bookData: URLdata = {
    lcId: Number($('button.btn-rate').attr('data-bookid')),
    title: $('h1.book__title').text().trim(),
    authors,
    genre: $('a.book__category').text(),
    pages: Number(
      $('#book-details dl dt:contains("Liczba stron:")').next().text()
    ),
    ISBN: $('meta[property="books:isbn"]').attr('content') || null,
    imgUrl: $('#js-lightboxCover').attr('href') || ''
  }

  return bookData
}
