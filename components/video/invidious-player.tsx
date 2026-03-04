"use client";

import { useEffect, useRef, useState } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

const DEFAULT_INVIDIOUS = "https://invidious.fdn.fr";

function parseStreamFromInvidious(data: {
  formatStreams?: Array<{ url: string; qualityLabel?: string }>;
  adaptiveFormats?: Array<{ url: string; qualityLabel?: string }>;
  hlsUrl?: string;
}): { streamUrl: string; streamType: "progressive" | "hls" | "dash" } | null {
  const formatStreams = data.formatStreams ?? [];
  const adaptiveFormats = data.adaptiveFormats ?? [];
  const hlsUrl = data.hlsUrl ?? null;

  if (formatStreams.length > 0) {
    const best =
      formatStreams
        .filter((f) =>
          ["720p", "480p", "360p"].includes(String(f.qualityLabel ?? ""))
        )
        .sort((a, b) => {
          const order: Record<string, number> = { "720p": 0, "480p": 1, "360p": 2 };
          return (order[a.qualityLabel ?? ""] ?? 99) - (order[b.qualityLabel ?? ""] ?? 99);
        })[0] ?? formatStreams[0];
    return { streamUrl: best.url, streamType: "progressive" };
  }
  if (hlsUrl) {
    return { streamUrl: hlsUrl, streamType: "hls" };
  }
  if (adaptiveFormats.length > 0) {
    const videoOnly = adaptiveFormats.filter((f) => f.qualityLabel);
    const best =
      videoOnly
        .filter((f) =>
          ["720p", "480p", "360p"].includes(String(f.qualityLabel ?? ""))
        )
        .sort((a, b) => {
          const order: Record<string, number> = { "720p": 0, "480p": 1, "360p": 2 };
          return (order[a.qualityLabel ?? ""] ?? 99) - (order[b.qualityLabel ?? ""] ?? 99);
        })[0];
    const url = best?.url ?? adaptiveFormats[0].url;
    return { streamUrl: url, streamType: "dash" };
  }
  return null;
}

interface InvidiousPlayerProps {
  videoId: string;
  title: string;
  onError?: (message: string) => void;
}

export function InvidiousPlayer({
  videoId,
  title,
  onError,
}: InvidiousPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [stream, setStream] = useState<{
    streamUrl: string;
    streamType: "progressive" | "hls" | "dash";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invidiousInstance =
    process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE || DEFAULT_INVIDIOUS;

  useEffect(() => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    const url = `${invidiousInstance}/api/v1/videos/${encodeURIComponent(videoId)}?local=true`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          const errMsg =
            data.error === "videoNotFound" || data.error === "videoUnavailable"
              ? "Video bulunamadı"
              : "Video yüklenemedi";
          setError(errMsg);
          onError?.(data.error);
          return;
        }
        const parsed = parseStreamFromInvidious(data);
        if (parsed) {
          setStream(parsed);
        } else {
          setError("Video bulunamadı");
          onError?.("stream_bulunamadi");
        }
      })
      .catch(() => {
        setError("Video yüklenemedi");
        onError?.("fetch_error");
      })
      .finally(() => setLoading(false));
  }, [videoId, onError, invidiousInstance]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const video = videoRef.current;

    const initPlayer = () => {
      plyrRef.current = new Plyr(video, {
        autoplay: true,
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "fullscreen",
        ],
      });
    };

    if (stream.streamType === "hls" && Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(stream.streamUrl);
      hlsRef.current.attachMedia(video);
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlayer();
      });
    } else if (
      stream.streamType === "hls" &&
      video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      video.src = stream.streamUrl;
      video.addEventListener("loadedmetadata", initPlayer);
    } else {
      video.src = stream.streamUrl;
      video.addEventListener("loadedmetadata", initPlayer);
    }

    return () => {
      plyrRef.current?.destroy();
      plyrRef.current = null;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.src = "";
    };
  }, [stream]);

  if (loading) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
        <p className="font-medium text-white">{error}</p>
        <a
          href={`${invidiousInstance}/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:underline"
        >
          Invidious&apos;da İzle
        </a>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-t-xl [&_.plyr]:rounded-t-xl">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload="metadata"
        title={title}
      />
    </div>
  );
}
