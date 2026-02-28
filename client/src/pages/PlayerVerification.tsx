import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Upload, FileText } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const POSITIONS = [
  "Goalkeeper",
  "Right Back",
  "Centre Back",
  "Left Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Right Winger",
  "Left Winger",
  "Second Striker",
  "Striker",
];

export default function PlayerVerification() {
  const { user } = useAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullLegalName: "",
    dateOfBirth: "",
    nationality: "",
    currentClub: "",
    position: "",
  });

  const verificationStatus = trpc.verification.getMyStatus.useQuery();
  const submitVerification = trpc.verification.submit.useMutation({
    onSuccess: () => {
      toast.success("Player verification submitted successfully!");
      setIdFile(null);
      setProofFile(null);
      setIdPreviewUrl(null);
      verificationStatus.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification");
    },
  });

  const handleIdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIdFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setIdPreviewUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdPreviewUrl(null);
    }
  };

  const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setProofFile(file);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formDataUpload });
    if (!res.ok) throw new Error("Failed to upload file");
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async () => {
    if (!formData.fullLegalName || !formData.dateOfBirth || !formData.nationality || !formData.position) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!idFile) {
      toast.error("Please upload your ID document");
      return;
    }

    setIsUploading(true);
    try {
      const idDocumentUrl = await uploadFile(idFile);
      let proofOfPlayUrl: string | undefined;
      if (proofFile) {
        proofOfPlayUrl = await uploadFile(proofFile);
      }

      await submitVerification.mutateAsync({
        fullLegalName: formData.fullLegalName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        currentClub: formData.currentClub || undefined,
        position: formData.position,
        idDocumentUrl,
        proofOfPlayUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const status = verificationStatus.data?.verificationStatus;
  const playerRequest = verificationStatus.data?.playerRequest;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Player Verification</h1>
          <p className="text-muted-foreground">
            Verify your identity as a footballer to unlock the Player Verified badge on BONPYE.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 mb-8">
          {status === "verified" && (
            <Card className="p-4 border-green-500/50 bg-green-500/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-500">Player Verified ⚽</h3>
                  <p className="text-sm text-muted-foreground">
                    Your player identity has been verified. Your profile now shows the verified badge.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {status === "submitted" && (
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-yellow-500">Pending Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Your verification is under review. We'll notify you once it's approved.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {status === "suspended" && (
            <Card className="p-4 border-red-500/50 bg-red-500/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-500">Suspended</h3>
                  <p className="text-sm text-muted-foreground">
                    Your account has been suspended. Please contact support for more information.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Verification Form */}
        {status !== "verified" && status !== "submitted" && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Player Identity Form</h2>

            <div className="space-y-6">
              {/* Full Legal Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Legal Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="As it appears on your ID"
                  value={formData.fullLegalName}
                  onChange={(e) => setFormData((f) => ({ ...f, fullLegalName: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Date of Birth + Nationality */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Birth <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nationality <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brazilian"
                    value={formData.nationality}
                    onChange={(e) => setFormData((f) => ({ ...f, nationality: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Position + Current Club */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Position <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData((f) => ({ ...f, position: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select Position</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Club (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Manchester United"
                    value={formData.currentClub}
                    onChange={(e) => setFormData((f) => ({ ...f, currentClub: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* ID Document Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID Document <span className="text-primary">*</span>
                  <span className="text-muted-foreground font-normal ml-1">(Passport, National ID, or Driver's Licence)</span>
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleIdFileSelect}
                    className="hidden"
                    id="idFileInput"
                  />
                  <label htmlFor="idFileInput" className="cursor-pointer">
                    {idFile ? (
                      <div>
                        <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">{idFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(idFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">JPEG, PNG or PDF (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
                {idPreviewUrl && (
                  <img
                    src={idPreviewUrl}
                    alt="ID Preview"
                    className="w-full max-h-48 object-contain rounded-lg border border-border mt-3"
                  />
                )}
              </div>

              {/* Proof of Play Upload (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Proof of Play (Optional)
                  <span className="text-muted-foreground font-normal ml-1">(Contract, match programme, or club letter)</span>
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleProofFileSelect}
                    className="hidden"
                    id="proofFileInput"
                  />
                  <label htmlFor="proofFileInput" className="cursor-pointer">
                    {proofFile ? (
                      <div>
                        <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">{proofFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Click to upload (optional)</p>
                        <p className="text-sm text-muted-foreground">JPEG, PNG or PDF (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.fullLegalName ||
                  !formData.dateOfBirth ||
                  !formData.nationality ||
                  !formData.position ||
                  !idFile ||
                  isUploading ||
                  submitVerification.isPending
                }
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {isUploading || submitVerification.isPending ? "Submitting..." : "Submit for Verification"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your documents are securely stored and used only for identity verification. We typically review within 3–5 business days.
              </p>
            </div>
          </Card>
        )}

        {/* Verification History */}
        {playerRequest && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Verification History</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{playerRequest.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{playerRequest.fullLegalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nationality:</span>
                <span className="font-medium">{playerRequest.nationality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">{playerRequest.position}</span>
              </div>
              {playerRequest.currentClub && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Club:</span>
                  <span className="font-medium">{playerRequest.currentClub}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">
                  {new Date(playerRequest.createdAt).toLocaleDateString()}
                </span>
              </div>
              {playerRequest.rejectionReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejection Reason:</span>
                  <span className="font-medium text-red-500">{playerRequest.rejectionReason}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
