"use client";

import { useState } from "react";

const INVIDIOUS_INSTANCES = [
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
  "https://inv.nadeko.net",
];

interface InvidiousPlayerProps {
  videoId: string;
  title: string;
  onError?: (message: string) => void;
}

export function InvidiousPlayer({ videoId, title }: InvidiousPlayerProps) {
  const customInstance = process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE?.replace(/\/$/, "");
  const instances = customInstance ? [customInstance] : INVIDIOUS_INSTANCES;

  const [instanceIndex, setInstanceIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const currentInstance = instances[instanceIndex];
  const embedUrl = currentInstance
    ? `${currentInstance}/embed/${videoId}?autoplay=1&hl=tr`
    : null;

  function handleIframeError() {
    if (instanceIndex + 1 < instances.length) {
      setInstanceIndex((i) => i + 1);
    } else {
      setAllFailed(true);
    }
  }

  if (allFailed || !embedUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <p className="font-medium text-white">Video yüklenemedi</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            YouTube&apos;da İzle
          </a>
          {instances.map((base) => (
            <a
              key={base}
              href={`${base}/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              {new URL(base).hostname}&apos;da İzle
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-t-xl">
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={title}
        referrerPolicy="no-referrer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="h-full w-full border-0"
        onError={handleIframeError}
      />
    </div>
  );
}
