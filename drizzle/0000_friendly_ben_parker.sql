CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nestBoxId` int NOT NULL,
	`userId` int NOT NULL,
	`fecha` timestamp NOT NULL,
	`ocupada` int NOT NULL,
	`especie` varchar(50),
	`numHuevos` int DEFAULT 0,
	`numPollos` int DEFAULT 0,
	`estadoConservacion` enum('bueno','necesita_reparacion','caida'),
	`observaciones` text,
	`multimediaUrls` json DEFAULT (JSON_ARRAY()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multimedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`url` varchar(512) NOT NULL,
	`tipo` enum('foto','audio') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multimedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nestBoxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cajaId` varchar(64) NOT NULL,
	`instalacion` varchar(255) NOT NULL,
	`tipoCaja` varchar(100) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`estadoActual` enum('ocupada','vacia','desconocido') NOT NULL DEFAULT 'desconocido',
	`ultimaEspecie` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nestBoxes_id` PRIMARY KEY(`id`),
	CONSTRAINT `nestBoxes_cajaId_unique` UNIQUE(`cajaId`)
);

