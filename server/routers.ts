import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import axios from "axios";

// Fetch Open Graph / link preview metadata from a URL
async function fetchLinkPreview(url: string) {
  try {
    const res = await axios.get(url, {
      timeout: 6000,
      maxRedirects: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BONPYEBot/1.0; +https://bonpye.com)",
        "Accept": "text/html",
      },
      responseType: "text",
    });
    const html: string = res.data;
    const get = (patterns: RegExp[]) => {
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
      }
      return null;
    };
    const title = get([
      /property="og:title"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:title"/i,
      /<title[^>]*>([^<]{1,200})<\/title>/i,
    ]);
    const description = get([
      /property="og:description"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:description"/i,
      /name="description"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+name="description"/i,
    ]);
    const image = get([
      /property="og:image"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:image"/i,
      /property="og:image:url"\s+content="([^"]+)"/i,
    ]);
    const siteName = get([
      /property="og:site_name"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:site_name"/i,
    ]);
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return { title, description, image, siteName: siteName || domain, url };
  } catch {
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,

  // Public link preview fetcher (used by post composer)
  linkPreview: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      return fetchLinkPreview(input.url);
    }),

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
        position: z.string().max(50).optional(),
        club: z.string().max(100).optional(),
        nationality: z.string().max(80).optional(),
        preferredFoot: z.enum(["left", "right", "both"]).optional(),
        age: z.number().min(10).max(60).optional(),
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
        const key = `images/${ctx.user.id}/${nanoid()}.${ext}`;
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
        const key = `videos/${ctx.user.id}/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),

    audio: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("audio/webm"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "webm";
        const key = `audio/${ctx.user.id}/${nanoid()}.${ext}`;
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
        const key = `avatars/${ctx.user.id}-${nanoid()}.jpg`;
        const { url } = await storagePut(key, buffer, input.contentType);
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
        const key = `headers/${ctx.user.id}-${nanoid()}.jpg`;
        const { url } = await storagePut(key, buffer, input.contentType);
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
        // Auto-detect URL in content and fetch link preview
        const urlMatch = input.content.match(/https?:\/\/[^\s]+/);
        let linkData: { linkUrl?: string; linkTitle?: string; linkDescription?: string; linkImage?: string; linkSiteName?: string } = {};
        if (urlMatch && !input.imageUrl && !input.videoUrl) {
          const preview = await fetchLinkPreview(urlMatch[0]);
          if (preview) {
            linkData = {
              linkUrl: preview.url,
              linkTitle: preview.title || undefined,
              linkDescription: preview.description || undefined,
              linkImage: preview.image || undefined,
              linkSiteName: preview.siteName || undefined,
            };
          }
        }

        const postId = await db.createPost({
          userId: ctx.user.id,
          content: input.content,
          imageUrl: input.imageUrl,
          videoUrl: input.videoUrl,
          replyToId: input.replyToId,
          ...linkData,
        });

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

        // Prevent duplicate reposts - check if user already reposted this post
        const existingRepost = await db.getExistingRepost(ctx.user.id, input.postId);
        if (existingRepost) {
          return { repostId: existingRepost.id, alreadyReposted: true };
        }

        const repostId = await db.createPost({
          userId: ctx.user.id,
          content: "",
          repostOfId: input.postId,
        });

        await db.incrementPostCount(input.postId, 'repostsCount');

        await db.createNotification({
          userId: originalPost.userId,
          type: "repost",
          actorId: ctx.user.id,
          postId: input.postId,
        });

        return { repostId, alreadyReposted: false };
      }),

    getReplies: publicProcedure
      .input(z.object({ postId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getPostReplies(input.postId, input.limit, input.offset);
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
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.sendMessage(
          input.conversationId,
          ctx.user.id,
          input.content,
          input.imageUrl,
          input.videoUrl
        );

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

  // ============ CALL ROUTES ============
  calls: router({
    initiate: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        receiverId: z.number(),
        type: z.enum(["voice", "video"]),
        callerPeerId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const record = await db.createCallRecord({
          conversationId: input.conversationId,
          callerId: ctx.user.id,
          receiverId: input.receiverId,
          type: input.type,
          callerPeerId: input.callerPeerId,
        });
        return record;
      }),

    getIncoming: protectedProcedure
      .query(async ({ ctx }) => {
        const calls = await db.getIncomingCalls(ctx.user.id);
        if (calls.length === 0) return null;
        // Enrich with caller info
        const call = calls[0];
        const caller = await db.getUserById(call.callerId);
        return {
          ...call,
          callerName: caller?.name || "Player",
          callerHandle: caller?.handle || "player",
          callerAvatar: caller?.avatarUrl || null,
        };
      }),

    answer: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCallStatus(input.callId, "connected", new Date());
        return { success: true };
      }),

    decline: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCallStatus(input.callId, "declined");
        return { success: true };
      }),

    end: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .mutation(async ({ input }) => {
        await db.endCall(input.callId);
        return { success: true };
      }),

    missed: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCallStatus(input.callId, "missed");
        return { success: true };
      }),

    getHistory: protectedProcedure
      .input(z.object({ conversationId: z.number(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.getCallHistory(input.conversationId, input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .query(async ({ input }) => {
        return db.getCallById(input.callId);
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

  // ============ VERIFICATION ROUTES ============
  verification: router({
    getMyStatus: protectedProcedure
      .query(async ({ ctx }) => {
        const verificationStatus = await db.getUserVerificationStatus(ctx.user.id);
        const playerRequest = await db.getPlayerVerificationRequest(ctx.user.id);
        return {
          ...verificationStatus,
          playerRequest,
        };
      }),

    submit: protectedProcedure
      .input(z.object({
        fullLegalName: z.string().min(2).max(150),
        dateOfBirth: z.string().max(20),
        nationality: z.string().max(80),
        currentClub: z.string().max(100).optional(),
        position: z.string().max(50),
        idDocumentUrl: z.string(),
        proofOfPlayUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getPlayerVerificationRequest(ctx.user.id);
        if (existing?.status === 'pending') {
          throw new Error('You already have a pending verification request');
        }

        const requestId = await db.createPlayerVerificationRequest({
          userId: ctx.user.id,
          fullLegalName: input.fullLegalName,
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          currentClub: input.currentClub,
          position: input.position,
          idDocumentUrl: input.idDocumentUrl,
          proofOfPlayUrl: input.proofOfPlayUrl,
        });

        await db.updateVerificationStatus(ctx.user.id, 'submitted');

        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: '⚽ New Player Verification Request',
          content: `Player ${ctx.user.name || 'Unknown'} (ID: ${ctx.user.id}) has submitted a player verification request.\n\nName: ${input.fullLegalName}\nNationality: ${input.nationality}\nPosition: ${input.position}\n\nPlease review in the admin panel.`
        });

        return { requestId };
      }),

    getPending: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        return db.getAllPendingVerifications(input.limit, input.offset);
      }),

    approve: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        await db.approvePlayerVerification(input.requestId, ctx.user.id);
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ requestId: z.number(), reason: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        await db.rejectPlayerVerification(input.requestId, ctx.user.id, input.reason);
        return { success: true };
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

  // ============ SQUAD ROUTES ============
  squad: router({
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getSquads(input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSquadById(input.id);
      }),

    join: protectedProcedure
      .input(z.object({ squadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const joined = await db.joinSquad(ctx.user.id, input.squadId);
        return { joined };
      }),

    leave: protectedProcedure
      .input(z.object({ squadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const left = await db.leaveSquad(ctx.user.id, input.squadId);
        return { left };
      }),

    getUserSquads: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserSquads(ctx.user.id);
      }),

    isMember: protectedProcedure
      .input(z.object({ squadId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isSquadMember(ctx.user.id, input.squadId);
      }),
  }),

  // ============ CLUB ROUTES ============
  club: router({
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getClubs(input.limit, input.offset);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getClubBySlug(input.slug);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClubById(input.id);
      }),

    join: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        role: z.enum(["player", "staff", "fan", "admin"]).default("fan"),
      }))
      .mutation(async ({ ctx, input }) => {
        const joined = await db.joinClub(ctx.user.id, input.clubId, input.role);
        return { joined };
      }),

    leave: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const left = await db.leaveClub(ctx.user.id, input.clubId);
        return { left };
      }),

    getMembers: publicProcedure
      .input(z.object({ clubId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getClubMembers(input.clubId, input.limit, input.offset);
      }),
  }),

  // ============ MATCH ROUTES ============
  match: router({
    getAll: publicProcedure
      .input(z.object({
        status: z.enum(["scheduled", "live", "finished", "cancelled"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getMatches(input.status, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        homeTeam: z.string().max(150),
        awayTeam: z.string().max(150),
        venue: z.string().max(200).optional(),
        competition: z.string().max(100).optional(),
        matchDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        const matchId = await db.createMatch({
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          venue: input.venue,
          competition: input.competition,
          matchDate: new Date(input.matchDate),
        });
        return { matchId };
      }),
  }),

  // ============ SCOUTING ROUTES ============
  scouting: router({
    getProfiles: publicProcedure
      .input(z.object({
        position: z.string().optional(),
        nationality: z.string().optional(),
        availableForTransfer: z.boolean().optional(),
        availableForTrial: z.boolean().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getScoutingProfiles(
          {
            position: input.position,
            nationality: input.nationality,
            availableForTransfer: input.availableForTransfer,
            availableForTrial: input.availableForTrial,
          },
          input.limit,
          input.offset
        );
      }),

    getMyProfile: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getPlayerProfile(ctx.user.id);
      }),

    upsertProfile: protectedProcedure
      .input(z.object({
        height: z.number().optional(),
        weight: z.number().optional(),
        appearances: z.number().optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        availableForTransfer: z.boolean().optional(),
        availableForTrial: z.boolean().optional(),
        agentName: z.string().max(150).optional(),
        agentContact: z.string().max(200).optional(),
        highlightUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPlayerProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============ GROUNDS ROUTES ============
  grounds: router({
    getAll: publicProcedure
      .input(z.object({
        type: z.enum(["stadium", "training_ground", "neutral_venue", "academy"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getGrounds(input.type, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getGroundById(input.id);
      }),
  }),

  // ============ SOCCER NEWS ROUTES ============
  news: router({
    getLatest: publicProcedure
      .input(z.object({ category: z.enum(["worldcup", "haiti", "all"]).default("all") }))
      .query(async ({ input }) => {
        const feeds: Record<string, string[]> = {
          worldcup: [
            "https://news.google.com/rss/search?q=FIFA+World+Cup+2026&hl=en-US&gl=US&ceid=US:en",
            "https://news.google.com/rss/search?q=World+Cup+2026+soccer&hl=en-US&gl=US&ceid=US:en",
          ],
          haiti: [
            "https://news.google.com/rss/search?q=Haiti+soccer+football&hl=en-US&gl=US&ceid=US:en",
            "https://news.google.com/rss/search?q=Haiti+national+football+team+Les+Grenadiers&hl=en-US&gl=US&ceid=US:en",
          ],
          all: [
            "https://news.google.com/rss/search?q=FIFA+World+Cup+2026&hl=en-US&gl=US&ceid=US:en",
            "https://news.google.com/rss/search?q=Haiti+soccer+football+team&hl=en-US&gl=US&ceid=US:en",
            "https://news.google.com/rss/search?q=Haiti+football+players+Les+Grenadiers&hl=en-US&gl=US&ceid=US:en",
          ],
        };

        const parseRSS = (xml: string) => {
          const items: { title: string; link: string; source: string; pubDate: string; description: string }[] = [];
          const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
          for (const match of itemMatches) {
            const block = match[1];
            const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
            const rawLink = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
              || block.match(/<link\s+[^>]*href="([^"]+)"/)?.[1] || "";
            // Google News wraps real link in the guid or a redirect — extract from url param if present
            const urlParam = rawLink.match(/[?&]url=([^&]+)/)?.[1];
            const link = urlParam ? decodeURIComponent(urlParam) : rawLink;
            const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "Soccer News";
            const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
            const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]
              ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim().slice(0, 200) || "";
            if (title && link) items.push({ title, link, source, pubDate, description });
          }
          return items;
        };

        const urls = feeds[input.category];
        const results = await Promise.allSettled(
          urls.map(async (url) => {
            const res = await axios.get(url, {
              timeout: 8000,
              headers: { "User-Agent": "Mozilla/5.0 (compatible; BONPYEBot/1.0)" },
            });
            return parseRSS(res.data as string);
          })
        );

        const allItems = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => (r as PromiseFulfilledResult<any>).value);

        // Deduplicate by title, sort newest first
        const seen = new Set<string>();
        const unique = allItems.filter((item) => {
          const key = item.title.slice(0, 60).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        unique.sort((a, b) => {
          const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const db2 = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return db2 - da;
        });

        return unique.slice(0, 40);
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
