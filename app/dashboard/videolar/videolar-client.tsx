"use client";

import { useVideolarData } from "@/lib/swr/hooks";
import { VideoPlayer } from "./video-player";

export function VideolarClient() {
  const { data, error, isLoading, mutate } = useVideolarData();

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya internet bağlantınızı kontrol edin.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    );
  }

  const { videos, channels, savedVideos, savedIds } = data ?? {
    videos: [],
    channels: [],
    savedVideos: [],
    savedIds: [] as string[],
  };

  if (channels.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        Henüz kanal bulunmuyor. Admin panelinden YouTube kanalları ekleyebilirsiniz.
      </div>
    );
  }

  return (
    <VideoPlayer
      videos={videos}
      channels={channels}
      savedVideos={savedVideos}
      savedIds={savedIds}
      onMutate={mutate}
    />
  );
}
