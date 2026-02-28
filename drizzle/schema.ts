import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const preferredFootEnum = pgEnum("preferred_foot", ["left", "right", "both"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "submitted", "verified", "suspended"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Profile fields
  handle: varchar("handle", { length: 50 }),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  headerUrl: text("headerUrl"),
  // BONPYE: Football identity fields
  playerVerified: boolean("playerVerified").default(false),
  position: varchar("position", { length: 50 }),
  club: varchar("club", { length: 100 }),
  nationality: varchar("nationality", { length: 80 }),
  preferredFoot: preferredFootEnum("preferredFoot"),
  age: integer("age"),
  // Verification system
  verificationStatus: verificationStatusEnum("verificationStatus").default("pending").notNull(),
  verificationDeadline: timestamp("verificationDeadline"),
  suspendedAt: timestamp("suspendedAt"),
  suspensionReason: text("suspensionReason"),
  // Counts
  followersCount: integer("followersCount").default(0).notNull(),
  followingCount: integer("followingCount").default(0).notNull(),
  postsCount: integer("postsCount").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts (Plays)
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  // For reposts/assists
  repostOfId: integer("repostOfId"),
  // For replies
  replyToId: integer("replyToId"),
  // Counts (denormalized for performance)
  likesCount: integer("likesCount").default(0).notNull(),
  repostsCount: integer("repostsCount").default(0).notNull(),
  repliesCount: integer("repliesCount").default(0).notNull(),
  viewsCount: integer("viewsCount").default(0).notNull(),
  // Link preview (auto-populated from OG tags when post contains a URL)
  linkUrl: text("linkUrl"),
  linkTitle: text("linkTitle"),
  linkDescription: text("linkDescription"),
  linkImage: text("linkImage"),
  linkSiteName: text("linkSiteName"),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post Media (for multiple images/videos per post)
 */
export const postMediaTypeEnum = pgEnum("post_media_type", ["image", "video"]);

export const postMedia = pgTable("post_media", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  type: postMediaTypeEnum("type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // for videos, in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = typeof postMedia.$inferInsert;

/**
 * Likes (Goals)
 */
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Bookmarks
 */
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Follows
 */
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull(),
  followingId: integer("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Conversations (for DMs)
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Conversation Participants
 */
export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert;

/**
 * Messages
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Call Records (voice/video call history)
 */
export const callTypeEnum = pgEnum("call_type", ["voice", "video"]);
export const callStatusEnum = pgEnum("call_status", [
  "ringing",
  "connected",
  "ended",
  "missed",
  "declined",
  "failed",
]);

export const callRecords = pgTable("call_records", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  callerId: integer("callerId").notNull(),
  receiverId: integer("receiverId").notNull(),
  type: callTypeEnum("type").notNull(),
  status: callStatusEnum("status").default("ringing").notNull(),
  callerPeerId: varchar("callerPeerId", { length: 100 }),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  durationSeconds: integer("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CallRecord = typeof callRecords.$inferSelect;
export type InsertCallRecord = typeof callRecords.$inferInsert;

/**
 * Notifications
 */
export const notificationTypeEnum = pgEnum("notification_type", ["like", "repost", "follow", "reply", "mention", "message"]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").notNull(),
  actorId: integer("actorId").notNull(),
  postId: integer("postId"),
  messageId: integer("messageId"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Player Verification Requests (replaces CDL verification)
 */
export const verificationRequestStatusEnum = pgEnum("verification_request_status", ["pending", "approved", "rejected"]);

export const playerVerificationRequests = pgTable("player_verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fullLegalName: varchar("fullLegalName", { length: 150 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }).notNull(),
  nationality: varchar("nationality", { length: 80 }).notNull(),
  currentClub: varchar("currentClub", { length: 100 }),
  position: varchar("position", { length: 50 }).notNull(),
  idDocumentUrl: text("idDocumentUrl").notNull(),
  proofOfPlayUrl: text("proofOfPlayUrl"),
  status: verificationRequestStatusEnum("status").default("pending").notNull(),
  reviewedById: integer("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlayerVerificationRequest = typeof playerVerificationRequests.$inferSelect;
export type InsertPlayerVerificationRequest = typeof playerVerificationRequests.$inferInsert;

/**
 * Squads (Community Groups — replaces Convoys)
 */
export const squads = pgTable("squads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  coverUrl: text("coverUrl"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdById: integer("createdById").notNull(),
  membersCount: integer("membersCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Squad = typeof squads.$inferSelect;
export type InsertSquad = typeof squads.$inferInsert;

/**
 * Squad Members
 */
export const squadRoleEnum = pgEnum("squad_role", ["member", "moderator", "admin"]);

export const squadMembers = pgTable("squad_members", {
  id: serial("id").primaryKey(),
  squadId: integer("squadId").notNull(),
  userId: integer("userId").notNull(),
  role: squadRoleEnum("squad_role").default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SquadMember = typeof squadMembers.$inferSelect;
export type InsertSquadMember = typeof squadMembers.$inferInsert;

/**
 * Clubs (Official football club / team pages)
 */
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  coverUrl: text("coverUrl"),
  country: varchar("country", { length: 80 }),
  city: varchar("city", { length: 80 }),
  league: varchar("league", { length: 100 }),
  founded: integer("founded"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdById: integer("createdById").notNull(),
  membersCount: integer("membersCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Club = typeof clubs.$inferSelect;
export type InsertClub = typeof clubs.$inferInsert;

/**
 * Club Members (roster)
 */
export const clubMemberRoleEnum = pgEnum("club_member_role", ["player", "staff", "fan", "admin"]);

export const clubMembers = pgTable("club_members", {
  id: serial("id").primaryKey(),
  clubId: integer("clubId").notNull(),
  userId: integer("userId").notNull(),
  role: clubMemberRoleEnum("club_member_role").default("fan").notNull(),
  jerseyNumber: integer("jerseyNumber"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ClubMember = typeof clubMembers.$inferSelect;
export type InsertClubMember = typeof clubMembers.$inferInsert;

/**
 * Matches (for match discussions)
 */
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "finished", "cancelled"]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeam: varchar("homeTeam", { length: 150 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 150 }).notNull(),
  homeScore: integer("homeScore"),
  awayScore: integer("awayScore"),
  venue: varchar("venue", { length: 200 }),
  competition: varchar("competition", { length: 100 }),
  matchDate: timestamp("matchDate").notNull(),
  status: matchStatusEnum("status").default("scheduled").notNull(),
  discussionPostId: integer("discussionPostId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Player Scouting Profiles (extended profile for scouting board)
 */
export const playerProfiles = pgTable("player_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  appearances: integer("appearances").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  availableForTransfer: boolean("availableForTransfer").default(false).notNull(),
  availableForTrial: boolean("availableForTrial").default(false).notNull(),
  agentName: varchar("agentName", { length: 150 }),
  agentContact: varchar("agentContact", { length: 200 }),
  highlightUrl: text("highlightUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = typeof playerProfiles.$inferInsert;

/**
 * Grounds (Football venues — replaces BlackBook)
 */
export const groundTypeEnum = pgEnum("ground_type", ["stadium", "training_ground", "neutral_venue", "academy"]);
export const pitchTypeEnum = pgEnum("pitch_type", ["grass", "artificial", "hybrid"]);

export const grounds = pgTable("grounds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: groundTypeEnum("type").notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 80 }),
  capacity: integer("capacity"),
  pitchType: pitchTypeEnum("pitchType"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  rating: integer("rating").default(0),
  reviewsCount: integer("reviewsCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ground = typeof grounds.$inferSelect;
export type InsertGround = typeof grounds.$inferInsert;

/**
 * Push Notification Subscriptions
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
