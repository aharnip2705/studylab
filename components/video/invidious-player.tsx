"use client";

import { useEffect, useRef, useState } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

const INVIDIOUS_LINKS = [
  { url: "https://inv.nadeko.net", label: "inv.nadeko.net" },
  { url: "https://invidious.nerdvpn.de", label: "invidious.nerdvpn.de" },
];

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

  useEffect(() => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/invidious-stream/${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          const errMsg =
            data.error === "video_bulunamadi" ? "Video bulunamadı" : "Video yüklenemedi";
          setError(errMsg);
          onError?.(data.error);
          return;
        }
        setStream({
          streamUrl: data.streamUrl,
          streamType: data.streamType,
        });
      })
      .catch(() => {
        setError("Video yüklenemedi");
        onError?.("fetch_error");
      })
      .finally(() => setLoading(false));
  }, [videoId, onError]);

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
          {INVIDIOUS_LINKS.map(({ url, label }) => (
            <a
              key={url}
              href={`${url}/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              Invidious&apos;da İzle ({label})
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
