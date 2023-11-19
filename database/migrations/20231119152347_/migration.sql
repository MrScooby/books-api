/*
  Warnings:

  - Added the required column `imgUrl` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "imgUrl" TEXT NOT NULL;
