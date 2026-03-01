/**
 * CallContext — makes WebRTC call state global so incoming calls
 * ring regardless of which page the receiver is on.
 */
import { createContext, useContext, type ReactNode, type RefObject } from "react";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import CallOverlay from "@/components/CallOverlay";
import { useAuth } from "@/_core/hooks/useAuth";

type CallCtx = ReturnType<typeof useWebRTCCall>;

const CallContext = createContext<CallCtx | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const call = useWebRTCCall(user?.id);

  return (
    <CallContext.Provider value={call}>
      {children}
      {/* CallOverlay lives here so it shows on ANY page */}
      <CallOverlay
        callState={call.callState}
        callInfo={
          call.callInfo
            ? {
                type: call.callInfo.type,
                partnerName: call.callInfo.partnerName,
                partnerAvatar: call.callInfo.partnerAvatar,
              }
            : null
        }
        isMuted={call.isMuted}
        isCameraOff={call.isCameraOff}
        callDuration={call.callDuration}
        localVideoRef={call.localVideoRef as RefObject<HTMLVideoElement>}
        remoteVideoRef={call.remoteVideoRef as RefObject<HTMLVideoElement>}
        onHangUp={call.hangUp}
        onAnswer={call.answerCall}
        onDecline={call.declineIncoming}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    </CallContext.Provider>
  );
}

export function useCall(): CallCtx {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside <CallProvider>");
  return ctx;
}
