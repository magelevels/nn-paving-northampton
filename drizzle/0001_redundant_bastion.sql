CREATE TABLE `site_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`event_name` text NOT NULL,
	`path` text NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`campaign` text
);
--> statement-breakpoint
ALTER TABLE `enquiries` ADD `consent_at` text;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `consent_version` text;