import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

interface UseWebRTCOptions {
  roomCode: string;
  localStream: MediaStream | null;
}

export function useWebRTC({ roomCode, localStream }: UseWebRTCOptions) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [participantCount, setParticipantCount] = useState(1);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceKeyRef = useRef<string>(crypto.randomUUID());
  const isInitiatorRef = useRef(false);
  const hasStartedCallRef = useRef(false);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "connected":
          setConnectionState("connected");
          break;
        case "connecting":
          setConnectionState("connecting");
          break;
        case "disconnected":
        case "closed":
          setConnectionState("disconnected");
          setRemoteStream(null);
          break;
        case "failed":
          setConnectionState("failed");
          break;
      }
    };

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [localStream]);

  const processCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    while (candidateQueueRef.current.length > 0) {
      const candidate = candidateQueueRef.current.shift()!;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("Failed to add ICE candidate:", e);
      }
    }
  }, []);

  const startCall = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !channelRef.current || hasStartedCallRef.current) return;

    hasStartedCallRef.current = true;
    isInitiatorRef.current = true;
    setConnectionState("connecting");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current.send({
      type: "broadcast",
      event: "offer",
      payload: { sdp: offer },
    });
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    isInitiatorRef.current = false;
    hasStartedCallRef.current = false;
    candidateQueueRef.current = [];
    presenceKeyRef.current = crypto.randomUUID();

    const pc = createPeerConnection();

    const channel = supabase.channel(`interview-${roomCode}`, {
      config: { presence: { key: presenceKeyRef.current } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        hasStartedCallRef.current = true;
        if (pc.signalingState !== "stable") return;
        setConnectionState("connecting");

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await processCandidateQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { sdp: answer },
        });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (!isInitiatorRef.current) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await processCandidateQueue();
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn("Failed to add ICE candidate:", e);
          }
        } else {
          candidateQueueRef.current.push(payload.candidate);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const participantKeys = Object.keys(state).sort();
        const count = participantKeys.length;
        setParticipantCount(count);

        const shouldInitiate = participantKeys[0] === presenceKeyRef.current;

        if (count >= 2 && shouldInitiate && pc.signalingState === "stable") {
          startCall();
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
      pc.close();
      pcRef.current = null;
      channelRef.current = null;
      isInitiatorRef.current = false;
      hasStartedCallRef.current = false;
      candidateQueueRef.current = [];
      setRemoteStream(null);
      setConnectionState("disconnected");
    };
  }, [roomCode, createPeerConnection, startCall, processCandidateQueue]);

  // Update tracks when localStream changes
  useEffect(() => {
    const pc = pcRef.current;
    if (!pc || !localStream) return;

    const senders = pc.getSenders();
    localStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      } else {
        pc.addTrack(track, localStream);
      }
    });
  }, [localStream]);

  return { remoteStream, connectionState, participantCount };
}
