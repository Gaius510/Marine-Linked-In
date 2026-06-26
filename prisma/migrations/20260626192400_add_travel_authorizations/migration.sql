-- CreateTable
CREATE TABLE "TravelAuthorization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seafarerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customType" TEXT,
    "countryCode" TEXT,
    "documentNumber" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "notes" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TravelAuthorization_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TravelAuthorization_seafarerId_idx" ON "TravelAuthorization"("seafarerId");

-- CreateIndex
CREATE INDEX "TravelAuthorization_type_idx" ON "TravelAuthorization"("type");

-- CreateIndex
CREATE INDEX "TravelAuthorization_expiresAt_idx" ON "TravelAuthorization"("expiresAt");

