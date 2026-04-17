import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Video, Mic, MicOff, VideoOff, Wifi, WifiOff, CheckCircle2, XCircle, ArrowRight, ChevronLeft, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LobbySearch = {
  code?: string;
};

export const Route = createFileRoute("/lobby")({
  validateSearch: (search: Record<string, unknown>): LobbySearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pre-Interview Lobby — SereneHire" },
      { name: "description", content: "Test your camera, microphone, and connection before your interview." },
    ],
  }),
  component: LobbyPage,
});

function LobbyPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [testing, setTesting] = useState(false);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    // Connection test
    setConnectionOk(navigator.onLine);
    const handleOnline = () => setConnectionOk(true);
    const handleOffline = () => setConnectionOk(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const testDevices = async () => {
    setTesting(true);
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      // Camera
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === "live") {
        setCameraOk(true);
        setVideoEnabled(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraOk(false);
      }

      // Microphone - monitor audio level
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.readyState === "live") {
        setMicOk(true);
        setMicEnabled(true);

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, avg * 2));
          animFrameRef.current = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } else {
        setMicOk(false);
      }
    } catch {
      setCameraOk(false);
      setMicOk(false);
    }
    setTesting(false);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicEnabled(track.enabled);
      }
    }
  };

  const allReady = cameraOk && micOk && connectionOk;

  const joinInterview = () => {
    stopStream();
    navigate({ to: "/interview", search: { code: code || "" } });
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/3 top-1/4 h-56 w-56 rounded-full bg-sage-light/30 blur-3xl animate-breathe sm:h-64 sm:w-64" />
        <div className="absolute bottom-1/4 left-1/3 h-40 w-40 rounded-full bg-terracotta-light/20 blur-3xl animate-breathe sm:h-48 sm:w-48" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-2xl">
        <a href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to home
        </a>

        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pre-Interview Check</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Let's make sure everything's working. Take a moment to breathe — you've got this. 🌿
          </p>
        </div>

        {/* Video Preview */}
        <div className="relative mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-foreground/5">
          {videoEnabled ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary sm:h-16 sm:w-16">
                <VideoOff className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8" />
              </div>
              <p className="text-sm text-muted-foreground">Camera is off</p>
            </div>
          )}

          {/* Audio level bar */}
          {micEnabled && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-card/90 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:px-3">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:w-20">
                <div className="h-full rounded-full bg-primary transition-all duration-75" style={{ width: `${audioLevel}%` }} />
              </div>
            </div>
          )}

          {/* Camera/Mic toggles */}
          {cameraOk !== null && (
            <div className="absolute bottom-3 right-3 flex gap-2 sm:bottom-4 sm:right-4">
              <Button variant={videoEnabled ? "secondary" : "destructive"} size="icon" className="h-9 w-9 rounded-full" onClick={toggleVideo}>
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button variant={micEnabled ? "secondary" : "destructive"} size="icon" className="h-9 w-9 rounded-full" onClick={toggleMic}>
                {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Status Checks */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Camera", ok: cameraOk, icon: Video },
            { label: "Microphone", ok: micOk, icon: Mic },
            { label: "Connection", ok: connectionOk, icon: Wifi },
          ].map((check) => (
            <div key={check.label} className={cn("rounded-xl border p-3 text-center transition-all sm:p-4", check.ok === true ? "bg-primary/5 border-primary/20" : check.ok === false ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/50")}>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full">
                {check.ok === true ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : check.ok === false ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <check.icon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs font-medium text-foreground sm:text-sm">{check.label}</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {check.ok === true ? "Ready" : check.ok === false ? "Issue" : "Not tested"}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {cameraOk === null ? (
            <Button variant="hero" size="lg" className="flex-1" onClick={testDevices} disabled={testing}>
              {testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Camera & Microphone"}
            </Button>
          ) : (
            <>
              <Button variant="warmOutline" size="lg" onClick={testDevices} disabled={testing}>
                Re-test
              </Button>
              <Button variant="hero" size="lg" className="flex-1" onClick={joinInterview} disabled={!allReady}>
                Join Interview <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {cameraOk === false && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Please allow camera and microphone access in your browser, then try again.
          </p>
        )}
      </div>
    </div>
  );
}
