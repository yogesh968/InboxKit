-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tilesCount" INTEGER NOT NULL DEFAULT 0,
    "lastCaptureAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tile" (
    "id" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "userId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TileHistory" (
    "id" TEXT NOT NULL,
    "tileId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TileHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_tilesCount_idx" ON "User"("tilesCount");

-- CreateIndex
CREATE INDEX "Tile_userId_idx" ON "Tile"("userId");

-- CreateIndex
CREATE INDEX "TileHistory_tileId_idx" ON "TileHistory"("tileId");

-- CreateIndex
CREATE INDEX "TileHistory_userId_idx" ON "TileHistory"("userId");

-- CreateIndex
CREATE INDEX "TileHistory_capturedAt_idx" ON "TileHistory"("capturedAt");

-- AddForeignKey
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TileHistory" ADD CONSTRAINT "TileHistory_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TileHistory" ADD CONSTRAINT "TileHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
