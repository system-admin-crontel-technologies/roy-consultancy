-- CreateTable
CREATE TABLE "gst_credentials" (
    "id" UUID NOT NULL,
    "clientName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordCiphertext" TEXT NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gst_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gst_credentials_clientName_idx" ON "gst_credentials"("clientName");
