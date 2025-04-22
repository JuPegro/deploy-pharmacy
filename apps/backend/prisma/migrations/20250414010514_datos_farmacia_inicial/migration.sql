/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Medicamento` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mes` to the `Devolucion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo` to the `Medicamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mes` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoDevolucion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "Devolucion" ADD COLUMN     "anio" INTEGER NOT NULL DEFAULT 2024,
ADD COLUMN     "aprobadoPorId" TEXT,
ADD COLUMN     "estado" "EstadoDevolucion" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaAprobacion" TIMESTAMP(3),
ADD COLUMN     "mes" INTEGER NOT NULL,
ADD COLUMN     "motivoRechazo" TEXT,
ADD COLUMN     "usuarioId" TEXT,
ALTER COLUMN "fecha" SET DEFAULT (CURRENT_DATE + INTERVAL '0 year');

-- AlterTable
ALTER TABLE "Medicamento" ADD COLUMN     "codigo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "observacion" TEXT;

-- AlterTable
ALTER TABLE "SugerenciaInventario" ADD COLUMN     "editadoPorFarmacia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usuarioEditorId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "farmaciaActivaId" TEXT;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "anio" INTEGER NOT NULL DEFAULT 2024,
ADD COLUMN     "mes" INTEGER NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT (CURRENT_DATE + INTERVAL '0 year');

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_codigo_key" ON "Medicamento"("codigo");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_farmaciaActivaId_fkey" FOREIGN KEY ("farmaciaActivaId") REFERENCES "Farmacia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
