/**
 * LinkPreview component - Renders URLs as clickable links with rich previews
 * Supports: YouTube, Facebook, Twitter/X, direct images, direct videos
 */

import { useState } from "react";
import { ExternalLink, Image as ImageIcon, Play, X } from "lucide-react";
import LinkPreviewCard from "./LinkPreviewCard";

interface LinkPreviewProps {
  text: string;
  className?: string;
  edgeToEdge?: boolean;
  // Server-fetched OG data stored with the post
  ogData?: {
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkDescription?: string | null;
    linkImage?: string | null;
    linkSiteName?: string | null;
  } | null;
}

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Check if URL is an image
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

// Check if URL is a video file
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

// Check if URL is YouTube
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

// Get YouTube video ID
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

// Check if URL is Facebook
function isFacebookUrl(url: string): boolean {
  return url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch');
}

// Check if URL is Twitter/X
function isTwitterUrl(url: string): boolean {
  return url.includes('twitter.com') || url.includes('x.com');
}

// Get favicon URL for a domain
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return '';
  }
}

// Get platform-specific icon/thumbnail
function getPlatformThumbnail(url: string): string {
  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }
  if (isFacebookUrl(url)) {
    return 'https://www.facebook.com/images/fb_icon_325x325.png';
  }
  if (isTwitterUrl(url)) {
    return 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png';
  }
  return getFaviconUrl(url);
}

// Get platform name
function getPlatformName(url: string): string {
  if (isYouTubeUrl(url)) return 'YouTube';
  if (isFacebookUrl(url)) return 'Facebook';
  if (isTwitterUrl(url)) return 'X (Twitter)';
  return getDomain(url);
}

export function LinkPreview({ text, className = "", edgeToEdge = false, ogData }: LinkPreviewProps) {
  // When edgeToEdge, cards break out of the indented content column to span full post width
  const cardWrap = edgeToEdge ? "-ml-[76px] w-[calc(100%+92px)]" : "";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // If we have OG data, strip the URL from displayed text so it doesn't show raw
  const displayText = ogData?.linkUrl
    ? text.replace(ogData.linkUrl, "").trim()
    : text;

  // Split text by URLs and create elements
  const parts = displayText.split(URL_REGEX);
  const urls = displayText.match(URL_REGEX) || [];

  // Render text with clickable links
  const renderContent = () => {
    return parts.map((part, index) => {
      // Check if this part is a URL
      if (part.match(URL_REGEX)) {
        const url = part;
        const isImage = isImageUrl(url);

        return (
          <span key={index} className="inline">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 break-all"
              onClick={(e) => {
                if (isImage) {
                  e.preventDefault();
                  setPreviewUrl(url);
                  setShowImagePreview(true);
                }
              }}
            >
              {isImage ? (
                <>
                  <ImageIcon className="h-3 w-3 inline flex-shrink-0" />
                  <span className="truncate max-w-[200px] inline-block align-bottom">{getDomain(url)}</span>
                </>
              ) : (
                <>
                  <img 
                    src={getFaviconUrl(url)} 
                    alt="" 
                    className="h-4 w-4 inline flex-shrink-0 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="break-all">{url.length > 50 ? getDomain(url) : url}</span>
                  <ExternalLink className="h-3 w-3 inline flex-shrink-0" />
                </>
              )}
            </a>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Extract first URL for preview card
  const firstUrl = urls[0];
  const firstUrlIsImage = firstUrl && isImageUrl(firstUrl);
  const firstUrlIsVideo = firstUrl && isVideoUrl(firstUrl);
  const firstUrlIsYouTube = firstUrl && isYouTubeUrl(firstUrl);

  return (
    <div className={className}>
      {/* Text with inline links */}
      <div className="whitespace-pre-wrap break-words">
        {renderContent()}
      </div>

      {/* Direct image preview */}
      {firstUrlIsImage && (
        <div className={cardWrap}>
          <div className="mt-3 rounded-xl overflow-hidden border border-border">
            <img
              src={firstUrl}
              alt="Linked image"
              className="w-full max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                setPreviewUrl(firstUrl);
                setShowImagePreview(true);
              }}
              onError={(e) => {
                e.currentTarget.parentElement!.parentElement!.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Direct video preview */}
      {firstUrlIsVideo && (
        <div className={cardWrap}>
          <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black">
            <video
              src={firstUrl}
              controls
              className="w-full max-h-96"
              poster=""
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      {/* YouTube embed preview */}
      {firstUrlIsYouTube && (
        <div className={cardWrap}>
          <div className="mt-3 rounded-xl overflow-hidden border border-border">
            {!showVideoPlayer ? (
              <div
                className="relative cursor-pointer group"
                onClick={() => setShowVideoPlayer(true)}
              >
                <img
                  src={getPlatformThumbnail(firstUrl)}
                  alt="YouTube video thumbnail"
                  className="w-full h-48 sm:h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/640x360?text=Video';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://www.youtube.com/favicon.ico"
                      alt="YouTube"
                      className="h-5 w-5"
                    />
                    <span className="text-white text-sm font-medium">Watch on YouTube</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative pt-[56.25%]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(firstUrl)}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* OG preview card — uses server-fetched data when available */}
      {ogData?.linkUrl && (
        <div className={cardWrap}>
          <LinkPreviewCard
            url={ogData.linkUrl}
            title={ogData.linkTitle}
            description={ogData.linkDescription}
            image={ogData.linkImage}
            siteName={ogData.linkSiteName}
          />
        </div>
      )}

      {/* Fallback card for links without OG data (uses platform thumbnail) */}
      {!ogData?.linkUrl && firstUrl && !firstUrlIsImage && !firstUrlIsVideo && !firstUrlIsYouTube && (
        <div className={cardWrap}>
          <LinkPreviewCard
            url={firstUrl}
            image={isYouTubeUrl(firstUrl) ? getPlatformThumbnail(firstUrl) : null}
            siteName={getPlatformName(firstUrl)}
          />
        </div>
      )}

      {/* Full-screen image preview modal */}
      {showImagePreview && previewUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <button
            onClick={() => setShowImagePreview(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-full flex items-center gap-2 hover:bg-primary/90 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
            Open Original
          </a>
        </div>
      )}
    </div>
  );
}

export default LinkPreview;
