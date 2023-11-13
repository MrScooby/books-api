/*
  Warnings:

  - You are about to drop the `BooksOnShelfs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BooksOnShelfs" DROP CONSTRAINT "BooksOnShelfs_bookId_fkey";

-- DropForeignKey
ALTER TABLE "BooksOnShelfs" DROP CONSTRAINT "BooksOnShelfs_shelfId_fkey";

-- DropTable
DROP TABLE "BooksOnShelfs";

-- CreateTable
CREATE TABLE "BooksOnShelves" (
    "bookId" INTEGER NOT NULL,
    "shelfId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BooksOnShelves_pkey" PRIMARY KEY ("bookId","shelfId")
);

-- AddForeignKey
ALTER TABLE "BooksOnShelves" ADD CONSTRAINT "BooksOnShelves_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BooksOnShelves" ADD CONSTRAINT "BooksOnShelves_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
