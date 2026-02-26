/* TCsocial Messages - Direct Messaging
 * Like Twitter/X DMs - Now with real database integration
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Info,
  Loader2,
  Moon,
  MoreHorizontal,
  Phone,
  Search,
  Send,
  Settings,
  Smile,
  Sun,
  Video,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Messages() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      refetchInterval: 5000, // Poll every 5 seconds for new messages
    });

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = 
    trpc.message.getMessages.useQuery(
      { conversationId: selectedConversationId!, limit: 100, offset: 0 },
      { 
        enabled: !!selectedConversationId,
        refetchInterval: 3000, // Poll every 3 seconds for new messages
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim(),
    });
  };

  const handleStartConversation = (userId: number) => {
    getOrCreateConversationMutation.mutate({ userId });
  };

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
    });
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
    <div className="min-h-screen bg-background text-foreground flex">
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
            <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <Settings className="h-5 w-5" />
            </button>
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
              <p className="text-sm text-muted-foreground mt-1">Start a new message to connect with other drivers</p>
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
                          {other.name || 'Driver'}
                        </span>
                        {other.cdlVerified && (
                          <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                        )}
                        <span className="text-muted-foreground text-sm">@{other.handle || 'driver'}</span>
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
      <div className={`flex-1 flex flex-col ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversationId && currentChatPartner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="flex items-center gap-3 hover:opacity-70 transition-opacity flex-1"
              >
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <img
                  src={currentChatPartner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChatPartner.name || 'User')}&background=dc2626&color=fff`}
                  alt={currentChatPartner.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold hover:underline cursor-pointer">{currentChatPartner.name || 'Driver'}</span>
                    {currentChatPartner.cdlVerified && (
                      <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">@{currentChatPartner.handle || 'driver'}</span>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Phone className="h-5 w-5" />
                </button>
                <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Video className="h-5 w-5" />
                </button>
                <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Profile Card */}
              <div className="text-center py-8">
                <img
                  src={currentChatPartner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChatPartner.name || 'User')}&background=dc2626&color=fff`}
                  alt={currentChatPartner.name || 'User'}
                  className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                />
                <div className="font-bold text-lg flex items-center justify-center gap-1">
                  {currentChatPartner.name || 'Driver'}
                  {currentChatPartner.cdlVerified && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">CDL ✓</span>
                  )}
                </div>
                <div className="text-muted-foreground">@{currentChatPartner.handle || 'driver'}</div>
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
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors text-primary">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors text-primary">
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Start a new message"
                  className="flex-1 bg-secondary rounded-full py-3 px-4 outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition-colors"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <h2 className="font-display text-3xl font-bold mb-2">Select a message</h2>
              <p className="text-muted-foreground mb-6">
                Choose from your existing conversations, start a new one, or just keep trucking.
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
                          <span className="font-semibold">{u.name || 'Driver'}</span>
                          {u.cdlVerified && (
                            <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">@{u.handle || 'driver'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
