ALTER TABLE `cdl_verification_requests` MODIFY COLUMN `cdlClass` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `cdl_verification_requests` ADD `endorsements` varchar(50);--> statement-breakpoint
ALTER TABLE `cdl_verification_requests` ADD `cdlImageUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `cdl_verification_requests` DROP COLUMN `frontImageUrl`;--> statement-breakpoint
ALTER TABLE `cdl_verification_requests` DROP COLUMN `backImageUrl`;--> statement-breakpoint
ALTER TABLE `cdl_verification_requests` DROP COLUMN `selfieUrl`;