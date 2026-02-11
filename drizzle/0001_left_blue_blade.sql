CREATE TABLE `diary_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`content` longtext,
	`mood` enum('excellent','good','neutral','sad','terrible'),
	`moodIntensity` int,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diary_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habit_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habitId` int NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`notes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `habit_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7),
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isActive` int NOT NULL DEFAULT 1,
	CONSTRAINT `habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`diaryEntryId` int,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileType` enum('image','video') NOT NULL,
	`mimeType` varchar(100),
	`fileName` varchar(255),
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mood_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`mood` enum('excellent','good','neutral','sad','terrible') NOT NULL,
	`moodIntensity` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mood_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mood_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` enum('week','month','year') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`averageMoodScore` decimal(3,2),
	`dominantMood` varchar(50),
	`moodDistribution` json,
	`topHabitsCorrelation` json,
	`insights` longtext,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mood_insights_id` PRIMARY KEY(`id`)
);
