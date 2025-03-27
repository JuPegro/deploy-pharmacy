-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'FARMACIA');

-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('INGRESO', 'SALIDA');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmacia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Farmacia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "farmaciaId" TEXT NOT NULL,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicamentoId" TEXT NOT NULL,
    "farmaciaId" TEXT NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devolucion" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "farmaciaId" TEXT NOT NULL,

    CONSTRAINT "Devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "tipo" "MovimientoTipo" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicamentoId" TEXT NOT NULL,
    "farmaciaId" TEXT NOT NULL,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoReserva" NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "farmaciaId" TEXT NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UsuarioFarmacia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UsuarioFarmacia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "_UsuarioFarmacia_B_index" ON "_UsuarioFarmacia"("B");

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_farmaciaId_fkey" FOREIGN KEY ("farmaciaId") REFERENCES "Farmacia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioFarmacia" ADD CONSTRAINT "_UsuarioFarmacia_A_fkey" FOREIGN KEY ("A") REFERENCES "Farmacia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioFarmacia" ADD CONSTRAINT "_UsuarioFarmacia_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
