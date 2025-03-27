/*
  Warnings:

  - Added the required column `precio` to the `Medicamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreCliente` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefonoCliente` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioUnitario` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "EstadoReserva" ADD VALUE 'COMPLETADA';

-- AlterEnum
ALTER TYPE "MovimientoTipo" ADD VALUE 'AJUSTE';

-- AlterTable
ALTER TABLE "Medicamento" ADD COLUMN     "precio" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "nombreCliente" TEXT NOT NULL,
ADD COLUMN     "telefonoCliente" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "precioUnitario" DECIMAL(10,2) NOT NULL;
