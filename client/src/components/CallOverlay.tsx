import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Volume2,
} from "lucide-react";
import { CallState, formatDuration } from "@/hooks/useWebRTCCall";

interface CallOverlayProps {
  callState: CallState;
  callInfo: {
    type: "voice" | "video";
    partnerName: string;
    partnerAvatar: string | null;
  } | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onHangUp: () => void;
  onAnswer: () => void;
  onDecline: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export default function CallOverlay({
  callState,
  callInfo,
  isMuted,
  isCameraOff,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  onHangUp,
  onAnswer,
  onDecline,
  onToggleMute,
  onToggleCamera,
}: CallOverlayProps) {
  if (!callInfo || callState === "idle" || callState === "ended") return null;

  const avatarUrl =
    callInfo.partnerAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(callInfo.partnerName)}&background=1d4ed8&color=fff&size=200`;

  const isVideoCall = callInfo.type === "video";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center"
      >
        {/* Connected video call - show video feeds */}
        {callState === "connected" && isVideoCall && (
          <>
            {/* Remote video - full screen */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Local video - PIP */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-48 right-4 w-[120px] h-[160px] rounded-xl overflow-hidden border-2 border-white/30 shadow-xl"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            </motion.div>
          </>
        )}

        {/* Non-video states or voice calls */}
        {(callState !== "connected" || !isVideoCall) && (
          <div className="flex flex-col items-center gap-6 z-10">
            {/* Partner avatar */}
            <motion.div
              animate={
                callState === "ringing" || callState === "connecting"
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <img
                src={avatarUrl}
                alt={callInfo.partnerName}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
              />
            </motion.div>

            {/* Partner name */}
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold">
                {callInfo.partnerName}
              </h2>
              <p className="text-white/60 mt-1">
                {callState === "connecting" && (
                  <span className="flex items-center gap-1 justify-center">
                    <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    Connecting…
                  </span>
                )}
                {callState === "ringing" && "Calling…"}
                {callState === "incoming" &&
                  `Incoming ${callInfo.type} call`}
                {callState === "connected" && (
                  <span className="text-green-400">
                    {formatDuration(callDuration)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Connected video call timer overlay */}
        {callState === "connected" && isVideoCall && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white text-sm font-mono">
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Control bar */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-4">
            {/* Incoming call: Accept + Decline */}
            {callState === "incoming" && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onDecline}
                  className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onAnswer}
                  className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Phone className="h-7 w-7 text-white" />
                </motion.button>
              </>
            )}

            {/* Ringing/Connecting: just End */}
            {(callState === "ringing" || callState === "connecting") && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onHangUp}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
              >
                <PhoneOff className="h-7 w-7 text-white" />
              </motion.button>
            )}

            {/* Connected: Full control bar */}
            {callState === "connected" && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    isMuted ? "bg-white/30" : "bg-white/10"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="h-6 w-6 text-white" />
                  ) : (
                    <Mic className="h-6 w-6 text-white" />
                  )}
                </motion.button>

                {isVideoCall && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                      isCameraOff ? "bg-white/30" : "bg-white/10"
                    }`}
                  >
                    {isCameraOff ? (
                      <CameraOff className="h-6 w-6 text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </motion.button>
                )}

                {!isVideoCall && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shadow-lg"
                  >
                    <Volume2 className="h-6 w-6 text-white" />
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onHangUp}
                  className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
