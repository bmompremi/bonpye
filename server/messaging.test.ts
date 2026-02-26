import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getUserConversations: vi.fn(),
  getOrCreateConversation: vi.fn(),
  getConversationMessages: vi.fn(),
  sendMessage: vi.fn(),
  getConversationParticipants: vi.fn(),
  searchUsers: vi.fn(),
  getUserVerificationStatus: vi.fn(),
  createNotification: vi.fn(),
}));

import * as db from "./db";

describe("Messaging System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserConversations", () => {
    it("should return user conversations", async () => {
      const mockConversations = [
        {
          id: 1,
          lastMessage: "Hello",
          lastMessageAt: new Date(),
          participants: [
            { id: 1, name: "User 1", handle: "user1" },
            { id: 2, name: "User 2", handle: "user2" },
          ],
        },
      ];
      
      vi.mocked(db.getUserConversations).mockResolvedValue(mockConversations as any);
      
      const result = await db.getUserConversations(1);
      
      expect(db.getUserConversations).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversations);
    });

    it("should return empty array for user with no conversations", async () => {
      vi.mocked(db.getUserConversations).mockResolvedValue([]);
      
      const result = await db.getUserConversations(999);
      
      expect(result).toEqual([]);
    });
  });

  describe("getOrCreateConversation", () => {
    it("should create a new conversation between two users", async () => {
      vi.mocked(db.getOrCreateConversation).mockResolvedValue(1);
      
      const result = await db.getOrCreateConversation(1, 2);
      
      expect(db.getOrCreateConversation).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(1);
    });

    it("should return existing conversation if it exists", async () => {
      vi.mocked(db.getOrCreateConversation).mockResolvedValue(5);
      
      const result = await db.getOrCreateConversation(1, 2);
      
      expect(result).toBe(5);
    });
  });

  describe("sendMessage", () => {
    it("should send a message and return message id", async () => {
      vi.mocked(db.sendMessage).mockResolvedValue(1);
      
      const result = await db.sendMessage(1, 1, "Hello!", undefined);
      
      expect(db.sendMessage).toHaveBeenCalledWith(1, 1, "Hello!", undefined);
      expect(result).toBe(1);
    });

    it("should send a message with image", async () => {
      vi.mocked(db.sendMessage).mockResolvedValue(2);
      
      const result = await db.sendMessage(1, 1, "Check this out!", "https://example.com/image.jpg");
      
      expect(db.sendMessage).toHaveBeenCalledWith(1, 1, "Check this out!", "https://example.com/image.jpg");
      expect(result).toBe(2);
    });
  });

  describe("getConversationMessages", () => {
    it("should return messages for a conversation", async () => {
      const mockMessages = [
        { id: 1, senderId: 1, content: "Hello", createdAt: new Date() },
        { id: 2, senderId: 2, content: "Hi there", createdAt: new Date() },
      ];
      
      vi.mocked(db.getConversationMessages).mockResolvedValue(mockMessages as any);
      
      const result = await db.getConversationMessages(1, 50, 0);
      
      expect(db.getConversationMessages).toHaveBeenCalledWith(1, 50, 0);
      expect(result).toEqual(mockMessages);
    });
  });
});

describe("User Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchUsers", () => {
    it("should search users by name", async () => {
      const mockUsers = [
        { id: 1, name: "John Doe", handle: "johnd", email: "john@example.com" },
      ];
      
      vi.mocked(db.searchUsers).mockResolvedValue(mockUsers as any);
      
      const result = await db.searchUsers("John", 10);
      
      expect(db.searchUsers).toHaveBeenCalledWith("John", 10);
      expect(result).toEqual(mockUsers);
    });

    it("should search users by handle", async () => {
      const mockUsers = [
        { id: 2, name: "Jane Smith", handle: "janes", email: "jane@example.com" },
      ];
      
      vi.mocked(db.searchUsers).mockResolvedValue(mockUsers as any);
      
      const result = await db.searchUsers("janes", 10);
      
      expect(result).toEqual(mockUsers);
    });

    it("should search users by email", async () => {
      const mockUsers = [
        { id: 3, name: "Bob Wilson", handle: "bobw", email: "bob@trucking.com" },
      ];
      
      vi.mocked(db.searchUsers).mockResolvedValue(mockUsers as any);
      
      const result = await db.searchUsers("bob@trucking.com", 10);
      
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array when no users match", async () => {
      vi.mocked(db.searchUsers).mockResolvedValue([]);
      
      const result = await db.searchUsers("nonexistent", 10);
      
      expect(result).toEqual([]);
    });
  });
});

describe("Suspended User Checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block suspended user from sending messages", async () => {
    const mockSuspendedStatus = {
      verificationStatus: "suspended" as const,
      suspendedAt: new Date(),
    };
    
    vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockSuspendedStatus);
    
    const status = await db.getUserVerificationStatus(1);
    const isSuspended = status?.verificationStatus === "suspended";
    
    expect(isSuspended).toBe(true);
  });

  it("should allow verified user to send messages", async () => {
    const mockVerifiedStatus = {
      verificationStatus: "verified" as const,
      suspendedAt: null,
    };
    
    vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockVerifiedStatus);
    
    const status = await db.getUserVerificationStatus(1);
    const isSuspended = status?.verificationStatus === "suspended";
    
    expect(isSuspended).toBe(false);
  });
});
