import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pushSubscriptions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

import { desc, and, or, sql, inArray } from "drizzle-orm";
import { 
  posts, InsertPost,
  likes,
  bookmarks,
  follows,
  conversations,
  conversationParticipants,
  messages,
  notifications, InsertNotification,
  convoys,
  convoyMembers
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
    cdlVerified: users.cdlVerified,
    email: users.email,
    location: users.location,
    truckType: users.truckType,
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
  const result = await db.insert(posts).values(data);
  return result[0].insertId;
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
    .where(inArray(posts.userId, userIds))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Fetch author info for each post
  const postsWithAuthors = await Promise.all(postsResult.map(async (post) => {
    const author = await getUserById(post.userId);
    return {
      ...post,
      _author: author ? {
        name: author.name || 'Driver',
        handle: author.handle || 'driver',
        avatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        verified: author.cdlVerified || false,
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
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Fetch author info for each post
  const postsWithAuthors = await Promise.all(postsResult.map(async (post) => {
    const author = await getUserById(post.userId);
    return {
      ...post,
      _author: author ? {
        name: author.name || 'Driver',
        handle: author.handle || 'driver',
        avatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        verified: author.cdlVerified || false,
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
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  
  if (result[0].affectedRows > 0) {
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
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
  
  return result[0].affectedRows > 0;
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
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  
  return result[0].affectedRows > 0;
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
  const [result] = await db.insert(conversations).values({});
  const conversationId = result.insertId;
  
  await db.insert(conversationParticipants).values([
    { conversationId, userId: userId1 },
    { conversationId, userId: userId2 }
  ]);
  
  return conversationId;
}

export async function sendMessage(conversationId: number, senderId: number, content: string, imageUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(messages).values({
    conversationId,
    senderId,
    content,
    imageUrl
  });
  
  // Update conversation timestamp
  await db.update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
  
  return result.insertId;
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
  
  return db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
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

// ============ CONVOY FUNCTIONS ============

export async function getConvoys(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(convoys)
    .where(eq(convoys.isPrivate, false))
    .orderBy(desc(convoys.membersCount))
    .limit(limit)
    .offset(offset);
}

export async function getConvoyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(convoys).where(eq(convoys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function joinConvoy(userId: number, convoyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(convoyMembers)
    .where(and(eq(convoyMembers.userId, userId), eq(convoyMembers.convoyId, convoyId)))
    .limit(1);
  
  if (existing.length > 0) return false;
  
  await db.insert(convoyMembers).values({ userId, convoyId });
  await db.update(convoys)
    .set({ membersCount: sql`${convoys.membersCount} + 1` })
    .where(eq(convoys.id, convoyId));
  
  return true;
}

export async function leaveConvoy(userId: number, convoyId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(convoyMembers)
    .where(and(eq(convoyMembers.userId, userId), eq(convoyMembers.convoyId, convoyId)));
  
  if (result[0].affectedRows > 0) {
    await db.update(convoys)
      .set({ membersCount: sql`GREATEST(${convoys.membersCount} - 1, 0)` })
      .where(eq(convoys.id, convoyId));
    return true;
  }
  return false;
}

export async function getUserConvoys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const memberships = await db.select({ convoyId: convoyMembers.convoyId })
    .from(convoyMembers)
    .where(eq(convoyMembers.userId, userId));
  
  if (memberships.length === 0) return [];
  
  return db.select().from(convoys)
    .where(inArray(convoys.id, memberships.map(m => m.convoyId)));
}

export async function isConvoyMember(userId: number, convoyId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(convoyMembers)
    .where(and(eq(convoyMembers.userId, userId), eq(convoyMembers.convoyId, convoyId)))
    .limit(1);
  
  return result.length > 0;
}


// ============ CDL VERIFICATION FUNCTIONS ============

import { cdlVerificationRequests, InsertCdlVerificationRequest, postMedia, InsertPostMedia } from "../drizzle/schema";

export async function createCdlVerificationRequest(data: InsertCdlVerificationRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already has a pending request
  const existing = await db.select().from(cdlVerificationRequests)
    .where(and(
      eq(cdlVerificationRequests.userId, data.userId),
      eq(cdlVerificationRequests.status, "pending")
    ))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("You already have a pending verification request");
  }
  
  const [result] = await db.insert(cdlVerificationRequests).values(data);
  return result.insertId;
}

export async function getCdlVerificationRequest(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(cdlVerificationRequests)
    .where(eq(cdlVerificationRequests.userId, userId))
    .orderBy(desc(cdlVerificationRequests.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingCdlVerifications(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(cdlVerificationRequests)
    .where(eq(cdlVerificationRequests.status, "pending"))
    .orderBy(cdlVerificationRequests.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function approveCdlVerification(requestId: number, reviewerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const request = await db.select().from(cdlVerificationRequests)
    .where(eq(cdlVerificationRequests.id, requestId))
    .limit(1);
  
  if (request.length === 0) throw new Error("Request not found");
  
  await db.update(cdlVerificationRequests)
    .set({
      status: "approved",
      reviewedById: reviewerId,
      reviewedAt: new Date()
    })
    .where(eq(cdlVerificationRequests.id, requestId));
  
  // Update user's CDL verified status
  await db.update(users)
    .set({ cdlVerified: true })
    .where(eq(users.id, request[0].userId));
  
  return true;
}

export async function rejectCdlVerification(requestId: number, reviewerId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cdlVerificationRequests)
    .set({
      status: "rejected",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason
    })
    .where(eq(cdlVerificationRequests.id, requestId));
  
  return true;
}

// ============ POST MEDIA FUNCTIONS ============

export async function addPostMedia(data: InsertPostMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(postMedia).values(data);
  return result.insertId;
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
    updateData.cdlVerified = true;
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
    cdlVerified: users.cdlVerified,
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
    ));
  
  return result[0].affectedRows;
}

export async function getAllPendingVerifications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users with submitted verification requests
  const requests = await db.select({
    request: cdlVerificationRequests,
    user: users
  })
    .from(cdlVerificationRequests)
    .innerJoin(users, eq(cdlVerificationRequests.userId, users.id))
    .where(eq(cdlVerificationRequests.status, "pending"))
    .orderBy(cdlVerificationRequests.createdAt)
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
