-- CreateTable
CREATE TABLE "SugerenciaInventario" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "stockActual" INTEGER NOT NULL,
    "ventasDiarias" DOUBLE PRECISION NOT NULL,
    "demandaProyectada" INTEGER NOT NULL,
    "diasSinVenta" INTEGER NOT NULL,
    "recomendacion" TEXT NOT NULL,

    CONSTRAINT "SugerenciaInventario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SugerenciaInventario" ADD CONSTRAINT "SugerenciaInventario_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
