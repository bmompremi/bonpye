import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type CallState = "idle" | "connecting" | "ringing" | "incoming" | "connected" | "ended";

interface CallInfo {
  callId: number;
  conversationId: number;
  partnerId: number;
  partnerName: string;
  partnerAvatar: string | null;
  type: "voice" | "video";
  callerPeerId?: string;
}

export function useWebRTCCall(userId?: number) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callConnectionRef = useRef<any>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to avoid stale closure bugs in async callbacks and timeouts
  const callStateRef = useRef<CallState>("idle");
  const callInfoRef = useRef<CallInfo | null>(null);

  const initiateMutation = trpc.calls.initiate.useMutation();
  const answerMutation = trpc.calls.answer.useMutation();
  const declineMutation = trpc.calls.decline.useMutation();
  const endMutation = trpc.calls.end.useMutation();
  const missedMutation = trpc.calls.missed.useMutation();

  // Keep callInfoRef in sync with state
  useEffect(() => {
    callInfoRef.current = callInfo;
  }, [callInfo]);

  // Wrapper so both ref and state stay in sync
  const updateCallState = useCallback((state: CallState) => {
    callStateRef.current = state;
    setCallState(state);
  }, []);

  // Poll for incoming calls when idle — reduced to 1.5s for responsiveness
  const { data: incomingCall } = trpc.calls.getIncoming.useQuery(undefined, {
    enabled: !!userId && callState === "idle",
    refetchInterval: 1500,
  });

  // Caller polls call record to detect decline/missed
  const callInfoId = callInfo?.callId;
  const { data: callStatusData } = trpc.calls.getById.useQuery(
    { callId: callInfoId || 0 },
    {
      enabled: callState === "ringing" && !!callInfoId,
      refetchInterval: 2000,
    }
  );

  // Handle incoming call detected via polling
  useEffect(() => {
    if (incomingCall && callState === "idle") {
      updateCallState("incoming");
      setCallInfo({
        callId: incomingCall.id,
        conversationId: incomingCall.conversationId,
        partnerId: incomingCall.callerId,
        partnerName: incomingCall.callerName,
        partnerAvatar: incomingCall.callerAvatar,
        type: incomingCall.type,
        callerPeerId: incomingCall.callerPeerId || undefined,
      });
    }
  }, [incomingCall, callState, updateCallState]);

  // Caller: detect when receiver declines
  useEffect(() => {
    if (!callStatusData || callState !== "ringing") return;
    if (callStatusData.status === "declined") {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      cleanup();
      updateCallState("idle");
      setCallInfo(null);
      toast("Call declined");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatusData, callState]);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const initializePeer = useCallback((): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { default: Peer } = await import("peerjs");
        const peer = new Peer({
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });

        peer.on("open", () => {
          peerRef.current = peer;
          resolve(peer);
        });

        peer.on("error", (err: any) => {
          console.error("PeerJS error:", err);
          reject(err);
        });

        // Caller side: fires when the receiver calls back via peer.call()
        peer.on("call", (mediaConnection: any) => {
          if (localStreamRef.current) {
            mediaConnection.answer(localStreamRef.current);
            callConnectionRef.current = mediaConnection;

            mediaConnection.on("stream", (remoteStream: MediaStream) => {
              remoteStreamRef.current = remoteStream;
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }

              // FIX: Caller transitions to connected once remote stream arrives
              if (callStateRef.current === "ringing" || callStateRef.current === "connecting") {
                if (ringTimeoutRef.current) {
                  clearTimeout(ringTimeoutRef.current);
                  ringTimeoutRef.current = null;
                }
                callStateRef.current = "connected";
                setCallState("connected");
                // Start duration timer inline (avoids stale closure from startDurationTimer dep)
                setCallDuration(0);
                durationIntervalRef.current = setInterval(() => {
                  setCallDuration((prev) => prev + 1);
                }, 1000);
              }
            });

            mediaConnection.on("close", () => {
              if (callStateRef.current === "connected") {
                const ci = callInfoRef.current;
                if (ci) {
                  endMutation.mutateAsync({ callId: ci.callId }).catch(() => {});
                }
                // Reset without full cleanup (peer already gone)
                localStreamRef.current?.getTracks().forEach((t) => t.stop());
                localStreamRef.current = null;
                remoteStreamRef.current = null;
                callConnectionRef.current = null;
                if (durationIntervalRef.current) {
                  clearInterval(durationIntervalRef.current);
                  durationIntervalRef.current = null;
                }
                if (localVideoRef.current) localVideoRef.current.srcObject = null;
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                setIsMuted(false);
                setIsCameraOff(false);
                setCallDuration(0);
                callStateRef.current = "idle";
                setCallState("idle");
                setCallInfo(null);
                toast("Call ended");
              }
            });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }, [endMutation]);

  const getUserMedia = useCallback(async (type: "voice" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { facingMode: "user", width: 640, height: 480 } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Failed to get user media:", err);
      toast.error("Could not access microphone" + (type === "video" ? "/camera" : ""));
      throw err;
    }
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    callConnectionRef.current?.close();
    callConnectionRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    stopDurationTimer();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, [stopDurationTimer]);

  const startCall = useCallback(
    async (
      conversationId: number,
      receiverId: number,
      type: "voice" | "video",
      partnerName: string,
      partnerAvatar: string | null
    ) => {
      try {
        updateCallState("connecting");

        await getUserMedia(type);
        const peer = await initializePeer();

        const record = await initiateMutation.mutateAsync({
          conversationId,
          receiverId,
          type,
          callerPeerId: peer.id,
        });

        const newCallInfo: CallInfo = {
          callId: record.id,
          conversationId,
          partnerId: receiverId,
          partnerName,
          partnerAvatar,
          type,
        };
        setCallInfo(newCallInfo);
        callInfoRef.current = newCallInfo;
        updateCallState("ringing");

        // FIX: Use callStateRef + callInfoRef to avoid stale closure
        ringTimeoutRef.current = setTimeout(async () => {
          if (callStateRef.current === "ringing") {
            try {
              const ci = callInfoRef.current;
              if (ci) await missedMutation.mutateAsync({ callId: ci.callId });
            } catch {}
            cleanup();
            callStateRef.current = "idle";
            setCallState("idle");
            setCallInfo(null);
            toast("No answer");
          }
        }, 30000);
      } catch (err) {
        console.error("Failed to start call:", err);
        cleanup();
        updateCallState("idle");
        setCallInfo(null);
        toast.error("Failed to start call");
      }
    },
    [getUserMedia, initializePeer, initiateMutation, missedMutation, cleanup, updateCallState]
  );

  const answerCall = useCallback(async () => {
    if (!callInfo) return;

    try {
      updateCallState("connecting");

      await getUserMedia(callInfo.type);
      const peer = await initializePeer();

      await answerMutation.mutateAsync({ callId: callInfo.callId });

      if (callInfo.callerPeerId && localStreamRef.current) {
        const conn = peer.call(callInfo.callerPeerId, localStreamRef.current);
        callConnectionRef.current = conn;

        conn.on("stream", (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          // Receiver: ensure connected state when actual stream arrives
          if (callStateRef.current !== "connected") {
            callStateRef.current = "connected";
            setCallState("connected");
          }
        });

        conn.on("close", () => {
          if (callStateRef.current === "connected") {
            cleanup();
            callStateRef.current = "idle";
            setCallState("idle");
            setCallInfo(null);
            toast("Call ended");
          }
        });
      }

      // Receiver transitions to connected immediately after answering
      updateCallState("connected");
      startDurationTimer();
    } catch (err) {
      console.error("Failed to answer call:", err);
      cleanup();
      updateCallState("idle");
      setCallInfo(null);
      toast.error("Failed to answer call");
    }
  }, [callInfo, getUserMedia, initializePeer, answerMutation, startDurationTimer, cleanup, updateCallState]);

  const hangUp = useCallback(async () => {
    if (callInfo) {
      try {
        await endMutation.mutateAsync({ callId: callInfo.callId });
      } catch {}
    }
    cleanup();
    callStateRef.current = "idle";
    setCallState("idle");
    setCallInfo(null);
  }, [callInfo, endMutation, cleanup]);

  const declineIncoming = useCallback(async () => {
    if (callInfo) {
      try {
        await declineMutation.mutateAsync({ callId: callInfo.callId });
      } catch {}
    }
    cleanup();
    callStateRef.current = "idle";
    setCallState("idle");
    setCallInfo(null);
  }, [callInfo, declineMutation, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    callInfo,
    isMuted,
    isCameraOff,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    hangUp,
    declineIncoming,
    toggleMute,
    toggleCamera,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
