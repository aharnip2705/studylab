"use client";

import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

const INVIDIOUS_LINKS = [
  { url: "https://invidious.nerdvpn.de", label: "invidious.nerdvpn.de" },
  { url: "https://yewtu.be", label: "yewtu.be" },
  { url: "https://inv.nadeko.net", label: "inv.nadeko.net" },
];

interface InvidiousPlayerProps {
  videoId: string;
  title: string;
  onError?: (message: string) => void;
}

type StreamInfo = {
  streamUrl: string;
  streamType: "progressive" | "hls" | "dash";
  title?: string;
  lengthSeconds?: number;
};

export function InvidiousPlayer({ videoId, title }: InvidiousPlayerProps) {
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [useYoutubeFallback, setUseYoutubeFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setEmbedBlocked(false);
    setStream(null);
    setLoading(true);
    setUseYoutubeFallback(false);
  }, [videoId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStream() {
      try {
        const res = await fetch(`/api/invidious-stream/${encodeURIComponent(videoId)}`);
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (data.streamUrl && data.streamType) {
            if (data.streamType === "dash") {
              setUseYoutubeFallback(true);
            } else {
              setStream({ streamUrl: data.streamUrl, streamType: data.streamType, title: data.title, lengthSeconds: data.lengthSeconds });
            }
            setLoading(false);
            return;
          }
        }

        setUseYoutubeFallback(true);
      } catch {
        if (!cancelled) setUseYoutubeFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStream();
    return () => { cancelled = true; };
  }, [videoId]);

  useEffect(() => {
    if (!stream || stream.streamType !== "hls" || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(stream.streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {});
      hls.on(Hls.Events.ERROR, (_, ev) => {
        if (ev.fatal) setUseYoutubeFallback(true);
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = stream.streamUrl;
      return () => { videoRef.current!.src = ""; };
    } else {
      setUseYoutubeFallback(true);
    }
  }, [stream?.streamUrl, stream?.streamType]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onError" && (data?.info === 101 || data?.info === 150)) {
          setEmbedBlocked(true);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (embedBlocked) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <p className="font-medium text-white">Bu video embed&apos;e kapalı</p>
        <p className="text-sm text-slate-400">
          Kanal sahibi bu videoyu dış sitelerde oynatmayı kapatmış.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            YouTube&apos;da İzle
          </a>
          {INVIDIOUS_LINKS.map(({ url, label }) => (
            <a
              key={url}
              href={`${url}/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              {label}&apos;da İzle
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (stream && !useYoutubeFallback && (stream.streamType === "progressive" || stream.streamType === "hls")) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-black">
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="h-full w-full"
          src={stream.streamType === "progressive" ? stream.streamUrl : undefined}
          title={title}
          onError={() => setUseYoutubeFallback(true)}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-t-xl">
      <iframe
        key={videoId}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
