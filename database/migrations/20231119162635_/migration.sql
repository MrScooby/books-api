/*
  Warnings:

  - You are about to drop the `BooksAuthors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BooksAuthors" DROP CONSTRAINT "BooksAuthors_authorId_fkey";

-- DropForeignKey
ALTER TABLE "BooksAuthors" DROP CONSTRAINT "BooksAuthors_bookId_fkey";

-- DropTable
DROP TABLE "BooksAuthors";

-- CreateTable
CREATE TABLE "AuthorsBooks" (
    "bookId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorsBooks_pkey" PRIMARY KEY ("bookId","authorId")
);

-- AddForeignKey
ALTER TABLE "AuthorsBooks" ADD CONSTRAINT "AuthorsBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorsBooks" ADD CONSTRAINT "AuthorsBooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
