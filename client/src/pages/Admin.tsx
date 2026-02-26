/**
 * Admin Panel for managing CDL verifications
 * Only accessible to admin users
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  UserX,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Get pending verifications
  const { data: pendingVerifications, isLoading, refetch } = trpc.cdl.getPending.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && (user as any)?.role === "admin" }
  );

  const approveMutation = trpc.cdl.approve.useMutation({
    onSuccess: () => {
      toast.success("Verification approved!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve verification");
    },
  });

  const rejectMutation = trpc.cdl.reject.useMutation({
    onSuccess: () => {
      toast.success("Verification rejected");
      refetch();
      setRejectingId(null);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject verification");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Check if user is admin
  if (!authLoading && isAuthenticated && (user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Link href="/feed">
            <Button>Go to Feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleApprove = (requestId: number) => {
    approveMutation.mutate({ requestId });
  };

  const handleReject = (requestId: number) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({ requestId, reason: rejectReason });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center gap-4 p-4">
          <Link href="/feed" className="p-2 hover:bg-secondary rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-xl">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage CDL Verifications</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
            <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingVerifications?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Approved Today</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Rejected Today</p>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Pending Verification Requests
            </h2>
          </div>

          {!pendingVerifications || pendingVerifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending verification requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingVerifications.map((request: any) => (
                <div key={request.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* CDL Image */}
                    <div 
                      className="w-32 h-20 bg-secondary rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(request.cdlImageUrl)}
                    >
                      <img
                        src={request.cdlImageUrl}
                        alt="CDL"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">User ID: {request.userId}</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p><strong>CDL #:</strong> {request.cdlNumber}</p>
                        <p><strong>State:</strong> {request.cdlState}</p>
                        <p><strong>Class:</strong> {request.cdlClass}</p>
                        <p><strong>Endorsements:</strong> {request.endorsements || "None"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedImage(request.cdlImageUrl)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={approveMutation.isPending}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectingId(request.id)}
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Reject Form */}
                  {rejectingId === request.id && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-sm font-medium mb-2">Reason for rejection:</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full bg-background rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 mb-2"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={rejectMutation.isPending}
                        >
                          Confirm Rejection
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={selectedImage}
              alt="CDL Full View"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
