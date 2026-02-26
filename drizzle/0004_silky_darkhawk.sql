ALTER TABLE `users` ADD `verificationStatus` enum('pending','submitted','verified','suspended') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationDeadline` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `suspendedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `suspensionReason` text;