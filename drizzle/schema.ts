import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Profile fields
  handle: varchar("handle", { length: 50 }),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  headerUrl: text("headerUrl"),
  cdlVerified: boolean("cdlVerified").default(false),
  truckType: varchar("truckType", { length: 50 }),
  yearsExperience: int("yearsExperience"),
  // Verification system
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "submitted", "verified", "suspended"]).default("pending").notNull(),
  verificationDeadline: timestamp("verificationDeadline"),
  suspendedAt: timestamp("suspendedAt"),
  suspensionReason: text("suspensionReason"),
  // Counts
  followersCount: int("followersCount").default(0).notNull(),
  followingCount: int("followingCount").default(0).notNull(),
  postsCount: int("postsCount").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts (Transmissions)
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // For reposts/echoes
  repostOfId: int("repostOfId"),
  // For replies
  replyToId: int("replyToId"),
  // Counts (denormalized for performance)
  likesCount: int("likesCount").default(0).notNull(),
  repostsCount: int("repostsCount").default(0).notNull(),
  repliesCount: int("repliesCount").default(0).notNull(),
  viewsCount: int("viewsCount").default(0).notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post Media (for multiple images/videos per post)
 */
export const postMedia = mysqlTable("post_media", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  width: int("width"),
  height: int("height"),
  duration: int("duration"), // for videos, in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = typeof postMedia.$inferInsert;

/**
 * Likes (10-4s)
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Bookmarks
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Follows
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Conversations (for DMs)
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Conversation Participants
 */
export const conversationParticipants = mysqlTable("conversation_participants", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert;

/**
 * Messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["like", "repost", "follow", "reply", "mention", "message"]).notNull(),
  actorId: int("actorId").notNull(),
  postId: int("postId"),
  messageId: int("messageId"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * CDL Verification Requests
 */
export const cdlVerificationRequests = mysqlTable("cdl_verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cdlNumber: varchar("cdlNumber", { length: 50 }).notNull(),
  cdlState: varchar("cdlState", { length: 2 }).notNull(),
  cdlClass: varchar("cdlClass", { length: 20 }).notNull(),
  endorsements: varchar("endorsements", { length: 50 }),
  cdlImageUrl: text("cdlImageUrl").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CdlVerificationRequest = typeof cdlVerificationRequests.$inferSelect;
export type InsertCdlVerificationRequest = typeof cdlVerificationRequests.$inferInsert;

/**
 * Convoys (Groups)
 */
export const convoys = mysqlTable("convoys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  coverUrl: text("coverUrl"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdById: int("createdById").notNull(),
  membersCount: int("membersCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Convoy = typeof convoys.$inferSelect;
export type InsertConvoy = typeof convoys.$inferInsert;

/**
 * Convoy Members
 */
export const convoyMembers = mysqlTable("convoy_members", {
  id: int("id").autoincrement().primaryKey(),
  convoyId: int("convoyId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "moderator", "admin"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConvoyMember = typeof convoyMembers.$inferSelect;
export type InsertConvoyMember = typeof convoyMembers.$inferInsert;

/**
 * Push Notification Subscriptions
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
