import { useState, useRef, useCallback } from "react";

export function useScreenShare() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      setScreenStream(stream);
      setIsSharing(true);

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsSharing(false);
        streamRef.current = null;
      };

      return stream;
    } catch (err) {
      console.error("Screen share error:", err);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setScreenStream(null);
      setIsSharing(false);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      stopScreenShare();
      return null;
    } else {
      return startScreenShare();
    }
  }, [isSharing, startScreenShare, stopScreenShare]);

  return { screenStream, isSharing, toggleScreenShare, stopScreenShare };
}
