import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const author1 = await prisma.authors.create({
    data: {
      name: 'Stephen King'
    }
  })
  const author2 = await prisma.authors.create({
    data: {
      name: 'Jan  Kowalski'
    }
  })

  const genre1 = await prisma.genres.create({
    data: {
      name: 'Horror'
    }
  })
  const genre2 = await prisma.genres.create({
    data: {
      name: 'Fantasy'
    }
  })

  const shelf1 = await prisma.shelves.create({
    data: {
      name: 'Przeczytane',
      pages: 0
    }
  })
  const shelf2 = await prisma.shelves.create({
    data: {
      name: '2023',
      pages: 0
    }
  })

  const book1 = await prisma.books.create({
    data: {
      ISBN: '234234234',
      lcId: 432,
      pages: 230,
      rating: 5,
      title: 'Taka tam ksiazka',
      url: 'lcz.pl',
      genreId: genre1.id,
      imgUrl: 'placeholder'
    }
  })
  const book2 = await prisma.books.create({
    data: {
      ISBN: '646454',
      lcId: 64,
      pages: 345,
      rating: 2,
      title: 'Taka tam ksiazka 2',
      url: 'lcz.pl',
      genreId: genre2.id,
      imgUrl: 'placeholder'
    }
  })
  const book3 = await prisma.books.create({
    data: {
      ISBN: '6575675',
      lcId: 677,
      pages: 450,
      rating: 8,
      title: 'Asd asd',
      url: 'lcz.pl',
      genreId: genre1.id,
      imgUrl: 'placeholder'
    }
  })
  const book4 = await prisma.books.create({
    data: {
      ISBN: '879797',
      lcId: 890,
      pages: 670,
      rating: 5,
      title: 'Asd asd 2',
      url: 'lcz.pl',
      genreId: genre2.id,
      imgUrl: 'placeholder'
    }
  })

  await prisma.authorsBooks.createMany({
    data: [
      {
        bookId: book1.id,
        authorId: author1.id
      },
      {
        bookId: book2.id,
        authorId: author2.id
      },
      {
        bookId: book3.id,
        authorId: author1.id
      },
      {
        bookId: book4.id,
        authorId: author2.id
      },
      {
        bookId: book1.id,
        authorId: author2.id
      }
    ]
  })

  await prisma.booksOnShelves.createMany({
    data: [
      {
        bookId: book1.id,
        shelfId: shelf1.id
      },
      {
        bookId: book2.id,
        shelfId: shelf1.id
      },
      {
        bookId: book3.id,
        shelfId: shelf1.id
      },
      {
        bookId: book4.id,
        shelfId: shelf1.id
      },
      {
        bookId: book2.id,
        shelfId: shelf2.id
      },
      {
        bookId: book4.id,
        shelfId: shelf2.id
      }
    ]
  })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
