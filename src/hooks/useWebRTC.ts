import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        "turns:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

type SignalPayload = Record<string, unknown>;

export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";
export type ParticipantRole = "interviewer" | "candidate";

interface UseWebRTCOptions {
  roomCode: string;
  localStream: MediaStream | null;
  preferredVideoTrack?: MediaStreamTrack | null;
  participantRole?: ParticipantRole;
}

export function useWebRTC({
  roomCode,
  localStream,
  preferredVideoTrack = null,
  participantRole = "candidate",
}: UseWebRTCOptions) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [participantCount, setParticipantCount] = useState(1);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceKeyRef = useRef("");
  const localStreamRef = useRef<MediaStream | null>(null);
  const subscribedRef = useRef(false);
  const isInitiatorRef = useRef(false);
  const hasNegotiatedRef = useRef(false);
  const pendingOfferRef = useRef<{ from: string; sdp: RTCSessionDescriptionInit } | null>(null);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const hasLocalMedia = useCallback(() => {
    const stream = localStreamRef.current;
    return Boolean(stream?.getTracks().some((track) => track.readyState === "live"));
  }, []);

  const sendSignal = useCallback(async (event: string, payload: SignalPayload) => {
    const channel = channelRef.current;
    if (!channel || !subscribedRef.current) {
      console.warn(`[WebRTC] Skipped ${event} broadcast before subscribe`);
      return false;
    }

    try {
      const result = await channel.send({ type: "broadcast", event, payload });
      if (result !== "ok") {
        console.warn(`[WebRTC] ${event} broadcast failed:`, result);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`[WebRTC] ${event} broadcast error:`, error);
      return false;
    }
  }, []);

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0] ?? null;
    const videoTrack = preferredVideoTrack ?? stream.getVideoTracks()[0] ?? null;
    const audioSender = pc.getSenders().find((sender) => sender.track?.kind === "audio");
    const videoSender = pc.getSenders().find((sender) => sender.track?.kind === "video");

    if (audioTrack) {
      if (audioSender) {
        void audioSender.replaceTrack(audioTrack);
      } else {
        pc.addTrack(audioTrack, stream);
      }
    }

    if (videoTrack) {
      if (videoSender) {
        void videoSender.replaceTrack(videoTrack);
      } else {
        pc.addTrack(videoTrack, stream);
      }
    }
  }, [preferredVideoTrack]);

  const processCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (candidateQueueRef.current.length > 0) {
      const candidate = candidateQueueRef.current.shift();
      if (!candidate) continue;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn("[WebRTC] Failed to add ICE candidate:", error);
      }
    }
  }, []);

  const startNegotiation = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !subscribedRef.current || !hasLocalMedia() || hasNegotiatedRef.current) return;
    if (pc.signalingState !== "stable") return;

    hasNegotiatedRef.current = true;
    isInitiatorRef.current = true;
    setConnectionState("connecting");
    attachLocalTracks(pc);

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      const sent = await sendSignal("offer", {
        from: presenceKeyRef.current,
        sdp: offer,
        role: participantRole,
      });

      if (!sent) {
        throw new Error("Offer was not delivered");
      }

      console.info("[WebRTC] Offer sent");
    } catch (error) {
      console.error("[WebRTC] Failed to create offer:", error);
      hasNegotiatedRef.current = false;
      isInitiatorRef.current = false;
      setConnectionState("disconnected");
    }
  }, [attachLocalTracks, hasLocalMedia, participantRole, sendSignal]);

  const handleIncomingOffer = useCallback(async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (payload.from === presenceKeyRef.current || isInitiatorRef.current) return;

    if (!hasLocalMedia()) {
      pendingOfferRef.current = payload;
      console.info("[WebRTC] Queued incoming offer until local media is ready");
      return;
    }

    if (pc.signalingState !== "stable") {
      console.warn("[WebRTC] Ignored offer because signaling state is not stable:", pc.signalingState);
      return;
    }

    hasNegotiatedRef.current = true;
    setConnectionState("connecting");

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      attachLocalTracks(pc);
      await processCandidateQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const sent = await sendSignal("answer", {
        from: presenceKeyRef.current,
        sdp: answer,
        role: participantRole,
      });

      if (!sent) {
        throw new Error("Answer was not delivered");
      }

      pendingOfferRef.current = null;
      console.info("[WebRTC] Answer sent");
    } catch (error) {
      console.error("[WebRTC] Failed to handle offer:", error);
      hasNegotiatedRef.current = false;
      setConnectionState("failed");
    }
  }, [attachLocalTracks, hasLocalMedia, participantRole, processCandidateQueue, sendSignal]);

  const maybeStartConnection = useCallback(async () => {
    const pc = pcRef.current;
    const channel = channelRef.current;
    if (!pc || !channel || !subscribedRef.current || !hasLocalMedia()) return;

    const keys = Object.keys(channel.presenceState());
    setParticipantCount(keys.length);

    if (keys.length < 2) return;

    if (pendingOfferRef.current && pc.signalingState === "stable") {
      await handleIncomingOffer(pendingOfferRef.current);
      return;
    }

    if (participantRole === "interviewer") {
      await startNegotiation();
      return;
    }

    await sendSignal("ready", {
      from: presenceKeyRef.current,
      role: participantRole,
    });
    console.info("[WebRTC] Candidate ready signal sent");
  }, [handleIncomingOffer, hasLocalMedia, participantRole, sendSignal, startNegotiation]);

  useEffect(() => {
    localStreamRef.current = localStream;

    const pc = pcRef.current;
    if (!pc || !localStream) return;

    attachLocalTracks(pc);
    void maybeStartConnection();
  }, [attachLocalTracks, localStream, maybeStartConnection, preferredVideoTrack]);

  useEffect(() => {
    if (!roomCode) return;

    presenceKeyRef.current = crypto.randomUUID();
    subscribedRef.current = false;
    isInitiatorRef.current = false;
    hasNegotiatedRef.current = false;
    pendingOfferRef.current = null;
    candidateQueueRef.current = [];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      void sendSignal("ice-candidate", {
        from: presenceKeyRef.current,
        candidate: event.candidate.toJSON(),
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE connection failed");
        hasNegotiatedRef.current = false;
        setConnectionState("failed");
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
          hasNegotiatedRef.current = false;
          setConnectionState("disconnected");
          setRemoteStream(null);
          break;
        case "failed":
          hasNegotiatedRef.current = false;
          setConnectionState("failed");
          break;
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        console.info("[WebRTC] Remote track received");
        setRemoteStream(stream);
      }
    };

    attachLocalTracks(pc);

    const channel = supabase.channel(`interview-${roomCode}`, {
      config: {
        presence: { key: presenceKeyRef.current },
        broadcast: { ack: true, self: false },
      },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "ready" }, async ({ payload }) => {
        const signal = payload as { from: string; role?: ParticipantRole };
        if (signal.from === presenceKeyRef.current) return;
        if (participantRole !== "interviewer") return;
        await startNegotiation();
      })
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        await handleIncomingOffer(payload as { from: string; sdp: RTCSessionDescriptionInit });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        const signal = payload as { from: string; sdp: RTCSessionDescriptionInit };
        const currentPc = pcRef.current;
        if (!currentPc) return;
        if (signal.from === presenceKeyRef.current || !isInitiatorRef.current) return;
        if (currentPc.signalingState !== "have-local-offer") return;

        try {
          await currentPc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await processCandidateQueue();
          console.info("[WebRTC] Answer received");
        } catch (error) {
          console.error("[WebRTC] Failed to handle answer:", error);
          hasNegotiatedRef.current = false;
          setConnectionState("failed");
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        const signal = payload as { from: string; candidate: RTCIceCandidateInit };
        const currentPc = pcRef.current;
        if (!currentPc || signal.from === presenceKeyRef.current) return;

        if (currentPc.remoteDescription) {
          try {
            await currentPc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (error) {
            console.warn("[WebRTC] Failed to add ICE candidate:", error);
          }
          return;
        }

        candidateQueueRef.current.push(signal.candidate);
      })
      .on("presence", { event: "sync" }, () => {
        setParticipantCount(Object.keys(channel.presenceState()).length);
        void maybeStartConnection();
      })
      .on("presence", { event: "join" }, () => {
        setParticipantCount(Object.keys(channel.presenceState()).length);
        void maybeStartConnection();
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || subscribedRef.current) return;

        subscribedRef.current = true;
        await channel.track({ joined_at: new Date().toISOString(), role: participantRole });
        console.info("[WebRTC] Realtime room subscribed");
        await maybeStartConnection();
      });

    return () => {
      try {
        void channel.untrack();
      } catch {}
      try {
        supabase.removeChannel(channel);
      } catch {}
      try {
        pc.close();
      } catch {}

      pcRef.current = null;
      channelRef.current = null;
      subscribedRef.current = false;
      isInitiatorRef.current = false;
      hasNegotiatedRef.current = false;
      pendingOfferRef.current = null;
      candidateQueueRef.current = [];
      setRemoteStream(null);
      setConnectionState("disconnected");
      setParticipantCount(1);
    };
  }, [attachLocalTracks, handleIncomingOffer, maybeStartConnection, participantRole, processCandidateQueue, roomCode, sendSignal, startNegotiation]);

  return { remoteStream, connectionState, participantCount };
}
