import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Upload, FileText } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CDLVerification() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const verificationStatus = trpc.verification.getMyStatus.useQuery();
  const submitVerification = trpc.verification.submit.useMutation({
    onSuccess: () => {
      toast.success("CDL verification submitted successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
      verificationStatus.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to S3
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const { url } = await uploadResponse.json();

      // Submit verification
      await submitVerification.mutateAsync({
        cdlNumber: (document.getElementById("cdlNumber") as HTMLInputElement)?.value || "",
        cdlState: (document.getElementById("cdlState") as HTMLInputElement)?.value || "",
        cdlClass: (document.getElementById("cdlClass") as HTMLInputElement)?.value || "",
        endorsements: (document.getElementById("endorsements") as HTMLInputElement)?.value || "",
        cdlImageUrl: url,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const status = verificationStatus.data?.verificationStatus;
  const cdlRequest = verificationStatus.data?.cdlRequest;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CDL Verification</h1>
          <p className="text-muted-foreground">
            Upload your Commercial Driver License to get verified on TCsocial
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 mb-8">
          {status === "verified" && (
            <Card className="p-4 border-green-500/50 bg-green-500/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-500">Verified</h3>
                  <p className="text-sm text-muted-foreground">
                    Your CDL has been verified. You can now access all verified driver features.
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
                    Your CDL is under review. We'll notify you once it's verified.
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
                    Your verification has been suspended. Please contact support for more information.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Upload Form - Only show if not verified */}
        {status !== "verified" && status !== "submitted" && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Upload Your CDL</h2>

            <form className="space-y-6">
              {/* CDL Number */}
              <div>
                <label className="block text-sm font-medium mb-2">CDL Number</label>
                <input
                  id="cdlNumber"
                  type="text"
                  placeholder="Enter your CDL number"
                  className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* CDL State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    id="cdlState"
                    type="text"
                    placeholder="CA"
                    maxLength={2}
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {/* CDL Class */}
                <div>
                  <label className="block text-sm font-medium mb-2">Class</label>
                  <select
                    id="cdlClass"
                    className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select Class</option>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                  </select>
                </div>
              </div>

              {/* Endorsements */}
              <div>
                <label className="block text-sm font-medium mb-2">Endorsements (Optional)</label>
                <input
                  id="endorsements"
                  type="text"
                  placeholder="e.g., H, X, T"
                  className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">CDL Document</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-red-600 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    {selectedFile ? (
                      <div>
                        <FileText className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">
                          JPEG, PNG or PDF (max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Preview</label>
                  <img
                    src={previewUrl}
                    alt="CDL Preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-border"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || submitVerification.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isUploading || submitVerification.isPending ? "Uploading..." : "Submit for Verification"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your CDL information will be securely stored and only used for verification purposes.
              </p>
            </form>
          </Card>
        )}

        {/* Verification History */}
        {cdlRequest && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Verification History</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{cdlRequest.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CDL Number:</span>
                <span className="font-medium">{cdlRequest.cdlNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State:</span>
                <span className="font-medium">{cdlRequest.cdlState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class:</span>
                <span className="font-medium">{cdlRequest.cdlClass}</span>
              </div>
              {cdlRequest.endorsements && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endorsements:</span>
                  <span className="font-medium">{cdlRequest.endorsements}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">
                  {new Date(cdlRequest.createdAt).toLocaleDateString()}
                </span>
              </div>
              {cdlRequest.rejectionReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejection Reason:</span>
                  <span className="font-medium text-red-500">{cdlRequest.rejectionReason}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
