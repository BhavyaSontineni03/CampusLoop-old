CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`actor` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`actor` text NOT NULL,
	`token` text NOT NULL,
	`flow` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
