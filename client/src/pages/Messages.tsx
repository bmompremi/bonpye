/* BONPYE Messages - Direct Messaging
 * With media uploads, voice & video calls
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Image as ImageIcon,
  Film,
  Info,
  Loader2,
  Mic,
  Moon,
  Phone,
  Search,
  Send,
  Settings,
  Shield,
  Smile,
  Square,
  Sun,
  Trash2,
  Video,
  MessageSquarePlus,
  Users,
  Archive,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useCall } from "@/contexts/CallContext";
import { MediaPreview, ImageLightbox } from "@/components/MediaPreview";
import VideoPlayer from "@/components/VideoPlayer";

export default function Messages() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media upload hook
  const mediaUpload = useMediaUpload();

  // Voice note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadAudio = trpc.upload.audio.useMutation();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const ext = mimeType.includes("ogg") ? "ogg" : "webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          try {
            const result = await uploadAudio.mutateAsync({
              base64,
              filename: `voice-${Date.now()}.${ext}`,
              contentType: mimeType,
            });
            sendMessageMutation.mutate({
              conversationId: selectedConversationId!,
              content: "[voice_note]",
              videoUrl: result.url,
            });
          } catch {
            toast.error("Failed to send voice note");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [selectedConversationId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingTime(0);
  }, [isRecording]);

  // WebRTC call — uses global context so incoming calls ring on any page
  const webrtcCall = useCall();

  // Close settings dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettings]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Get conversations
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } =
    trpc.message.getConversations.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 5000,
    });

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } =
    trpc.message.getMessages.useQuery(
      { conversationId: selectedConversationId!, limit: 100, offset: 0 },
      {
        enabled: !!selectedConversationId,
        refetchInterval: 3000,
      }
    );

  // Get participants for selected conversation
  const { data: participants } = trpc.message.getParticipants.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  // Search users for new message
  const { data: searchResults } = trpc.user.search.useQuery(
    { query: userSearchQuery, limit: 10 },
    { enabled: userSearchQuery.length >= 2 }
  );

  // Send message mutation
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      mediaUpload.clearPreview();
      refetchMessages();
      refetchConversations();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Create or get conversation mutation
  const getOrCreateConversationMutation = trpc.message.getOrCreateConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      setShowNewMessageModal(false);
      setUserSearchQuery("");
      refetchConversations();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start conversation");
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !mediaUpload.preview) || !selectedConversationId) return;

    let imageUrl: string | undefined;
    let videoUrl: string | undefined;

    // Upload media if present
    if (mediaUpload.preview) {
      const result = await mediaUpload.upload();
      if (!result) return; // Upload failed
      imageUrl = result.imageUrl;
      videoUrl = result.videoUrl;
    }

    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim() || (imageUrl ? "📷 Photo" : "🎬 Video"),
      imageUrl,
      videoUrl,
    });
  };

  const handleStartConversation = (userId: number) => {
    getOrCreateConversationMutation.mutate({ userId });
  };

  const handleVoiceCall = () => {
    if (!selectedConversationId || !currentChatPartner) return;
    webrtcCall.startCall(
      selectedConversationId,
      currentChatPartner.id,
      "voice",
      currentChatPartner.name || "Player",
      currentChatPartner.avatarUrl || null
    );
  };

  const handleVideoCall = () => {
    if (!selectedConversationId || !currentChatPartner) return;
    webrtcCall.startCall(
      selectedConversationId,
      currentChatPartner.id,
      "video",
      currentChatPartner.name || "Player",
      currentChatPartner.avatarUrl || null
    );
  };

  // Get the other participant in the conversation
  const getOtherParticipant = (conv: any) => {
    if (!conv.participants) return null;
    return conv.participants.find((p: any) => p.id !== user?.id);
  };

  // Get current chat partner
  const currentChatPartner = participants?.find((p: any) => p.id !== user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground flex overflow-hidden">
      {/* Hidden file input for media upload */}
      <input
        ref={mediaUpload.fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) mediaUpload.handleFileSelect(file);
          e.target.value = "";
        }}
      />

      {/* Conversations List */}
      <div className={`w-full md:w-96 border-r border-border flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold">Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full hover:bg-secondary transition-colors ${showSettings ? "bg-secondary" : ""}`}
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Settings dropdown */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Message Settings
                    </p>

                    <button
                      onClick={() => {
                        toast.success("Message requests enabled");
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                    >
                      <Shield className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Message Requests</p>
                        <p className="text-xs text-muted-foreground">Filter unknown senders</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        toast.success("Notifications preference saved");
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                    >
                      <Bell className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-xs text-muted-foreground">Manage message alerts</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        toast("Archived messages coming soon");
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                    >
                      <Archive className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium">Archived Chats</p>
                        <p className="text-xs text-muted-foreground">View hidden conversations</p>
                      </div>
                    </button>

                    <div className="border-t border-border my-1" />

                    <button
                      onClick={() => {
                        toast("Muted conversations: none");
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                    >
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Muted Conversations</p>
                        <p className="text-xs text-muted-foreground">Manage muted chats</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        toast("Blocked contacts: none");
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">Blocked Users</p>
                        <p className="text-xs text-muted-foreground">Manage blocked accounts</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Direct Messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start a new message to connect with other players</p>
            </div>
          ) : (
            conversations
              .filter((conv: any) => {
                if (!searchQuery) return true;
                const other = getOtherParticipant(conv);
                return other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       other?.handle?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv: any) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;

                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left ${
                      selectedConversationId === conv.id ? 'bg-secondary/50' : ''
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative">
                      <img
                        src={other.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name || 'User')}&background=dc2626&color=fff`}
                        alt={other.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold truncate">
                          {other.name || 'Player'}
                        </span>
                        {other.playerVerified && (
                          <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                        )}
                        <span className="text-muted-foreground text-sm">@{other.handle || 'player'}</span>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    )}
                  </motion.button>
                );
              })
          )}
        </div>

        {/* New Message Button */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={() => setShowNewMessageModal(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-2"
          >
            <MessageSquarePlus className="h-5 w-5" />
            New Message
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 min-w-0 flex flex-col overflow-x-hidden ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversationId && currentChatPartner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div
                onClick={() => setSelectedConversationId(null)}
                className="flex items-center gap-3 hover:opacity-70 transition-opacity flex-1 cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div
                  onClick={(e) => { e.stopPropagation(); setSelectedConversationId(null); }}
                  className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <img
                  src={currentChatPartner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChatPartner.name || 'User')}&background=dc2626&color=fff`}
                  alt={currentChatPartner.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold hover:underline cursor-pointer">{currentChatPartner.name || 'Player'}</span>
                    {currentChatPartner.playerVerified && (
                      <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">@{currentChatPartner.handle || 'player'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleVoiceCall} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Phone className="h-5 w-5" />
                </button>
                <button onClick={handleVideoCall} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0 overscroll-contain">
              {/* Profile Card */}
              <div className="text-center py-8">
                <img
                  src={currentChatPartner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChatPartner.name || 'User')}&background=dc2626&color=fff`}
                  alt={currentChatPartner.name || 'User'}
                  className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                />
                <div className="font-bold text-lg flex items-center justify-center gap-1">
                  {currentChatPartner.name || 'Player'}
                  {currentChatPartner.playerVerified && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">⚽ ✓</span>
                  )}
                </div>
                <div className="text-muted-foreground">@{currentChatPartner.handle || 'player'}</div>
                {currentChatPartner.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    {currentChatPartner.bio}
                  </p>
                )}
              </div>

              {/* Messages */}
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              ) : (
                [...messages].reverse().map((msg: any) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.senderId === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary rounded-bl-sm'
                      }`}
                    >
                      {/* Image in message */}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Shared image"
                          className="rounded-xl max-w-full max-h-64 object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(msg.imageUrl)}
                        />
                      )}

                      {/* Voice note in message */}
                      {msg.videoUrl && msg.content === "[voice_note]" && (
                        <div className="flex flex-col gap-1 py-1 min-w-[200px]">
                          <div className="flex items-center gap-1 opacity-60">
                            <Mic className="h-3 w-3" />
                            <span className="text-xs">Voice note</span>
                          </div>
                          <audio
                            src={msg.videoUrl}
                            controls
                            preload="auto"
                            className="w-full"
                            style={{ minWidth: 200, height: 44 }}
                          />
                        </div>
                      )}

                      {/* Video in message */}
                      {msg.videoUrl && msg.content !== "[voice_note]" && (
                        <VideoPlayer
                          src={msg.videoUrl}
                          className="mb-2 rounded-xl"
                          maxHeight="260px"
                        />
                      )}

                      {/* Text content (hide placeholder text for media-only messages) */}
                      {msg.content && msg.content !== "📷 Photo" && msg.content !== "🎬 Video" && msg.content !== "[voice_note]" && (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Media Preview (above input) */}
            {mediaUpload.preview && (
              <div className="px-4 border-t border-border bg-background">
                <MediaPreview
                  url={mediaUpload.preview.url}
                  type={mediaUpload.preview.type}
                  onClear={mediaUpload.clearPreview}
                />
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 pb-20 md:pb-4 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                {!isRecording && (
                  <>
                    <button
                      onClick={() => mediaUpload.openFilePicker("image")}
                      className="p-2 rounded-full hover:bg-secondary transition-colors text-primary flex-shrink-0"
                      title="Send image"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => mediaUpload.openFilePicker("video")}
                      className="p-2 rounded-full hover:bg-secondary transition-colors text-primary flex-shrink-0"
                      title="Send video"
                    >
                      <Film className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Start a new message"
                      className="flex-1 min-w-0 bg-secondary rounded-full py-3 px-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                    {newMessage.trim() || mediaUpload.preview ? (
                      <button
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending || mediaUpload.uploading}
                        className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {sendMessageMutation.isPending || mediaUpload.uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="p-2 rounded-full bg-primary text-primary-foreground transition-colors flex-shrink-0"
                        title="Voice note"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    )}
                  </>
                )}

                {isRecording && (
                  <>
                    <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-full py-3 px-4">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className="text-red-500 text-sm font-medium tabular-nums">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground text-xs">Recording…</span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="p-2 rounded-full bg-red-500 text-white transition-colors flex-shrink-0"
                      title="Stop and send"
                    >
                      {uploadAudio.isPending || sendMessageMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Square className="h-5 w-5 fill-current" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <h2 className="font-display text-3xl font-bold mb-2">Select a message</h2>
              <p className="text-muted-foreground mb-6">
                Choose from your existing conversations, start a new one, or just keep playing.
              </p>
              <Button
                onClick={() => setShowNewMessageModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
              >
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setUserSearchQuery("");
                }}
                className="p-2 hover:bg-secondary rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or handle..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-secondary rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {userSearchQuery.length < 2 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Type at least 2 characters to search
                  </p>
                ) : !searchResults || searchResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No users found
                  </p>
                ) : (
                  searchResults.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartConversation(u.id)}
                      disabled={getOrCreateConversationMutation.isPending}
                      className="w-full p-3 flex items-center gap-3 hover:bg-secondary rounded-xl transition-colors"
                    >
                      <img
                        src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=dc2626&color=fff`}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{u.name || 'Player'}</span>
                          {u.playerVerified && (
                            <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">@{u.handle || 'player'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
