import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Video, VideoOff, Mic, MicOff, MessageSquare, Phone,
  Settings, Monitor, Smile, Volume2, Eye, ChevronLeft,
  Send, Maximize2, Minimize2, Hand, Leaf, Users, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useScreenShare } from "@/hooks/useScreenShare";

interface InterviewRoomProps {
  code?: string;
  role?: "interviewer" | "candidate";
}

export function InterviewRoom({ code, role = "candidate" }: InterviewRoomProps) {
  const {
    localStream, videoEnabled, audioEnabled, error: mediaError,
    startMedia, stopMedia, toggleVideo, toggleAudio,
  } = useMediaDevices();
  const { screenStream, isSharing, toggleScreenShare } = useScreenShare();

  const { remoteStream, connectionState, participantCount } = useWebRTC({
    roomCode: code || "demo",
    localStream,
    preferredVideoTrack: screenStream?.getVideoTracks()[0] ?? null,
    participantRole: role,
  });
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: string; time: string }[]>([
    { text: "Welcome! Take your time, there's no rush. 😊", sender: "System", time: "Now" },
  ]);
  const [ambientOn, setAmbientOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Start media on mount
  useEffect(() => {
    startMedia();
    return () => stopMedia();
  }, [startMedia, stopMedia]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      void localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Attach screen share stream to video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
      void screenVideoRef.current.play().catch(() => {});
    }
  }, [screenStream]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { text: message, sender: "You", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setMessage("");
  };

  const connectionIcon = () => {
    switch (connectionState) {
      case "connected": return <Wifi className="h-3.5 w-3.5 text-primary" />;
      case "connecting": return <Wifi className="h-3.5 w-3.5 text-accent animate-pulse" />;
      default: return <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const connectionLabel = () => {
    switch (connectionState) {
      case "connected": return "Connected";
      case "connecting": return "Connecting...";
      case "failed": return "Connection failed";
      default: return "Waiting for participant";
    }
  };

  return (
    <div className={cn("flex h-[100dvh] flex-col transition-all duration-500", focusMode ? "bg-background" : "bg-foreground/[0.03]")}>
      {/* Top Bar */}
      <div className={cn("flex items-center justify-between gap-2 border-b border-border/30 bg-card/90 px-3 py-2 backdrop-blur-sm transition-all sm:px-4 sm:py-2.5", focusMode && "opacity-60 hover:opacity-100")}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
            <Video className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Interview Room</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2">
              <span className="truncate font-mono">{code || "SH-DEMO"}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden items-center gap-1 sm:flex">{connectionIcon()} {connectionLabel()}</span>
              <span className="sm:hidden">{connectionIcon()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Participants */}
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 sm:px-3">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{participantCount}</span>
          </div>

          {/* Breathing indicator — desktop only */}
          <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1 md:flex">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Breathe</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-breathe" />
          </div>

          <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:inline-flex" onClick={() => setAmbientOn(!ambientOn)} title="Ambient sounds">
            <Volume2 className={cn("h-4 w-4", ambientOn ? "text-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFocusMode(!focusMode)} title="Focus mode">
            <Eye className={cn("h-4 w-4", focusMode ? "text-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:inline-flex" onClick={() => setFullscreen(!fullscreen)} title="Fullscreen">
            {fullscreen ? <Minimize2 className="h-4 w-4 text-muted-foreground" /> : <Maximize2 className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:inline-flex" title="Settings">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Video Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex flex-1 items-center justify-center gap-4 p-2 sm:p-4">
            {/* Screen share or Remote video (main view) */}
            <div className="relative h-full w-full flex-1 rounded-xl bg-sage-dark/10 border border-border/30 overflow-hidden flex items-center justify-center sm:rounded-2xl">
              {isSharing && screenStream ? (
                <video ref={screenVideoRef} autoPlay playsInline className="h-full w-full object-contain bg-black" />
              ) : remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              ) : (
                <div className="px-4 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary sm:h-20 sm:w-20">
                    <Users className="h-7 w-7 text-primary/50 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {connectionState === "connecting" ? "Connecting..." : "Waiting for participant to join"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Share the code <span className="font-mono font-bold text-primary">{code || "SH-DEMO"}</span> to invite
                  </p>
                </div>
              )}
              {isSharing && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-destructive/90 px-2.5 py-1 sm:px-3">
                  <Monitor className="h-3.5 w-3.5 text-destructive-foreground" />
                  <span className="text-xs font-medium text-destructive-foreground">Sharing</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.55 0.1 155), transparent 60%)" }} />
            </div>

            {/* Local video (picture-in-picture) */}
            <div className={cn("absolute bottom-3 right-3 h-24 w-32 rounded-lg border-2 border-card shadow-lg overflow-hidden transition-all sm:bottom-6 sm:right-6 sm:h-36 sm:w-48 sm:rounded-xl", videoEnabled ? "bg-sage-light/20" : "bg-muted")}>
              {videoEnabled && localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <VideoOff className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Media error */}
          {mediaError && (
            <div className="mx-3 mb-2 rounded-xl bg-destructive/10 px-4 py-2 text-center text-xs text-destructive sm:mx-4 sm:text-sm">
              {mediaError}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-1.5 border-t border-border/30 bg-card/80 px-2 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-3">
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              onClick={toggleAudio}
              title={audioEnabled ? "Mute" : "Unmute"}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              onClick={toggleVideo}
              title={videoEnabled ? "Stop video" : "Start video"}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isSharing ? "destructive" : "secondary"}
              size="icon"
              className="hidden h-11 w-11 rounded-full sm:inline-flex sm:h-12 sm:w-12"
              title={isSharing ? "Stop sharing" : "Share screen"}
              onClick={toggleScreenShare}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              variant={handRaised ? "default" : "secondary"}
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              onClick={() => setHandRaised(!handRaised)}
              title="Raise hand"
            >
              <Hand className="h-5 w-5" />
            </Button>

            <Button variant="secondary" size="icon" className="hidden h-11 w-11 rounded-full sm:inline-flex sm:h-12 sm:w-12" title="Reactions">
              <Smile className="h-5 w-5" />
            </Button>

            <Button
              variant={chatOpen ? "default" : "secondary"}
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              onClick={() => setChatOpen(!chatOpen)}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            <div className="mx-1 h-8 w-px bg-border/50 sm:mx-2" />

            <Link to="/">
              <Button variant="destructive" size="icon" className="h-11 w-11 rounded-full sm:h-12 sm:w-12" title="Leave interview">
                <Phone className="h-5 w-5 rotate-[135deg]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Panel — mobile drawer, desktop sidebar */}
        {chatOpen && (
          <div className="absolute inset-x-0 bottom-0 top-0 z-40 flex flex-col border-l border-border/30 bg-card/95 backdrop-blur-md md:static md:inset-auto md:z-auto md:w-80 md:bg-card/50 md:backdrop-blur-none">
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Chat</h3>
                <p className="truncate text-xs text-muted-foreground">Type freely — no pressure</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setChatOpen(false)}>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("max-w-[85%]", msg.sender === "You" ? "ml-auto" : "")}>
                  <div className={cn("rounded-2xl px-3.5 py-2.5", msg.sender === "You" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground")}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <p className="mt-1 px-1 text-[10px] text-muted-foreground">
                    {msg.sender} • {msg.time}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-border/30 p-3">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
