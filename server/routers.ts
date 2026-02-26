import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USER ROUTES ============
  user: router({
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),
    
    getByHandle: publicProcedure
      .input(z.object({ handle: z.string() }))
      .query(async ({ input }) => {
        return db.getUserByHandle(input.handle);
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        handle: z.string().min(3).max(50).optional(),
        bio: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
        avatarUrl: z.string().optional(),
        headerUrl: z.string().optional(),
        truckType: z.string().max(50).optional(),
        yearsExperience: z.number().min(0).max(50).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.searchUsers(input.query, input.limit);
      }),
    
    getFollowCounts: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowCounts(input.userId);
      }),
  }),

  // ============ FILE UPLOAD ROUTES ============
  upload: router({
    image: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `uploads/${ctx.user.id}/images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
    
    video: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("video/mp4"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "mp4";
        const key = `uploads/${ctx.user.id}/videos/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
    
    avatar: protectedProcedure
      .input(z.object({
        base64: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `uploads/${ctx.user.id}/avatar-${nanoid()}.jpg`;
        const { url } = await storagePut(key, buffer, input.contentType);
        // Update user profile with new avatar
        await db.updateUserProfile(ctx.user.id, { avatarUrl: url });
        return { url };
      }),
    
    header: protectedProcedure
      .input(z.object({
        base64: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `uploads/${ctx.user.id}/header-${nanoid()}.jpg`;
        const { url } = await storagePut(key, buffer, input.contentType);
        // Update user profile with new header
        await db.updateUserProfile(ctx.user.id, { headerUrl: url });
        return { url };
      }),
  }),

  // ============ POST ROUTES ============
  post: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1).max(500),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        replyToId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is suspended
        const status = await db.getUserVerificationStatus(ctx.user.id);
        if (status?.verificationStatus === 'suspended') {
          throw new Error('Your account is suspended. Please verify your identity to continue using TCsocial.');
        }
        const postId = await db.createPost({
          userId: ctx.user.id,
          content: input.content,
          imageUrl: input.imageUrl,
          videoUrl: input.videoUrl,
          replyToId: input.replyToId,
        });
        
        // Create notification for reply
        if (input.replyToId) {
          const originalPost = await db.getPostById(input.replyToId);
          if (originalPost) {
            await db.createNotification({
              userId: originalPost.userId,
              type: "reply",
              actorId: ctx.user.id,
              postId: postId,
            });
            await db.incrementPostCount(input.replyToId, 'repliesCount');
          }
        }
        
        return { postId };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPostById(input.id);
      }),
    
    getFeed: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getFeedPosts(ctx.user.id, input.limit, input.offset);
      }),
    
    getExplore: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getExplorePosts(input.limit, input.offset);
      }),
    
    getUserPosts: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getUserPosts(input.userId, input.limit, input.offset);
      }),
    
    delete: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePost(input.postId, ctx.user.id);
        return { success: true };
      }),
    
    repost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const originalPost = await db.getPostById(input.postId);
        if (!originalPost) throw new Error("Post not found");
        
        const repostId = await db.createPost({
          userId: ctx.user.id,
          content: originalPost.content,
          imageUrl: originalPost.imageUrl,
          repostOfId: input.postId,
        });
        
        await db.incrementPostCount(input.postId, 'repostsCount');
        
        await db.createNotification({
          userId: originalPost.userId,
          type: "repost",
          actorId: ctx.user.id,
          postId: input.postId,
        });
        
        return { repostId };
      }),
    
    getMedia: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getPostMedia(input.postId);
      }),
  }),

  // ============ LIKE ROUTES ============
  like: router({
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.likePost(ctx.user.id, input.postId);
        if (liked) {
          const post = await db.getPostById(input.postId);
          if (post) {
            await db.createNotification({
              userId: post.userId,
              type: "like",
              actorId: ctx.user.id,
              postId: input.postId,
            });
          }
          return { liked: true };
        } else {
          await db.unlikePost(ctx.user.id, input.postId);
          return { liked: false };
        }
      }),
    
    getUserLikes: protectedProcedure
      .input(z.object({ postIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const likes = await db.getUserLikes(ctx.user.id, input.postIds);
        return likes.map(l => l.postId);
      }),
  }),

  // ============ BOOKMARK ROUTES ============
  bookmark: router({
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const bookmarked = await db.bookmarkPost(ctx.user.id, input.postId);
        if (!bookmarked) {
          await db.unbookmarkPost(ctx.user.id, input.postId);
          return { bookmarked: false };
        }
        return { bookmarked: true };
      }),
    
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getUserBookmarks(ctx.user.id, input.limit, input.offset);
      }),
    
    getUserBookmarks: protectedProcedure
      .input(z.object({ postIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const bookmarks = await db.getUserBookmarkIds(ctx.user.id, input.postIds);
        return bookmarks.map(b => b.postId);
      }),
  }),

  // ============ FOLLOW ROUTES ============
  follow: router({
    toggle: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const followed = await db.followUser(ctx.user.id, input.userId);
        if (followed) {
          await db.createNotification({
            userId: input.userId,
            type: "follow",
            actorId: ctx.user.id,
          });
          return { following: true };
        } else {
          await db.unfollowUser(ctx.user.id, input.userId);
          return { following: false };
        }
      }),
    
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),
    
    getFollowers: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getFollowers(input.userId, input.limit, input.offset);
      }),
    
    getFollowing: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getFollowing(input.userId, input.limit, input.offset);
      }),
  }),

  // ============ MESSAGE ROUTES ============
  message: router({
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserConversations(ctx.user.id);
      }),
    
    getOrCreateConversation: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.getOrCreateConversation(ctx.user.id, input.userId);
        return { conversationId };
      }),
    
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getConversationMessages(input.conversationId, input.limit, input.offset);
      }),
    
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is suspended
        const status = await db.getUserVerificationStatus(ctx.user.id);
        if (status?.verificationStatus === 'suspended') {
          throw new Error('Your account is suspended. Please verify your identity to continue using TCsocial.');
        }
        
        const messageId = await db.sendMessage(
          input.conversationId,
          ctx.user.id,
          input.content,
          input.imageUrl
        );
        
        // Create notification for other participants
        const participants = await db.getConversationParticipants(input.conversationId);
        for (const participant of participants) {
          if (participant.id !== ctx.user.id) {
            await db.createNotification({
              userId: participant.id,
              type: "message",
              actorId: ctx.user.id,
              messageId: messageId,
            });
          }
        }
        
        return { messageId };
      }),
    
    getParticipants: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getConversationParticipants(input.conversationId);
      }),
  }),

  // ============ NOTIFICATION ROUTES ============
  notification: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit, input.offset);
      }),
    
    markRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markNotificationsRead(ctx.user.id);
        return { success: true };
      }),
    
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUnreadNotificationCount(ctx.user.id);
      }),
  }),

  // ============ CDL ADMIN ROUTES ============
  cdl: router({
    // Admin routes
    getPending: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Admin access required");
        }
        return db.getPendingCdlVerifications(input.limit, input.offset);
      }),
    
    approve: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Admin access required");
        }
        await db.approveCdlVerification(input.requestId, ctx.user.id);
        return { success: true };
      }),
    
    reject: protectedProcedure
      .input(z.object({ requestId: z.number(), reason: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Admin access required");
        }
        await db.rejectCdlVerification(input.requestId, ctx.user.id, input.reason);
        return { success: true };
      }),
  }),

  // ============ VERIFICATION ROUTES ============
  verification: router({
    getMyStatus: protectedProcedure
      .query(async ({ ctx }) => {
        const verificationStatus = await db.getUserVerificationStatus(ctx.user.id);
        const cdlRequest = await db.getCdlVerificationRequest(ctx.user.id);
        return {
          ...verificationStatus,
          cdlRequest
        };
      }),
    
    submit: protectedProcedure
      .input(z.object({
        cdlNumber: z.string().min(5).max(50),
        cdlState: z.string().length(2),
        cdlClass: z.string(),
        endorsements: z.string().optional(),
        cdlImageUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is suspended
        const status = await db.getUserVerificationStatus(ctx.user.id);
        if (status?.verificationStatus === 'suspended') {
          throw new Error('Your account is suspended. Please contact support.');
        }
        
        // Check if user already has a pending request
        const existing = await db.getCdlVerificationRequest(ctx.user.id);
        if (existing?.status === 'pending') {
          throw new Error('You already have a pending verification request');
        }
        
        const requestId = await db.createCdlVerificationRequest({
          userId: ctx.user.id,
          cdlNumber: input.cdlNumber,
          cdlState: input.cdlState,
          cdlClass: input.cdlClass,
          endorsements: input.endorsements,
          cdlImageUrl: input.cdlImageUrl,
        });
        
        // Update user status to submitted
        await db.updateVerificationStatus(ctx.user.id, 'submitted');
        
        // Notify owner about new verification request
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: '🚛 New CDL Verification Request',
          content: `User ${ctx.user.name || 'Unknown'} (ID: ${ctx.user.id}) has submitted a CDL verification request.\n\nCDL Number: ${input.cdlNumber}\nState: ${input.cdlState}\nClass: ${input.cdlClass}\n\nPlease review in the admin panel.`
        });
        
        return { requestId };
      }),
    
    getDeadline: protectedProcedure
      .query(async ({ ctx }) => {
        const status = await db.getUserVerificationStatus(ctx.user.id);
        return {
          deadline: status?.verificationDeadline,
          status: status?.verificationStatus,
          isSuspended: status?.verificationStatus === 'suspended'
        };
      }),
  }),

  // ============ CONVOY ROUTES ============
  convoy: router({
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getConvoys(input.limit, input.offset);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getConvoyById(input.id);
      }),
    
    join: protectedProcedure
      .input(z.object({ convoyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const joined = await db.joinConvoy(ctx.user.id, input.convoyId);
        return { joined };
      }),
    
    leave: protectedProcedure
      .input(z.object({ convoyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const left = await db.leaveConvoy(ctx.user.id, input.convoyId);
        return { left };
      }),
    
    getUserConvoys: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserConvoys(ctx.user.id);
      }),
    
     isMember: protectedProcedure
      .input(z.object({ convoyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isConvoyMember(ctx.user.id, input.convoyId);
      }),
  }),

  // ============ PUSH NOTIFICATION ROUTES ============
  pushNotification: router({
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
        keys: z.object({
          auth: z.string(),
          p256dh: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.savePushSubscription(ctx.user.id, input);
        return { success: true };
      }),
    
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        await db.deletePushSubscription(input.endpoint);
        return { success: true };
      }),
    
    getSubscriptions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getPushSubscriptions(ctx.user.id);
      }),
  }),
});
export type AppRouter = typeof appRouter;
