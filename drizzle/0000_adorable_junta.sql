CREATE TYPE "public"."club_member_role" AS ENUM('player', 'staff', 'fan', 'admin');--> statement-breakpoint
CREATE TYPE "public"."ground_type" AS ENUM('stadium', 'training_ground', 'neutral_venue', 'academy');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('like', 'repost', 'follow', 'reply', 'mention', 'message');--> statement-breakpoint
CREATE TYPE "public"."pitch_type" AS ENUM('grass', 'artificial', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."post_media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."preferred_foot" AS ENUM('left', 'right', 'both');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."squad_role" AS ENUM('member', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'submitted', 'verified', 'suspended');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"clubId" integer NOT NULL,
	"userId" integer NOT NULL,
	"club_member_role" "club_member_role" DEFAULT 'fan' NOT NULL,
	"jerseyNumber" integer,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"logoUrl" text,
	"coverUrl" text,
	"country" varchar(80),
	"city" varchar(80),
	"league" varchar(100),
	"founded" integer,
	"isVerified" boolean DEFAULT false NOT NULL,
	"createdById" integer NOT NULL,
	"membersCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"userId" integer NOT NULL,
	"lastReadAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "ground_type" NOT NULL,
	"address" text,
	"city" varchar(100),
	"country" varchar(80),
	"capacity" integer,
	"pitchType" "pitch_type",
	"latitude" varchar(20),
	"longitude" varchar(20),
	"rating" integer DEFAULT 0,
	"reviewsCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"homeTeam" varchar(150) NOT NULL,
	"awayTeam" varchar(150) NOT NULL,
	"homeScore" integer,
	"awayScore" integer,
	"venue" varchar(200),
	"competition" varchar(100),
	"matchDate" timestamp NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"discussionPostId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"videoUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"readAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"actorId" integer NOT NULL,
	"postId" integer,
	"messageId" integer,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"height" integer,
	"weight" integer,
	"appearances" integer DEFAULT 0,
	"goals" integer DEFAULT 0,
	"assists" integer DEFAULT 0,
	"availableForTransfer" boolean DEFAULT false NOT NULL,
	"availableForTrial" boolean DEFAULT false NOT NULL,
	"agentName" varchar(150),
	"agentContact" varchar(200),
	"highlightUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "player_verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fullLegalName" varchar(150) NOT NULL,
	"dateOfBirth" varchar(20) NOT NULL,
	"nationality" varchar(80) NOT NULL,
	"currentClub" varchar(100),
	"position" varchar(50) NOT NULL,
	"idDocumentUrl" text NOT NULL,
	"proofOfPlayUrl" text,
	"status" "verification_request_status" DEFAULT 'pending' NOT NULL,
	"reviewedById" integer,
	"reviewedAt" timestamp,
	"rejectionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"type" "post_media_type" NOT NULL,
	"url" text NOT NULL,
	"thumbnailUrl" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"videoUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"repostOfId" integer,
	"replyToId" integer,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"repostsCount" integer DEFAULT 0 NOT NULL,
	"repliesCount" integer DEFAULT 0 NOT NULL,
	"viewsCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"auth" varchar(255) NOT NULL,
	"p256dh" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"squadId" integer NOT NULL,
	"userId" integer NOT NULL,
	"squad_role" "squad_role" DEFAULT 'member' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"imageUrl" text,
	"coverUrl" text,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"createdById" integer NOT NULL,
	"membersCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"handle" varchar(50),
	"bio" text,
	"location" varchar(100),
	"avatarUrl" text,
	"headerUrl" text,
	"playerVerified" boolean DEFAULT false,
	"position" varchar(50),
	"club" varchar(100),
	"nationality" varchar(80),
	"preferredFoot" "preferred_foot",
	"age" integer,
	"verificationStatus" "verification_status" DEFAULT 'pending' NOT NULL,
	"verificationDeadline" timestamp,
	"suspendedAt" timestamp,
	"suspensionReason" text,
	"followersCount" integer DEFAULT 0 NOT NULL,
	"followingCount" integer DEFAULT 0 NOT NULL,
	"postsCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
