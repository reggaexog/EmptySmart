-- CreateTable
CREATE TABLE `Kukas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalonev` VARCHAR(191) NULL,
    `jelszo` VARCHAR(191) NULL,
    `kiurtes_szam` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kuka` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `allapot` INTEGER NULL,
    `legutobbi_urites` DATETIME(3) NULL,
    `location_x` VARCHAR(191) NULL,
    `location_y` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Felhasznalo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalonev` VARCHAR(191) NULL,
    `jelszo` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jelzesek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kukaId` INTEGER NULL,
    `jelzes_datum` DATETIME(3) NULL,
    `felhasznaloId` INTEGER NULL,

    UNIQUE INDEX `Jelzesek_kukaId_key`(`kukaId`),
    UNIQUE INDEX `Jelzesek_felhasznaloId_key`(`felhasznaloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KukaUritesek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kukasId` INTEGER NULL,
    `kukaId` INTEGER NULL,
    `kiurites_datum` DATETIME(3) NULL,

    UNIQUE INDEX `KukaUritesek_kukasId_key`(`kukasId`),
    UNIQUE INDEX `KukaUritesek_kukaId_key`(`kukaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Jelzesek` ADD CONSTRAINT `Jelzesek_kukaId_fkey` FOREIGN KEY (`kukaId`) REFERENCES `Kuka`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jelzesek` ADD CONSTRAINT `Jelzesek_felhasznaloId_fkey` FOREIGN KEY (`felhasznaloId`) REFERENCES `Felhasznalo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KukaUritesek` ADD CONSTRAINT `KukaUritesek_kukasId_fkey` FOREIGN KEY (`kukasId`) REFERENCES `Kukas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KukaUritesek` ADD CONSTRAINT `KukaUritesek_kukaId_fkey` FOREIGN KEY (`kukaId`) REFERENCES `Kuka`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
