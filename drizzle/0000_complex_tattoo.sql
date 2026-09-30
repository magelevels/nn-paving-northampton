CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`name` text NOT NULL,
	`postcode` text NOT NULL,
	`service` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`goal` text NOT NULL,
	`site_notes` text NOT NULL,
	`contact_method` text NOT NULL,
	`callback_time` text NOT NULL,
	`site_visit` text NOT NULL,
	`details` text NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`next_action_date` text,
	`next_action_note` text
);
--> statement-breakpoint
CREATE TABLE `enquiry_events` (
	`id` text PRIMARY KEY NOT NULL,
	`enquiry_id` text NOT NULL,
	`event_type` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
