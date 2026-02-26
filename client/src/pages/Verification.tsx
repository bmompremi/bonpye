/**
 * Allows drivers to submit CDL for verification
 * Includes 24-hour deadline countdown and suspension handling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Moon,
  Shield,
  Sun,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Verification() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  
  const [cdlNumber, setCdlNumber] = useState("");
  const [cdlState, setCdlState] = useState("");
  const [cdlClass, setCdlClass] = useState("");
  const [endorsements, setEndorsements] = useState("");
  const [cdlImage, setCdlImage] = useState<File | null>(null);
  const [cdlImagePreview, setCdlImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check verification status
  const { data: verificationStatus, isLoading: statusLoading, refetch: refetchStatus } = trpc.verification.getMyStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Get deadline info
  const { data: deadlineInfo, refetch: refetchDeadline } = trpc.verification.getDeadline.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const uploadImage = trpc.upload.image.useMutation();
  const submitVerification = trpc.verification.submit.useMutation({
    onSuccess: () => {
      toast.success("Verification request submitted! You will be notified once reviewed.");
      refetchStatus();
      refetchDeadline();
      setCdlNumber("");
      setCdlState("");
      setCdlClass("");
      setEndorsements("");
      setCdlImage(null);
      setCdlImagePreview(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification");
    },
  });

  // Countdown timer for deadline
  useEffect(() => {
    if (!deadlineInfo?.deadline) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(deadlineInfo.deadline as string | number | Date).getTime();
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeRemaining("Expired");
        refetchDeadline();
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [deadlineInfo?.deadline, refetchDeadline]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCdlImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCdlImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!cdlNumber || !cdlState || !cdlClass || !cdlImage) {
      toast.error("Please fill in all required fields and upload your CDL image");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload CDL image
      const base64 = await fileToBase64(cdlImage);
      const uploadResult = await uploadImage.mutateAsync({
        base64,
        filename: cdlImage.name,
        contentType: cdlImage.type,
      });

      // Submit verification request
      await submitVerification.mutateAsync({
        cdlNumber,
        cdlState,
        cdlClass,
        endorsements: endorsements || undefined,
        cdlImageUrl: uploadResult.url,
      });
    } catch (error) {
      console.error("Verification submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const CDL_CLASSES = ["Class A", "Class B", "Class C"];

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if account is suspended
  const isSuspended = deadlineInfo?.isSuspended || verificationStatus?.verificationStatus === "suspended";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center gap-4 p-4">
          <Link href="/settings" className="p-2 hover:bg-secondary rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-xl">CDL Verification</h1>
            <p className="text-sm text-muted-foreground">Get your verified badge</p>
          </div>
          <button
            onClick={toggleTheme}
            className="ml-auto p-2 hover:bg-secondary rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Account Suspended Warning */}
        {isSuspended && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/30 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-red-500">Account Suspended</h2>
                <p className="text-red-400">Your account has been suspended due to failed verification</p>
              </div>
            </div>
            <p className="text-sm text-red-300 mb-4">
              You did not complete identity verification within the required 24-hour window.
              Your account is now suspended and you cannot post, message, or interact with other users.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact support at <span className="text-primary">support@tcsocial.com</span> to restore your account.
            </p>
          </div>
        )}

        {/* Verification Deadline Warning */}
        {!isSuspended && deadlineInfo?.deadline && verificationStatus?.verificationStatus === "pending" && (
          <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/30 rounded-full animate-pulse">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-yellow-500">Verification Required</h2>
                <p className="text-yellow-400">Complete verification to keep your account active</p>
              </div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Time remaining to verify:</p>
              <p className="text-3xl font-bold text-yellow-500 font-mono">{timeRemaining || "Loading..."}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> You must upload your CDL or ID within 24 hours of signing up.
              Failure to verify will result in account suspension.
            </p>
          </div>
        )}

        {/* Already Verified */}
        {verificationStatus?.cdlVerified && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <BadgeCheck className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-green-500">You're Verified!</h2>
                <p className="text-muted-foreground">Your CDL has been verified</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile now displays the verified badge, showing other drivers that you're a real CDL holder.
            </p>
          </div>
        )}

        {/* Pending Verification Review */}
        {verificationStatus?.cdlRequest?.status === "pending" && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-blue-500">Under Review</h2>
                <p className="text-muted-foreground">Your verification request is being reviewed</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              We're reviewing your CDL verification request. This usually takes 1-3 business days.
              You'll receive a notification once your verification is complete.
            </p>
          </div>
        )}

        {/* Rejected Verification */}
        {verificationStatus?.cdlRequest?.status === "rejected" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-red-500">Verification Rejected</h2>
                <p className="text-muted-foreground">Your previous request was not approved</p>
              </div>
            </div>
            {verificationStatus.cdlRequest?.rejectionReason && (
              <p className="text-sm text-muted-foreground mb-4">
                Reason: {verificationStatus.cdlRequest.rejectionReason}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              You can submit a new verification request below with corrected information.
            </p>
          </div>
        )}

        {/* Verification Form */}
        {!isSuspended && !verificationStatus?.cdlVerified && verificationStatus?.cdlRequest?.status !== "pending" && (
          <>
            {/* Benefits Section */}
            <div className="bg-secondary rounded-2xl p-6 mb-6">
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Why Get Verified?
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Display the verified badge on your profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Build trust with other drivers in the community</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Access verified-only features and groups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Keep your account active and avoid suspension</span>
                </li>
              </ul>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Submit Your CDL
              </h2>

              <div className="space-y-4">
                {/* CDL Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">CDL Number *</label>
                  <input
                    type="text"
                    value={cdlNumber}
                    onChange={(e) => setCdlNumber(e.target.value)}
                    placeholder="Enter your CDL number"
                    className="w-full bg-secondary rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium mb-2">Issuing State *</label>
                  <select
                    value={cdlState}
                    onChange={(e) => setCdlState(e.target.value)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* CDL Class */}
                <div>
                  <label className="block text-sm font-medium mb-2">CDL Class *</label>
                  <select
                    value={cdlClass}
                    onChange={(e) => setCdlClass(e.target.value)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select class</option>
                    {CDL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Endorsements */}
                <div>
                  <label className="block text-sm font-medium mb-2">Endorsements (Optional)</label>
                  <input
                    type="text"
                    value={endorsements}
                    onChange={(e) => setEndorsements(e.target.value)}
                    placeholder="e.g., H, N, P, T, X"
                    className="w-full bg-secondary rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* CDL Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">CDL Photo *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {cdlImagePreview ? (
                    <div className="relative">
                      <img
                        src={cdlImagePreview}
                        alt="CDL Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setCdlImage(null);
                          setCdlImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload CDL photo</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG up to 10MB</span>
                    </button>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Privacy Notice:</strong> Your CDL information is securely stored and only used for verification purposes.
                    We will never share your personal information with third parties.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !cdlNumber || !cdlState || !cdlClass || !cdlImage}
                  className="w-full py-6 rounded-xl font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
