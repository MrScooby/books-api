/*
  Warnings:

  - The primary key for the `Authors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AuthorsBooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Books` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `BooksOnShelves` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Genres` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Shelves` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AuthorsBooks" DROP CONSTRAINT "AuthorsBooks_authorId_fkey";

-- DropForeignKey
ALTER TABLE "AuthorsBooks" DROP CONSTRAINT "AuthorsBooks_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Books" DROP CONSTRAINT "Books_genreId_fkey";

-- DropForeignKey
ALTER TABLE "BooksOnShelves" DROP CONSTRAINT "BooksOnShelves_bookId_fkey";

-- DropForeignKey
ALTER TABLE "BooksOnShelves" DROP CONSTRAINT "BooksOnShelves_shelfId_fkey";

-- AlterTable
ALTER TABLE "Authors" DROP CONSTRAINT "Authors_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Authors_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Authors_id_seq";

-- AlterTable
ALTER TABLE "AuthorsBooks" DROP CONSTRAINT "AuthorsBooks_pkey",
ALTER COLUMN "bookId" SET DATA TYPE TEXT,
ALTER COLUMN "authorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AuthorsBooks_pkey" PRIMARY KEY ("bookId", "authorId");

-- AlterTable
ALTER TABLE "Books" DROP CONSTRAINT "Books_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "genreId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Books_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Books_id_seq";

-- AlterTable
ALTER TABLE "BooksOnShelves" DROP CONSTRAINT "BooksOnShelves_pkey",
ALTER COLUMN "bookId" SET DATA TYPE TEXT,
ALTER COLUMN "shelfId" SET DATA TYPE TEXT,
ADD CONSTRAINT "BooksOnShelves_pkey" PRIMARY KEY ("bookId", "shelfId");

-- AlterTable
ALTER TABLE "Genres" DROP CONSTRAINT "Genres_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Genres_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Genres_id_seq";

-- AlterTable
ALTER TABLE "Shelves" DROP CONSTRAINT "Shelves_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Shelves_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Shelves_id_seq";

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorsBooks" ADD CONSTRAINT "AuthorsBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorsBooks" ADD CONSTRAINT "AuthorsBooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BooksOnShelves" ADD CONSTRAINT "BooksOnShelves_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BooksOnShelves" ADD CONSTRAINT "BooksOnShelves_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
