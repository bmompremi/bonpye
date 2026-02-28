CREATE TYPE "public"."call_status" AS ENUM('ringing', 'connected', 'ended', 'missed', 'declined', 'failed');--> statement-breakpoint
CREATE TYPE "public"."call_type" AS ENUM('voice', 'video');--> statement-breakpoint
CREATE TABLE "call_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"callerId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"type" "call_type" NOT NULL,
	"status" "call_status" DEFAULT 'ringing' NOT NULL,
	"callerPeerId" varchar(100),
	"startedAt" timestamp,
	"endedAt" timestamp,
	"durationSeconds" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
