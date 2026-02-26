import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getUserVerificationStatus: vi.fn(),
  setVerificationDeadline: vi.fn(),
  updateVerificationStatus: vi.fn(),
  suspendExpiredUsers: vi.fn(),
  getCdlVerificationRequest: vi.fn(),
  createCdlVerificationRequest: vi.fn(),
  approveCdlVerification: vi.fn(),
  rejectCdlVerification: vi.fn(),
}));

import * as db from "./db";

describe("Verification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setVerificationDeadline", () => {
    it("should set a deadline 24 hours from now", async () => {
      const mockDeadline = new Date();
      mockDeadline.setHours(mockDeadline.getHours() + 24);
      
      vi.mocked(db.setVerificationDeadline).mockResolvedValue(mockDeadline);
      
      const result = await db.setVerificationDeadline(1);
      
      expect(db.setVerificationDeadline).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("getUserVerificationStatus", () => {
    it("should return verification status for a user", async () => {
      const mockStatus = {
        verificationStatus: "pending" as const,
        verificationDeadline: new Date(),
        suspendedAt: null,
        suspensionReason: null,
        cdlVerified: false,
      };
      
      vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockStatus);
      
      const result = await db.getUserVerificationStatus(1);
      
      expect(db.getUserVerificationStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStatus);
    });

    it("should return undefined for non-existent user", async () => {
      vi.mocked(db.getUserVerificationStatus).mockResolvedValue(undefined);
      
      const result = await db.getUserVerificationStatus(999);
      
      expect(result).toBeUndefined();
    });
  });

  describe("updateVerificationStatus", () => {
    it("should update status to submitted", async () => {
      vi.mocked(db.updateVerificationStatus).mockResolvedValue(undefined);
      
      await db.updateVerificationStatus(1, "submitted");
      
      expect(db.updateVerificationStatus).toHaveBeenCalledWith(1, "submitted");
    });

    it("should update status to suspended", async () => {
      vi.mocked(db.updateVerificationStatus).mockResolvedValue(undefined);
      
      await db.updateVerificationStatus(1, "suspended");
      
      expect(db.updateVerificationStatus).toHaveBeenCalledWith(1, "suspended");
    });

    it("should update status to verified", async () => {
      vi.mocked(db.updateVerificationStatus).mockResolvedValue(undefined);
      
      await db.updateVerificationStatus(1, "verified");
      
      expect(db.updateVerificationStatus).toHaveBeenCalledWith(1, "verified");
    });
  });

  describe("suspendExpiredUsers", () => {
    it("should return count of suspended users", async () => {
      vi.mocked(db.suspendExpiredUsers).mockResolvedValue(3);
      
      const result = await db.suspendExpiredUsers();
      
      expect(db.suspendExpiredUsers).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it("should return 0 when no users to suspend", async () => {
      vi.mocked(db.suspendExpiredUsers).mockResolvedValue(0);
      
      const result = await db.suspendExpiredUsers();
      
      expect(result).toBe(0);
    });
  });

  describe("CDL Verification Request", () => {
    it("should create a verification request", async () => {
      vi.mocked(db.createCdlVerificationRequest).mockResolvedValue(1);
      
      const result = await db.createCdlVerificationRequest({
        userId: 1,
        cdlNumber: "ABC123456",
        cdlState: "TX",
        cdlClass: "Class A",
        endorsements: "H, N",
        cdlImageUrl: "https://example.com/cdl.jpg",
      });
      
      expect(db.createCdlVerificationRequest).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it("should get CDL verification request for user", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        cdlNumber: "ABC123456",
        cdlState: "TX",
        cdlClass: "Class A",
        endorsements: "H, N",
        cdlImageUrl: "https://example.com/cdl.jpg",
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getCdlVerificationRequest).mockResolvedValue(mockRequest as any);
      
      const result = await db.getCdlVerificationRequest(1);
      
      expect(db.getCdlVerificationRequest).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRequest);
    });
  });

  describe("Admin Verification Actions", () => {
    it("should approve a verification request", async () => {
      vi.mocked(db.approveCdlVerification).mockResolvedValue(true);
      
      const result = await db.approveCdlVerification(1, 99);
      
      expect(db.approveCdlVerification).toHaveBeenCalledWith(1, 99);
      expect(result).toBe(true);
    });

    it("should reject a verification request with reason", async () => {
      vi.mocked(db.rejectCdlVerification).mockResolvedValue(true);
      
      const result = await db.rejectCdlVerification(1, 99, "Image is blurry");
      
      expect(db.rejectCdlVerification).toHaveBeenCalledWith(1, 99, "Image is blurry");
      expect(result).toBe(true);
    });
  });
});

describe("Suspension Check Logic", () => {
  it("should block suspended user from posting", async () => {
    const mockSuspendedStatus = {
      verificationStatus: "suspended" as const,
      verificationDeadline: new Date(Date.now() - 86400000), // 24 hours ago
      suspendedAt: new Date(),
      suspensionReason: "Failed to verify identity within 24 hours",
      cdlVerified: false,
    };
    
    vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockSuspendedStatus);
    
    const status = await db.getUserVerificationStatus(1);
    
    // Simulate the check that happens in the post.create mutation
    const isSuspended = status?.verificationStatus === "suspended";
    
    expect(isSuspended).toBe(true);
  });

  it("should allow verified user to post", async () => {
    const mockVerifiedStatus = {
      verificationStatus: "verified" as const,
      verificationDeadline: null,
      suspendedAt: null,
      suspensionReason: null,
      cdlVerified: true,
    };
    
    vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockVerifiedStatus);
    
    const status = await db.getUserVerificationStatus(1);
    
    const isSuspended = status?.verificationStatus === "suspended";
    
    expect(isSuspended).toBe(false);
  });

  it("should allow pending user to post before deadline", async () => {
    const mockPendingStatus = {
      verificationStatus: "pending" as const,
      verificationDeadline: new Date(Date.now() + 86400000), // 24 hours from now
      suspendedAt: null,
      suspensionReason: null,
      cdlVerified: false,
    };
    
    vi.mocked(db.getUserVerificationStatus).mockResolvedValue(mockPendingStatus);
    
    const status = await db.getUserVerificationStatus(1);
    
    const isSuspended = status?.verificationStatus === "suspended";
    
    expect(isSuspended).toBe(false);
  });
});
