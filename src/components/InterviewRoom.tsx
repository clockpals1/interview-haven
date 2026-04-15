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
}

export function InterviewRoom({ code }: InterviewRoomProps) {
  const {
    localStream, videoEnabled, audioEnabled, error: mediaError,
    startMedia, stopMedia, toggleVideo, toggleAudio,
  } = useMediaDevices();

  const { remoteStream, connectionState, participantCount } = useWebRTC({
    roomCode: code || "demo",
    localStream,
  });

  const { screenStream, isSharing, toggleScreenShare } = useScreenShare();
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
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    <div className={cn("flex h-screen flex-col transition-all duration-500", focusMode ? "bg-background" : "bg-foreground/[0.03]")}>
      {/* Top Bar */}
      <div className={cn("flex items-center justify-between border-b border-border/30 bg-card/90 px-4 py-2.5 backdrop-blur-sm transition-all", focusMode && "opacity-60 hover:opacity-100")}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Video className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Interview Room</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{code || "SH-DEMO"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">{connectionIcon()} {connectionLabel()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Participants */}
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{participantCount}</span>
          </div>

          {/* Breathing indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Breathe</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-breathe" />
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAmbientOn(!ambientOn)} title="Ambient sounds">
            <Volume2 className={cn("h-4 w-4", ambientOn ? "text-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFocusMode(!focusMode)} title="Focus mode">
            <Eye className={cn("h-4 w-4", focusMode ? "text-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(!fullscreen)} title="Fullscreen">
            {fullscreen ? <Minimize2 className="h-4 w-4 text-muted-foreground" /> : <Maximize2 className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 items-center justify-center gap-4 p-4">
            {/* Remote video (main view) */}
            <div className="relative flex-1 h-full rounded-2xl bg-sage-dark/10 border border-border/30 overflow-hidden flex items-center justify-center">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {connectionState === "connecting" ? "Connecting..." : "Waiting for participant to join"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share the code <span className="font-mono font-bold text-primary">{code || "SH-DEMO"}</span> to invite
                  </p>
                </div>
              )}
              {/* Subtle ambient pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.55 0.1 155), transparent 60%)" }} />
            </div>

            {/* Local video (picture-in-picture) */}
            <div className={cn("absolute bottom-6 right-6 h-36 w-48 rounded-xl border-2 border-card shadow-lg overflow-hidden transition-all", videoEnabled ? "bg-sage-light/20" : "bg-muted")}>
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
            <div className="mx-4 mb-2 rounded-xl bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
              {mediaError}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-3 border-t border-border/30 bg-card/80 px-4 py-3 backdrop-blur-sm">
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleAudio}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleVideo}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full" title="Share screen">
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              variant={handRaised ? "default" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setHandRaised(!handRaised)}
              title="Raise hand"
            >
              <Hand className="h-5 w-5" />
            </Button>

            <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full" title="Reactions">
              <Smile className="h-5 w-5" />
            </Button>

            <Button
              variant={chatOpen ? "default" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            <div className="mx-2 h-8 w-px bg-border/50" />

            <Link to="/">
              <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" title="Leave interview">
                <Phone className="h-5 w-5 rotate-[135deg]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Panel */}
        <div className={cn("flex w-80 flex-col border-l border-border/30 bg-card/50 transition-all duration-300", chatOpen ? "translate-x-0" : "translate-x-full w-0 overflow-hidden border-none")}>
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <h3 className="font-semibold text-foreground text-sm">Chat</h3>
            <p className="text-xs text-muted-foreground">Type freely — no pressure</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("max-w-[85%]", msg.sender === "You" ? "ml-auto" : "")}>
                <div className={cn("rounded-2xl px-3.5 py-2.5", msg.sender === "You" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground")}>
                  <p className="text-sm">{msg.text}</p>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground px-1">
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
                className="rounded-xl h-10 text-sm"
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
