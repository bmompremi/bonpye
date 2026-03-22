import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { InsertUser, users, pushSubscriptions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle({ client: sql });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Handle: set on insert only — don't overwrite if user already has one
    if (user.handle !== undefined && user.handle !== null) {
      values.handle = user.handle;
      // Only update if currently null (preserves custom handles)
      updateSet.handle = sql`COALESCE(${users.handle}, ${user.handle})`;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import {
  posts, InsertPost,
  likes,
  bookmarks,
  follows,
  conversations,
  conversationParticipants,
  messages,
  notifications, InsertNotification,
  squads,
  squadMembers,
  callRecords, InsertCallRecord,
  mutes,
  blocks,
} from "../drizzle/schema";

// ============ USER FUNCTIONS ============

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByHandle(handle: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserLanguage(userId: number, language: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ language }).where(eq(users.id, userId));
}

export async function searchUsers(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  // Search by name, handle, or email
  return db.select({
    id: users.id,
    name: users.name,
    handle: users.handle,
    avatarUrl: users.avatarUrl,
    bio: users.bio,
    playerVerified: users.playerVerified,
    email: users.email,
    location: users.location,
    position: users.position,
  }).from(users)
    .where(or(
      sql`LOWER(${users.name}) LIKE LOWER(${`%${query}%`})`,
      sql`LOWER(${users.handle}) LIKE LOWER(${`%${query}%`})`,
      sql`LOWER(${users.email}) LIKE LOWER(${`%${query}%`})`
    ))
    .limit(limit);
}

// ============ POST FUNCTIONS ============

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(data).returning({ id: posts.id });
  return result[0].id;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedPosts(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  // Get posts from users the current user follows + their own posts
  const followingIds = await db.select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  
  const userIds = [userId, ...followingIds.map(f => f.followingId)];
  
  const postsResult = await db.select()
    .from(posts)
    .where(and(
      inArray(posts.userId, userIds),
      sql`${posts.replyToId} IS NULL`,
      sql`${posts.repostOfId} IS NULL`
    ))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch author info for each post
  const postsWithAuthors = await Promise.all(postsResult.map(async (post) => {
    const author = await getUserById(post.userId);
    return {
      ...post,
      _author: author ? {
        name: author.name || 'Player',
        handle: author.handle || 'player',
        avatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        verified: author.playerVerified || false,
      } : undefined
    };
  }));

  return postsWithAuthors;
}

export async function getExplorePosts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const postsResult = await db.select()
    .from(posts)
    .where(and(
      sql`${posts.replyToId} IS NULL`,
      sql`${posts.repostOfId} IS NULL`
    ))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch author info for each post
  const postsWithAuthors = await Promise.all(postsResult.map(async (post) => {
    const author = await getUserById(post.userId);
    return {
      ...post,
      _author: author ? {
        name: author.name || 'Player',
        handle: author.handle || 'player',
        avatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        verified: author.playerVerified || false,
      } : undefined
    };
  }));

  return postsWithAuthors;
}

export async function getUserPosts(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function deletePost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId)));
}

export async function getPostReplies(postId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const repliesResult = await db.select()
    .from(posts)
    .where(eq(posts.replyToId, postId))
    .orderBy(posts.createdAt)
    .limit(limit)
    .offset(offset);

  const repliesWithAuthors = await Promise.all(repliesResult.map(async (reply) => {
    const author = await getUserById(reply.userId);
    return {
      ...reply,
      _author: author ? {
        name: author.name || 'Player',
        handle: author.handle || 'player',
        avatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        verified: author.playerVerified || false,
      } : undefined,
    };
  }));

  return repliesWithAuthors;
}

export async function getExistingRepost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ id: posts.id }).from(posts).where(
    and(eq(posts.userId, userId), eq(posts.repostOfId, postId))
  ).limit(1);
  return result[0] || null;
}

export async function incrementPostCount(postId: number, field: 'likesCount' | 'repostsCount' | 'repliesCount' | 'viewsCount') {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ [field]: sql`${posts[field]} + 1` }).where(eq(posts.id, postId));
}

export async function decrementPostCount(postId: number, field: 'likesCount' | 'repostsCount' | 'repliesCount') {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ [field]: sql`GREATEST(${posts[field]} - 1, 0)` }).where(eq(posts.id, postId));
}

// ============ LIKE FUNCTIONS ============

export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already liked
  const existing = await db.select().from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .limit(1);
  
  if (existing.length > 0) return false;
  
  await db.insert(likes).values({ userId, postId });
  await incrementPostCount(postId, 'likesCount');
  return true;
}

export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .returning({ id: likes.id });

  if (result.length > 0) {
    await decrementPostCount(postId, 'likesCount');
    return true;
  }
  return false;
}

export async function getUserLikes(userId: number, postIds: number[]) {
  const db = await getDb();
  if (!db || postIds.length === 0) return [];
  return db.select().from(likes)
    .where(and(eq(likes.userId, userId), inArray(likes.postId, postIds)));
}

// ============ BOOKMARK FUNCTIONS ============

export async function bookmarkPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)))
    .limit(1);
  
  if (existing.length > 0) return false;
  
  await db.insert(bookmarks).values({ userId, postId });
  return true;
}

export async function unbookmarkPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)))
    .returning({ id: bookmarks.id });

  return result.length > 0;
}

export async function getUserBookmarks(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const bookmarkedPosts = await db.select({ postId: bookmarks.postId })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit)
    .offset(offset);
  
  if (bookmarkedPosts.length === 0) return [];
  
  return db.select().from(posts)
    .where(inArray(posts.id, bookmarkedPosts.map(b => b.postId)));
}

export async function getUserBookmarkIds(userId: number, postIds: number[]) {
  const db = await getDb();
  if (!db || postIds.length === 0) return [];
  return db.select().from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.postId, postIds)));
}

// ============ FOLLOW FUNCTIONS ============

export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (followerId === followingId) return false;
  
  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  
  if (existing.length > 0) return false;
  
  await db.insert(follows).values({ followerId, followingId });
  return true;
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .returning({ id: follows.id });

  return result.length > 0;
}

export async function getFollowers(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const followerIds = await db.select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followingId, userId))
    .limit(limit)
    .offset(offset);
  
  if (followerIds.length === 0) return [];
  
  return db.select().from(users)
    .where(inArray(users.id, followerIds.map(f => f.followerId)));
}

export async function getFollowing(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const followingIds = await db.select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId))
    .limit(limit)
    .offset(offset);
  
  if (followingIds.length === 0) return [];
  
  return db.select().from(users)
    .where(inArray(users.id, followingIds.map(f => f.followingId)));
}

export async function getFollowCounts(userId: number) {
  const db = await getDb();
  if (!db) return { followers: 0, following: 0 };
  
  const [followersResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  
  const [followingResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));
  
  return {
    followers: Number(followersResult?.count || 0),
    following: Number(followingResult?.count || 0)
  };
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  
  return result.length > 0;
}

// ============ MESSAGE FUNCTIONS ============

export async function getOrCreateConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find existing conversation
  const user1Convos = await db.select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId1));
  
  const user2Convos = await db.select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId2));
  
  const commonConvo = user1Convos.find(c1 => 
    user2Convos.some(c2 => c2.conversationId === c1.conversationId)
  );
  
  if (commonConvo) {
    return commonConvo.conversationId;
  }
  
  // Create new conversation
  const [newConvo] = await db.insert(conversations).values({}).returning({ id: conversations.id });
  const conversationId = newConvo.id;
  
  await db.insert(conversationParticipants).values([
    { conversationId, userId: userId1 },
    { conversationId, userId: userId2 }
  ]);
  
  return conversationId;
}

export async function sendMessage(conversationId: number, senderId: number, content: string, imageUrl?: string, videoUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newMsg] = await db.insert(messages).values({
    conversationId,
    senderId,
    content,
    imageUrl,
    videoUrl,
  }).returning({ id: messages.id });

  // Update conversation timestamp
  await db.update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return newMsg.id;
}

export async function getConversationMessages(conversationId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const participations = await db.select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));
  
  if (participations.length === 0) return [];
  
  const convs = await db.select()
    .from(conversations)
    .where(inArray(conversations.id, participations.map(p => p.conversationId)))
    .orderBy(desc(conversations.updatedAt));
  
  // Enrich conversations with participant and message data
  const enriched = await Promise.all(convs.map(async (conv) => {
    // Get all participants
    const participants = await db.select()
      .from(users)
      .innerJoin(conversationParticipants, eq(users.id, conversationParticipants.userId))
      .where(eq(conversationParticipants.conversationId, conv.id));
    
    // Get last message
    const lastMsg = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    
    return {
      ...conv,
      participants: participants.map(p => p.users),
      lastMessage: lastMsg[0]?.content || null,
      lastMessageAt: lastMsg[0]?.createdAt || conv.updatedAt,
    };
  }));
  
  return enriched;
}

export async function getConversationParticipants(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const participants = await db.select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId));
  
  if (participants.length === 0) return [];
  
  return db.select().from(users)
    .where(inArray(users.id, participants.map(p => p.userId)));
}

// ============ CALL FUNCTIONS ============

export async function createCallRecord(data: {
  conversationId: number;
  callerId: number;
  receiverId: number;
  type: "voice" | "video";
  callerPeerId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [record] = await db.insert(callRecords).values({
    conversationId: data.conversationId,
    callerId: data.callerId,
    receiverId: data.receiverId,
    type: data.type,
    status: "ringing",
    callerPeerId: data.callerPeerId,
  }).returning();

  return record;
}

export async function getIncomingCalls(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(callRecords)
    .where(and(
      eq(callRecords.receiverId, userId),
      eq(callRecords.status, "ringing")
    ))
    .orderBy(desc(callRecords.createdAt))
    .limit(1);
}

export async function updateCallStatus(callId: number, status: "ringing" | "connected" | "ended" | "missed" | "declined" | "failed", startedAt?: Date) {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, unknown> = { status };
  if (startedAt) updateData.startedAt = startedAt;

  await db.update(callRecords)
    .set(updateData)
    .where(eq(callRecords.id, callId));
}

export async function endCall(callId: number) {
  const db = await getDb();
  if (!db) return;

  const [record] = await db.select().from(callRecords).where(eq(callRecords.id, callId)).limit(1);
  if (!record) return;

  const endedAt = new Date();
  let durationSeconds = 0;
  if (record.startedAt) {
    durationSeconds = Math.round((endedAt.getTime() - new Date(record.startedAt).getTime()) / 1000);
  }

  await db.update(callRecords)
    .set({ status: "ended", endedAt, durationSeconds })
    .where(eq(callRecords.id, callId));
}

export async function getCallHistory(conversationId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(callRecords)
    .where(eq(callRecords.conversationId, conversationId))
    .orderBy(desc(callRecords.createdAt))
    .limit(limit);
}

export async function getCallById(callId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(callRecords).where(eq(callRecords.id, callId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ NOTIFICATION FUNCTIONS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  
  // Don't notify yourself
  if (data.userId === data.actorId) return;
  
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  // Get notifications with actor info and post preview
  const rows = await db.select({
    id: notifications.id,
    type: notifications.type,
    actorId: notifications.actorId,
    postId: notifications.postId,
    read: notifications.read,
    createdAt: notifications.createdAt,
    // Actor (who triggered the notification)
    actorName: users.name,
    actorHandle: users.handle,
    actorAvatar: users.avatarUrl,
    actorVerified: users.playerVerified,
    // Post preview (if applicable)
    postContent: posts.content,
  })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(posts, eq(notifications.postId, posts.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  
  return Number(result?.count || 0);
}

// ============ SQUAD FUNCTIONS ============

export async function getSquads(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(squads)
    .where(eq(squads.isPrivate, false))
    .orderBy(desc(squads.membersCount))
    .limit(limit)
    .offset(offset);
}

export async function getSquadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(squads).where(eq(squads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function joinSquad(userId: number, squadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(squadMembers)
    .where(and(eq(squadMembers.userId, userId), eq(squadMembers.squadId, squadId)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(squadMembers).values({ userId, squadId });
  await db.update(squads)
    .set({ membersCount: sql`${squads.membersCount} + 1` })
    .where(eq(squads.id, squadId));

  return true;
}

export async function leaveSquad(userId: number, squadId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(squadMembers)
    .where(and(eq(squadMembers.userId, userId), eq(squadMembers.squadId, squadId)))
    .returning({ id: squadMembers.id });

  if (result.length > 0) {
    await db.update(squads)
      .set({ membersCount: sql`GREATEST(${squads.membersCount} - 1, 0)` })
      .where(eq(squads.id, squadId));
    return true;
  }
  return false;
}

export async function getUserSquads(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const memberships = await db.select({ squadId: squadMembers.squadId })
    .from(squadMembers)
    .where(eq(squadMembers.userId, userId));

  if (memberships.length === 0) return [];

  return db.select().from(squads)
    .where(inArray(squads.id, memberships.map(m => m.squadId)));
}

export async function isSquadMember(userId: number, squadId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(squadMembers)
    .where(and(eq(squadMembers.userId, userId), eq(squadMembers.squadId, squadId)))
    .limit(1);

  return result.length > 0;
}


// ============ PLAYER VERIFICATION FUNCTIONS ============

import { playerVerificationRequests, InsertPlayerVerificationRequest, postMedia, InsertPostMedia } from "../drizzle/schema";

export async function createPlayerVerificationRequest(data: InsertPlayerVerificationRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a pending request
  const existing = await db.select().from(playerVerificationRequests)
    .where(and(
      eq(playerVerificationRequests.userId, data.userId),
      eq(playerVerificationRequests.status, "pending")
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("You already have a pending verification request");
  }

  const [newReq] = await db.insert(playerVerificationRequests).values(data).returning({ id: playerVerificationRequests.id });
  return newReq.id;
}

export async function getPlayerVerificationRequest(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(playerVerificationRequests)
    .where(eq(playerVerificationRequests.userId, userId))
    .orderBy(desc(playerVerificationRequests.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingPlayerVerifications(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(playerVerificationRequests)
    .where(eq(playerVerificationRequests.status, "pending"))
    .orderBy(playerVerificationRequests.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function approvePlayerVerification(requestId: number, reviewerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await db.select().from(playerVerificationRequests)
    .where(eq(playerVerificationRequests.id, requestId))
    .limit(1);

  if (request.length === 0) throw new Error("Request not found");

  await db.update(playerVerificationRequests)
    .set({
      status: "approved",
      reviewedById: reviewerId,
      reviewedAt: new Date()
    })
    .where(eq(playerVerificationRequests.id, requestId));

  // Update user's player verified status
  await db.update(users)
    .set({ playerVerified: true })
    .where(eq(users.id, request[0].userId));

  return true;
}

export async function rejectPlayerVerification(requestId: number, reviewerId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(playerVerificationRequests)
    .set({
      status: "rejected",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason
    })
    .where(eq(playerVerificationRequests.id, requestId));

  return true;
}

// ============ POST MEDIA FUNCTIONS ============

export async function addPostMedia(data: InsertPostMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [newMedia] = await db.insert(postMedia).values(data).returning({ id: postMedia.id });
  return newMedia.id;
}

export async function getPostMedia(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(postMedia)
    .where(eq(postMedia.postId, postId))
    .orderBy(postMedia.id);
}

export async function deletePostMedia(postId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(postMedia).where(eq(postMedia.postId, postId));
}


// ============ VERIFICATION SYSTEM FUNCTIONS ============

export async function setVerificationDeadline(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Set deadline to 24 hours from now
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);
  
  await db.update(users)
    .set({ 
      verificationDeadline: deadline,
      verificationStatus: "pending"
    })
    .where(eq(users.id, userId));
  
  return deadline;
}

export async function updateVerificationStatus(userId: number, status: "pending" | "submitted" | "verified" | "suspended") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = { verificationStatus: status };
  
  if (status === "suspended") {
    updateData.suspendedAt = new Date();
    updateData.suspensionReason = "Failed to verify identity within 24 hours";
  } else if (status === "verified") {
    updateData.playerVerified = true;
  }
  
  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));
}

export async function getUserVerificationStatus(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select({
    verificationStatus: users.verificationStatus,
    verificationDeadline: users.verificationDeadline,
    suspendedAt: users.suspendedAt,
    suspensionReason: users.suspensionReason,
    playerVerified: users.playerVerified,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getExpiredUnverifiedUsers() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return db.select()
    .from(users)
    .where(and(
      eq(users.verificationStatus, "pending"),
      sql`${users.verificationDeadline} < ${now}`,
      sql`${users.verificationDeadline} IS NOT NULL`
    ));
}

export async function suspendExpiredUsers() {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  
  const result = await db.update(users)
    .set({
      verificationStatus: "suspended",
      suspendedAt: now,
      suspensionReason: "Failed to verify identity within 24 hours"
    })
    .where(and(
      eq(users.verificationStatus, "pending"),
      sql`${users.verificationDeadline} < ${now}`,
      sql`${users.verificationDeadline} IS NOT NULL`
    ))
    .returning({ id: users.id });

  return result.length;
}

export async function getAllPendingVerifications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users with submitted verification requests
  const requests = await db.select({
    request: playerVerificationRequests,
    user: users
  })
    .from(playerVerificationRequests)
    .innerJoin(users, eq(playerVerificationRequests.userId, users.id))
    .where(eq(playerVerificationRequests.status, "pending"))
    .orderBy(playerVerificationRequests.createdAt)
    .limit(limit)
    .offset(offset);
  
  return requests;
}

export async function unsuspendUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Reset the deadline to 24 hours from now
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);
  
  await db.update(users)
    .set({
      verificationStatus: "pending",
      verificationDeadline: deadline,
      suspendedAt: null,
      suspensionReason: null
    })
    .where(eq(users.id, userId));
}


// ============ PUSH NOTIFICATION FUNCTIONS ============

export async function savePushSubscription(userId: number, subscription: { endpoint: string; keys: { auth: string; p256dh: string } }) {
  const db = await getDb();
  if (!db) return;
  
  const { pushSubscriptions } = await import("../drizzle/schema");
  
  // Check if subscription already exists
  const existing = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing subscription
    await db.update(pushSubscriptions)
      .set({ userId })
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
  } else {
    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
    });
  }
}

export async function getPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { pushSubscriptions } = await import("../drizzle/schema");
  
  return db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) return;
  
  const { pushSubscriptions } = await import("../drizzle/schema");
  
  await db.delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getAllPushSubscriptionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { pushSubscriptions } = await import("../drizzle/schema");

  return db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}


// ============ CLUB FUNCTIONS ============

import { clubs, InsertClub, clubMembers, InsertClubMember } from "../drizzle/schema";

export async function getClubs(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(clubs)
    .orderBy(desc(clubs.membersCount))
    .limit(limit)
    .offset(offset);
}

export async function getClubBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clubs).where(eq(clubs.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClubById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function joinClub(userId: number, clubId: number, role: "player" | "staff" | "fan" | "admin" = "fan") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(clubMembers)
    .where(and(eq(clubMembers.userId, userId), eq(clubMembers.clubId, clubId)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(clubMembers).values({ userId, clubId, role });
  await db.update(clubs)
    .set({ membersCount: sql`${clubs.membersCount} + 1` })
    .where(eq(clubs.id, clubId));

  return true;
}

export async function leaveClub(userId: number, clubId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(clubMembers)
    .where(and(eq(clubMembers.userId, userId), eq(clubMembers.clubId, clubId)))
    .returning({ id: clubMembers.id });

  if (result.length > 0) {
    await db.update(clubs)
      .set({ membersCount: sql`GREATEST(${clubs.membersCount} - 1, 0)` })
      .where(eq(clubs.id, clubId));
    return true;
  }
  return false;
}

export async function getClubMembers(clubId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    member: clubMembers,
    user: users,
  })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .where(eq(clubMembers.clubId, clubId))
    .limit(limit)
    .offset(offset);
}


// ============ MATCH FUNCTIONS ============

import { matches, InsertMatch } from "../drizzle/schema";

export async function getMatches(status?: "scheduled" | "live" | "finished" | "cancelled", limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const query = db.select().from(matches);
  if (status) {
    return query
      .where(eq(matches.status, status))
      .orderBy(desc(matches.matchDate))
      .limit(limit)
      .offset(offset);
  }
  return query.orderBy(desc(matches.matchDate)).limit(limit).offset(offset);
}

export async function getMatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMatch(data: InsertMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newMatch] = await db.insert(matches).values(data).returning({ id: matches.id });
  return newMatch.id;
}


// ============ SCOUTING FUNCTIONS ============

import { playerProfiles, InsertPlayerProfile } from "../drizzle/schema";

export async function getScoutingProfiles(filters: {
  position?: string;
  nationality?: string;
  availableForTransfer?: boolean;
  availableForTrial?: boolean;
}, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters.availableForTransfer !== undefined) {
    conditions.push(eq(playerProfiles.availableForTransfer, filters.availableForTransfer));
  }
  if (filters.availableForTrial !== undefined) {
    conditions.push(eq(playerProfiles.availableForTrial, filters.availableForTrial));
  }

  const profiles = await db.select({
    profile: playerProfiles,
    user: users,
  })
    .from(playerProfiles)
    .innerJoin(users, eq(playerProfiles.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  // Apply position/nationality filters in JS (since they're on the users table)
  return profiles.filter(p => {
    if (filters.position && p.user.position !== filters.position) return false;
    if (filters.nationality && p.user.nationality !== filters.nationality) return false;
    return true;
  });
}

export async function getPlayerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(playerProfiles)
    .where(eq(playerProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPlayerProfile(userId: number, data: Partial<InsertPlayerProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getPlayerProfile(userId);
  if (existing) {
    await db.update(playerProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(playerProfiles.userId, userId));
  } else {
    await db.insert(playerProfiles).values({ ...data, userId });
  }
}


// ============ GROUNDS FUNCTIONS ============

import { grounds } from "../drizzle/schema";

export async function getGrounds(type?: "stadium" | "training_ground" | "neutral_venue" | "academy", limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  if (type) {
    return db.select().from(grounds)
      .where(eq(grounds.type, type))
      .orderBy(desc(grounds.rating))
      .limit(limit)
      .offset(offset);
  }
  return db.select().from(grounds)
    .orderBy(desc(grounds.rating))
    .limit(limit)
    .offset(offset);
}

export async function getGroundById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(grounds).where(eq(grounds.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ MUTE FUNCTIONS ============

export async function muteUser(userId: number, mutedUserId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(mutes)
    .where(and(eq(mutes.userId, userId), eq(mutes.mutedUserId, mutedUserId))).limit(1);
  if (existing.length > 0) return false;
  await db.insert(mutes).values({ userId, mutedUserId });
  return true;
}

export async function unmuteUser(userId: number, mutedUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(mutes).where(and(eq(mutes.userId, userId), eq(mutes.mutedUserId, mutedUserId)));
}

export async function getMutedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, handle: users.handle, avatarUrl: users.avatarUrl })
    .from(mutes)
    .innerJoin(users, eq(users.id, mutes.mutedUserId))
    .where(eq(mutes.userId, userId));
}

// ============ BLOCK FUNCTIONS ============

export async function blockUser(userId: number, blockedUserId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(blocks)
    .where(and(eq(blocks.userId, userId), eq(blocks.blockedUserId, blockedUserId))).limit(1);
  if (existing.length > 0) return false;
  await db.insert(blocks).values({ userId, blockedUserId });
  return true;
}

export async function unblockUser(userId: number, blockedUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blocks).where(and(eq(blocks.userId, userId), eq(blocks.blockedUserId, blockedUserId)));
}

export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, handle: users.handle, avatarUrl: users.avatarUrl })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedUserId))
    .where(eq(blocks.userId, userId));
}
