/*
  Warnings:

  - You are about to drop the column `medicamentoId` on the `Devolucion` table. All the data in the column will be lost.
  - You are about to drop the column `farmaciaId` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `precio` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `vencimiento` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `medicamentoId` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `medicamentoId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `medicamentoId` on the `Venta` table. All the data in the column will be lost.
  - Added the required column `inventarioId` to the `Devolucion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventarioId` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventarioId` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventarioId` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Devolucion" DROP CONSTRAINT "Devolucion_medicamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Medicamento" DROP CONSTRAINT "Medicamento_farmaciaId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_medicamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_medicamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_medicamentoId_fkey";

-- AlterTable
ALTER TABLE "Devolucion" DROP COLUMN "medicamentoId",
ADD COLUMN     "inventarioId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Medicamento" DROP COLUMN "farmaciaId",
DROP COLUMN "precio",
DROP COLUMN "stock",
DROP COLUMN "stockMinimo",
DROP COLUMN "vencimiento",
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "presentacion" TEXT,
ADD COLUMN     "principioActivo" TEXT,
ADD COLUMN     "requiereReceta" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MovimientoInventario" DROP COLUMN "medicamentoId",
ADD COLUMN     "inventarioId" TEXT NOT NULL,
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "medicamentoId",
ADD COLUMN     "inventarioId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "medicamentoId",
ADD COLUMN     "inventarioId" TEXT NOT NULL,
ADD COLUMN     "usuarioId" TEXT;

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "stockMinimo" INTEGER NOT NULL DEFAULT 10,
    "precio" DECIMAL(10,2) NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "farmaciaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_farmaciaId_medicamentoId_key" ON "Inventario"("farmaciaId", "medicamentoId");

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
