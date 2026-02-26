CREATE TABLE `cdl_verification_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cdlNumber` varchar(50) NOT NULL,
	`cdlState` varchar(2) NOT NULL,
	`cdlClass` enum('A','B','C') NOT NULL,
	`frontImageUrl` text NOT NULL,
	`backImageUrl` text NOT NULL,
	`selfieUrl` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedById` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cdl_verification_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`type` enum('image','video') NOT NULL,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`width` int,
	`height` int,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `followersCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `followingCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `postsCount` int DEFAULT 0 NOT NULL;