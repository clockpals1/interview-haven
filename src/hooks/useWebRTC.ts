import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Public STUN + free TURN relay (OpenRelay by Metered) for NAT/firewall traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
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
  const presenceKeyRef = useRef<string>("");
  const isInitiatorRef = useRef(false);
  const hasNegotiatedRef = useRef(false);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const subscribedRef = useRef(false);

  // Keep latest localStream in a ref so handlers see fresh value
  useEffect(() => {
    localStreamRef.current = localStream;

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

  const sendSignal = useCallback((event: string, payload: Record<string, unknown>) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event, payload });
  }, []);

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const existingKinds = new Set(pc.getSenders().map((s) => s.track?.kind).filter(Boolean));
    stream.getTracks().forEach((track) => {
      if (!existingKinds.has(track.kind)) {
        pc.addTrack(track, stream);
      }
    });
  }, []);

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

  const startNegotiation = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || hasNegotiatedRef.current) return;
    if (pc.signalingState !== "stable") return;

    hasNegotiatedRef.current = true;
    isInitiatorRef.current = true;
    setConnectionState("connecting");

    attachLocalTracks(pc);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      sendSignal("offer", { sdp: offer, from: presenceKeyRef.current });
    } catch (e) {
      console.error("Failed to create offer:", e);
      hasNegotiatedRef.current = false;
      isInitiatorRef.current = false;
    }
  }, [attachLocalTracks, sendSignal]);

  // Main effect: set up channel + peer connection (only depends on roomCode)
  useEffect(() => {
    if (!roomCode) return;

    // Reset state
    presenceKeyRef.current = crypto.randomUUID();
    isInitiatorRef.current = false;
    hasNegotiatedRef.current = false;
    candidateQueueRef.current = [];
    subscribedRef.current = false;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", {
          candidate: event.candidate.toJSON(),
          from: presenceKeyRef.current,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
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

    // Attach any tracks we already have
    attachLocalTracks(pc);

    const channel = supabase.channel(`interview-${roomCode}`, {
      config: { presence: { key: presenceKeyRef.current } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        const currentPc = pcRef.current;
        if (!currentPc) return;
        if (payload.from === presenceKeyRef.current) return; // ignore own
        if (isInitiatorRef.current) return; // initiator shouldn't accept offers
        if (currentPc.signalingState !== "stable") return;

        hasNegotiatedRef.current = true;
        setConnectionState("connecting");

        try {
          attachLocalTracks(currentPc);
          await currentPc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await processCandidateQueue();
          const answer = await currentPc.createAnswer();
          await currentPc.setLocalDescription(answer);
          sendSignal("answer", { sdp: answer, from: presenceKeyRef.current });
        } catch (e) {
          console.error("Failed to handle offer:", e);
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        const currentPc = pcRef.current;
        if (!currentPc) return;
        if (payload.from === presenceKeyRef.current) return;
        if (!isInitiatorRef.current) return;
        if (currentPc.signalingState !== "have-local-offer") return;

        try {
          await currentPc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await processCandidateQueue();
        } catch (e) {
          console.error("Failed to handle answer:", e);
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        const currentPc = pcRef.current;
        if (!currentPc) return;
        if (payload.from === presenceKeyRef.current) return;

        if (currentPc.remoteDescription) {
          try {
            await currentPc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn("Failed to add ICE candidate:", e);
          }
        } else {
          candidateQueueRef.current.push(payload.candidate);
        }
      })
      .on("broadcast", { event: "request-offer" }, () => {
        // A new peer asks the existing one to (re)send an offer
        if (!isInitiatorRef.current && !hasNegotiatedRef.current) {
          // become initiator since we were here first
          isInitiatorRef.current = true;
        }
        hasNegotiatedRef.current = false;
        startNegotiation();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const keys = Object.keys(state).sort();
        setParticipantCount(keys.length);

        if (keys.length >= 2) {
          // Deterministic initiator: smallest key starts
          const shouldInitiate = keys[0] === presenceKeyRef.current;
          if (shouldInitiate && !hasNegotiatedRef.current) {
            startNegotiation();
          }
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        // When someone new joins after us, ask them to trigger negotiation
        // (only relevant if we're the initiator/first one)
        if (key !== presenceKeyRef.current) {
          const state = channel.presenceState();
          const keys = Object.keys(state).sort();
          if (keys.length >= 2 && keys[0] === presenceKeyRef.current && !hasNegotiatedRef.current) {
            startNegotiation();
          }
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !subscribedRef.current) {
          subscribedRef.current = true;
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      try {
        channel.untrack();
      } catch {}
      try {
        supabase.removeChannel(channel);
      } catch {}
      try {
        pc.close();
      } catch {}
      pcRef.current = null;
      channelRef.current = null;
      isInitiatorRef.current = false;
      hasNegotiatedRef.current = false;
      candidateQueueRef.current = [];
      subscribedRef.current = false;
      setRemoteStream(null);
      setConnectionState("disconnected");
      setParticipantCount(1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  return { remoteStream, connectionState, participantCount };
}
