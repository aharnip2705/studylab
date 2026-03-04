"use client";

import { useEffect, useRef, useState } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
];

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

  const customInstance = process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE;
  const instances = customInstance
    ? [customInstance.replace(/\/$/, "")]
    : INVIDIOUS_INSTANCES;

  useEffect(() => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    async function tryFetch() {
      for (const base of instances) {
        try {
          const url = `${base}/api/v1/videos/${encodeURIComponent(videoId)}?local=true`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.error) {
            if (
              data.error === "videoNotFound" ||
              data.error === "videoUnavailable"
            ) {
              setError("Video bulunamadı");
              onError?.(data.error);
              return;
            }
            continue;
          }

          const parsed = parseStreamFromInvidious(data);
          if (parsed) {
            setStream(parsed);
            return;
          }
        } catch {
          continue;
        }
      }
      setError("Video yüklenemedi");
      onError?.("fetch_error");
    }

    tryFetch().finally(() => setLoading(false));
  }, [videoId, onError, customInstance ?? ""]);

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
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <p className="font-medium text-white">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            YouTube&apos;da İzle
          </a>
          {instances.slice(0, 2).map((base) => (
            <a
              key={base}
              href={`${base}/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              Invidious&apos;da İzle ({new URL(base).hostname})
            </a>
          ))}
        </div>
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
