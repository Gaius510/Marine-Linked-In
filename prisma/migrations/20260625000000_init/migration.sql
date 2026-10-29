-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SEAFARER',
    "company" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeafarerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rank" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "availableFrom" TEXT,
    "yearsExperience" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "cocGrade" TEXT,
    "cocExpiry" TEXT,
    "passportNo" TEXT,
    "passportExpiry" TEXT,
    "usVisa" TEXT,
    "schengenVisa" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeafarerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seafarerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT,
    "issuedDate" TEXT,
    "expiryDate" TEXT,
    "issuingAuthority" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VesselExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seafarerId" TEXT NOT NULL,
    "rank" TEXT,
    "vesselType" TEXT NOT NULL,
    "vesselName" TEXT,
    "companyName" TEXT,
    "imoNumber" TEXT,
    "grossTonnage" TEXT,
    "engineType" TEXT,
    "tradeArea" TEXT,
    "signOnDate" TEXT,
    "signOffDate" TEXT,
    "captainName" TEXT,
    "captainContact" TEXT,
    "chiefEngName" TEXT,
    "chiefEngContact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VesselExperience_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rank" TEXT,
    "vesselType" TEXT,
    "companyName" TEXT NOT NULL,
    "salaryMin" TEXT,
    "salaryMax" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contractDuration" TEXT,
    "joiningDate" TEXT,
    "location" TEXT,
    "description" TEXT,
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "coverLetter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedProfile_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedProfile_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "jobId" TEXT,
    "scheduledAt" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interview_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interview_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "SeafarerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SeafarerProfile_userId_key" ON "SeafarerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_seafarerId_key" ON "Application"("jobId", "seafarerId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProfile_recruiterId_seafarerId_key" ON "SavedProfile"("recruiterId", "seafarerId");
