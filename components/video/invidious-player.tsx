"use client";

import { useState, useEffect } from "react";

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

export function InvidiousPlayer({ videoId, title }: InvidiousPlayerProps) {
  const [embedBlocked, setEmbedBlocked] = useState(false);

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

  useEffect(() => {
    setEmbedBlocked(false);
  }, [videoId]);

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
