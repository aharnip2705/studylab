"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Search,
  Bookmark,
  BookmarkCheck,
  Radio,
  List,
  X,
  PlayCircle,
  Youtube,
  ListVideo,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { toggleSaveVideo, savePlaylistVideo } from "@/lib/actions/saved-videos";

type SubjectLike = { name: string } | { name: string }[] | null;

interface Video {
  id: string;
  video_id: string;
  title: string;
  topic: string | null;
  duration_seconds: number | null;
  subject_id: string;
  channel_id?: string;
  channel_name?: string;
  subjects: SubjectLike;
}

interface Channel {
  id: string;
  channel_id: string;
  channel_name: string;
  subject_id: string | null;
  subjects: SubjectLike;
}

function getSubjectName(s: SubjectLike): string {
  if (!s) return "";
  return Array.isArray(s) ? s[0]?.name ?? "" : s.name ?? "";
}

interface VideoPlayerProps {
  videos: Video[];
  channels: Channel[];
  savedVideos: Video[];
  savedIds: string[];
  onMutate?: () => void;
}

function formatDuration(sec: number | null) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface YtPlaylist {
  id: string;
  title: string;
  thumbnail: string | null;
  itemCount: number | null;
}

interface YtPlaylistItem {
  videoId: string;
  title: string;
  thumbnail: string | null;
  position: number;
}

type ModalView =
  | { kind: "tabs" }
  | { kind: "playlist-videos"; playlist: YtPlaylist };

/** Kanal içeriği modal — Kayıtlı Videolar + Oynatma Listeleri */
function ChannelModal({
  channel,
  videos,
  savedIds,
  isSavedCheck,
  onPlay,
  onPlayFromPlaylist,
  onClose,
  onToggleSave,
  onSavePlaylistVideo,
  savedVideos: modalSavedVideos,
}: {
  channel: Channel;
  videos: Video[];
  savedIds: string[];
  isSavedCheck?: (id: string) => boolean;
  onPlay: (v: Video) => void;
  onPlayFromPlaylist: (videoId: string, title: string) => void;
  onClose: () => void;
  onToggleSave: (v: Video) => void;
  onSavePlaylistVideo: (videoId: string, title: string, youtubeRowId?: string) => Promise<unknown>;
  savedVideos: Video[];
}) {
  const checkSaved = isSavedCheck ?? ((id: string) => savedIds.includes(id));
  const [tab, setTab] = useState<"saved" | "playlists">("saved");
  const [view, setView] = useState<ModalView>({ kind: "tabs" });

  // Oynatma listeleri
  const [playlists, setPlaylists] = useState<YtPlaylist[]>([]);
  const [playlistsStatus, setPlaylistsStatus] = useState<"idle" | "loading" | "done" | "no_key" | "error">("idle");

  // Oynatma listesi videoları
  const [playlistItems, setPlaylistItems] = useState<YtPlaylistItem[]>([]);
  const [itemsStatus, setItemsStatus] = useState<
    "idle" | "loading" | "done" | "no_key" | "error"
  >("idle");

  const channelVideos = videos.filter((v) => v.channel_id === channel.channel_id);

  const fetchPlaylists = useCallback(async () => {
    if (playlistsStatus !== "idle") return;
    setPlaylistsStatus("loading");
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(channel.channel_id)}`);
      const data = await res.json();
      if (data.error === "no_api_key") { setPlaylistsStatus("no_key"); return; }
      if (data.error) { setPlaylistsStatus("error"); return; }
      setPlaylists(data.items ?? []);
      setPlaylistsStatus("done");
    } catch {
      setPlaylistsStatus("error");
    }
  }, [channel.channel_id, playlistsStatus]);

  const fetchPlaylistItems = useCallback(async (playlistId: string) => {
    setItemsStatus("loading");
    setPlaylistItems([]);
    try {
      const res = await fetch(`/api/playlist-items/${encodeURIComponent(playlistId)}`);
      const data = await res.json();
      if (data.error === "no_api_key") { setItemsStatus("no_key"); return; }
      if (data.error) { setItemsStatus("error"); return; }
      setPlaylistItems(data.items ?? []);
      setItemsStatus("done");
    } catch {
      setItemsStatus("error");
    }
  }, []);

  useEffect(() => {
    if (tab === "playlists") fetchPlaylists();
  }, [tab, fetchPlaylists]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view.kind === "playlist-videos") { setView({ kind: "tabs" }); return; }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, view]);

  function openPlaylist(pl: YtPlaylist) {
    setView({ kind: "playlist-videos", playlist: pl });
    setItemsStatus("idle");
    fetchPlaylistItems(pl.id);
  }

  function openVideo(item: YtPlaylistItem) {
    onPlayFromPlaylist(item.videoId, item.title);
    onClose();
  }

  const headerTitle =
    view.kind === "tabs" ? channel.channel_name : view.playlist.title;

  const handleBack = () => {
    if (view.kind === "playlist-videos") setView({ kind: "tabs" });
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="animate-modal-in relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            {view.kind !== "tabs" ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                {headerTitle}
              </h3>
              {view.kind === "tabs" && getSubjectName(channel.subjects) && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getSubjectName(channel.subjects)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* --- Oynatma listesi videoları --- */}
        {view.kind === "playlist-videos" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {itemsStatus === "loading" && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}
            {itemsStatus === "error" && (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-red-500">Videolar yüklenemedi.</p>
              </div>
            )}
                  {itemsStatus === "no_key" && (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <ListVideo className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        YouTube API anahtarı gerekli
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">YOUTUBE_API_KEY</code>{" "}
                        (veya{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">NEXT_PUBLIC_YOUTUBE_API_KEY</code>){" "}
                        hosting ortam değişkenlerinde tanımlı olsun.
                      </p>
                    </div>
                  )}
            {itemsStatus === "done" && playlistItems.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-slate-500 dark:text-slate-400">Bu oynatma listesi boş.</p>
              </div>
            )}
            {itemsStatus === "done" && playlistItems.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {playlistItems.map((item, i) => {
                  const sv = modalSavedVideos.find((v) => v.video_id === item.videoId);
                  return (
                    <div
                      key={item.videoId + i}
                      className="flex w-full items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <button
                        type="button"
                        onClick={() => openVideo(item)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div className="relative shrink-0 overflow-hidden rounded-lg">
                          {item.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="h-12 w-20 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-20 items-center justify-center bg-slate-200 dark:bg-slate-700">
                              <Play className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                            {item.position + 1}
                          </div>
                        </div>
                        <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.title}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSavePlaylistVideo(item.videoId, item.title, sv?.id)}
                        className="shrink-0 rounded p-1.5"
                        title={sv ? "Kayıttan çıkar" : "Kaydet"}
                      >
                        {sv ? (
                          <BookmarkCheck className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-slate-400 hover:text-amber-500" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- Ana görünüm (sekmeler) --- */}
        {view.kind === "tabs" && (
          <>
            <div className="flex shrink-0 gap-0 border-b border-slate-200 px-4 pt-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTab("saved")}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "saved"
                    ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                Kayıtlı Videolar
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                  {channelVideos.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("playlists")}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "playlists"
                    ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <ListVideo className="h-3.5 w-3.5" />
                Oynatma Listeleri
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Kayıtlı Videolar */}
              {tab === "saved" && (
                channelVideos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <PlayCircle className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Bu kanal için henüz kayıtlı video yok.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {channelVideos.map((v) => (
                      <div key={v.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <button
                          type="button"
                          onClick={() => onPlay(v)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Play className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                              {v.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {getSubjectName(v.subjects)}
                              {v.topic && ` • ${v.topic}`}
                              {v.duration_seconds && ` • ${formatDuration(v.duration_seconds)}`}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleSave(v)}
                          className="shrink-0 rounded p-1.5"
                          title={checkSaved(v.id) ? "Kayıttan çıkar" : "Kaydet"}
                        >
                          {checkSaved(v.id) ? (
                            <BookmarkCheck className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Bookmark className="h-5 w-5 text-slate-400 hover:text-amber-500" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Oynatma Listeleri */}
              {tab === "playlists" && (
                <>
                  {playlistsStatus === "loading" && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  {playlistsStatus === "no_key" && (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <ListVideo className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        YouTube API anahtarı gerekli
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">.env.local</code> veya hosting ortam değişkenlerine{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">YOUTUBE_API_KEY</code> ekleyin.
                      </p>
                    </div>
                  )}
                  {playlistsStatus === "error" && (
                    <div className="flex items-center justify-center py-16">
                      <p className="text-sm text-red-500">Oynatma listeleri alınamadı.</p>
                    </div>
                  )}
                  {playlistsStatus === "done" && playlists.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ListVideo className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Bu kanalda herkese açık oynatma listesi yok.
                      </p>
                    </div>
                  )}
                  {playlistsStatus === "done" && playlists.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => openPlaylist(pl)}
                          className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                            {pl.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pl.thumbnail}
                                alt={pl.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ListVideo className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-black/60 p-2">
                                <Play className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                              {pl.title}
                            </p>
                            {pl.itemCount !== null && (
                              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                {pl.itemCount} video
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function VideoPlayer({
  videos,
  channels,
  savedVideos,
  savedIds,
  onMutate,
}: VideoPlayerProps) {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [channelModalTarget, setChannelModalTarget] = useState<Channel | null>(null);
  const channelsRef = useRef<HTMLDivElement>(null);
  const playlistRef = useRef<HTMLDivElement>(null);

  const videosByChannel = useMemo(() => {
    if (!selectedChannelId) return videos;
    const ch = channels.find((c) => c.id === selectedChannelId);
    if (!ch) return videos;
    return videos.filter((v) => v.channel_id === ch.channel_id);
  }, [videos, channels, selectedChannelId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (channelsOpen && channelsRef.current && !channelsRef.current.contains(target))
        setChannelsOpen(false);
      if (playlistOpen && playlistRef.current && !playlistRef.current.contains(target))
        setPlaylistOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [channelsOpen, playlistOpen]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { channels: [] as Channel[], videos: [] as Video[] };
    const words = q.split(/\s+/).filter(Boolean);
    const matchingChannels = channels.filter((c) =>
      words.every((w) => (c.channel_name ?? "").toLowerCase().includes(w))
    );
    const matchingChannelIds = new Set(matchingChannels.map((c) => c.channel_id));
    const matchingVideos = videos.filter(
      (v) =>
        words.every((w) => (v.title ?? "").toLowerCase().includes(w)) ||
        (v.channel_id && matchingChannelIds.has(v.channel_id))
    );
    // Don't double-list videos that belong to matching channels
    const channelOnlyVideos = matchingVideos.filter(
      (v) => !v.channel_id || !matchingChannelIds.has(v.channel_id)
    );
    return { channels: matchingChannels, videos: channelOnlyVideos };
  }, [videos, channels, searchQuery]);

  const showSearchResults = searchFocused && searchQuery.trim().length > 0;
  const filteredVideos = searchResults.videos;
  const filteredChannels = searchResults.channels;

  // Optimistic UI: anlık görünüm için lokal state
  const [optimisticRemoved, setOptimisticRemoved] = useState<Set<string>>(new Set());
  const [optimisticAdded, setOptimisticAdded] = useState<Set<string>>(new Set());

  const isSaved = useCallback(
    (id: string) => {
      const wasSaved = savedIds.includes(id);
      if (optimisticRemoved.has(id)) return false;
      if (optimisticAdded.has(id)) return true;
      return wasSaved;
    },
    [savedIds, optimisticRemoved, optimisticAdded]
  );

  function selectVideo(v: Video) {
    setEmbedBlocked(false);
    setSelectedVideo(v);
  }

  async function handleToggleSave(v: Video) {
    const wasSaved = savedIds.includes(v.id);
    if (wasSaved) {
      setOptimisticRemoved((prev) => new Set(prev).add(v.id));
    } else {
      setOptimisticAdded((prev) => new Set(prev).add(v.id));
    }
    const res = await toggleSaveVideo(v.id);
    if (res.error) {
      setOptimisticRemoved((prev) => {
        const next = new Set(prev);
        next.delete(v.id);
        return next;
      });
      setOptimisticAdded((prev) => {
        const next = new Set(prev);
        next.delete(v.id);
        return next;
      });
      return;
    }
    setOptimisticRemoved((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
    setOptimisticAdded((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
    onMutate?.() ?? router.refresh();
  }

  // Detect YouTube embed blocked via postMessage (error codes 101, 150)
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onError" && (data?.info === 101 || data?.info === 150)) {
          setEmbedBlocked(true);
        }
      } catch { /* ignore */ }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handlePlayFromModal(v: Video) {
    setEmbedBlocked(false);
    setSelectedVideo(v);
    setChannelModalTarget(null);
  }

  function handlePlayFromPlaylist(videoId: string, title: string) {
    setEmbedBlocked(false);
    setSelectedVideo({
      id: `yt-${videoId}`,
      video_id: videoId,
      title,
      topic: null,
      duration_seconds: null,
      subject_id: "",
      subjects: null,
    });
    setChannelModalTarget(null);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sol: Arama + Kanallar + Oynatma Listesi */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-md">
        {/* Arama */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Kanal arayın"
              className="w-full rounded-xl border-0 bg-transparent py-3 pr-4 text-slate-900 placeholder-slate-400 focus:ring-0 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filteredChannels.length === 0 && filteredVideos.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Sonuç bulunamadı
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredChannels.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Kanallar
                      </div>
                      {filteredChannels.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setChannelModalTarget(c);
                            setSearchQuery("");
                            setSearchFocused(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/channel-thumbnail/${encodeURIComponent(c.channel_id)}`}
                              alt={c.channel_name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                              {c.channel_name}
                            </p>
                            {getSubjectName(c.subjects) && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{getSubjectName(c.subjects)}</p>
                            )}
                          </div>
                          <Youtube className="h-4 w-4 shrink-0 text-red-500" />
                        </button>
                      ))}
                    </>
                  )}
                  {filteredVideos.length > 0 && (
                    <>
                      {filteredChannels.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Videolar
                        </div>
                      )}
                      {filteredVideos.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVideo(v);
                              setSearchQuery("");
                              setSearchFocused(false);
                            }}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
                              <Play className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {v.title}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                {getSubjectName(v.subjects) || "Ders"}
                                {v.topic && ` • ${v.topic}`}
                                {v.duration_seconds && (
                                  <span> • {formatDuration(v.duration_seconds)}</span>
                                )}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(v);
                            }}
                            className="shrink-0 rounded p-1.5"
                            title={isSaved(v.id) ? "Kayıttan çıkar" : "Kaydet"}
                          >
                            {isSaved(v.id) ? (
                              <BookmarkCheck className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Bookmark className="h-5 w-5 text-slate-400 hover:text-amber-500" />
                            )}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kanallar */}
        <div className="relative" ref={channelsRef}>
          <button
            type="button"
            onClick={() => {
              setChannelsOpen((o) => !o);
              setPlaylistOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Radio className="h-4 w-4" />
              Kanallar
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
              {channels.length}
            </span>
          </button>
          {channelsOpen && (
            <div className="animate-dropdown-in absolute top-full left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {channels.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Henüz kanal eklenmemiş.
                </p>
              ) : (
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChannelId(null);
                      setChannelsOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                      !selectedChannelId
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Tüm videolar
                  </button>
                  {channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setChannelModalTarget(c);
                        setChannelsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/channel-thumbnail/${encodeURIComponent(c.channel_id)}`}
                          alt={c.channel_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                        <div
                          className="absolute inset-0 hidden items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
                          style={{ display: "none" }}
                        >
                          <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <span className="truncate text-sm text-slate-800 dark:text-slate-200">
                        {c.channel_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kayıtlı oynatma listesi */}
        <div className="relative" ref={playlistRef}>
          <button
            type="button"
            onClick={() => {
              setPlaylistOpen((o) => !o);
              setChannelsOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <List className="h-4 w-4" />
              Kayıtlı Videolarım
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {savedVideos.length}
            </span>
          </button>
          {playlistOpen && (
            <div className="animate-dropdown-in absolute top-full left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {savedVideos.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Henüz kaydedilmiş video yok.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2">
                  {savedVideos.map((v) => (
                    <div
                      key={v.id}
                      className={`flex items-start gap-3 rounded-lg px-2 py-2 ${
                        selectedVideo?.id === v.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectVideo(v);
                          setPlaylistOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
                          <Play className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {v.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {getSubjectName(v.subjects)}
                            {v.topic && ` • ${v.topic}`}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(v)}
                        className="shrink-0 rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        title="Kayıttan çıkar"
                      >
                        <BookmarkCheck className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kanal İçeriği Modal */}
      {channelModalTarget && (
        <ChannelModal
          channel={channelModalTarget}
          videos={videos}
          savedIds={savedIds}
          isSavedCheck={isSaved}
          savedVideos={savedVideos}
          onPlay={handlePlayFromModal}
          onPlayFromPlaylist={handlePlayFromPlaylist}
          onClose={() => setChannelModalTarget(null)}
          onToggleSave={handleToggleSave}
          onSavePlaylistVideo={async (videoId, title, youtubeRowId) => {
            if (youtubeRowId) {
              const res = await toggleSaveVideo(youtubeRowId);
              if (!res.error) onMutate?.() ?? router.refresh();
            } else {
              const res = await savePlaylistVideo(videoId, title);
              if (!res.error) onMutate?.() ?? router.refresh();
            }
          }}
        />
      )}

      {/* Sağ: Embed player */}
      <div className="flex-1">
        <div className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
          {selectedVideo ? (
            <>
              <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                {embedBlocked ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
                    <Youtube className="h-12 w-12 text-red-500" />
                    <div>
                      <p className="font-semibold text-white">Bu video embed'e kapalı</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Kanal sahibi bu videoyu dış sitelerde oynatmayı kapatmış.
                      </p>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${selectedVideo.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                    >
                      <Youtube className="h-4 w-4" />
                      YouTube&apos;da İzle
                    </a>
                  </div>
                ) : (
                  <iframe
                    key={selectedVideo.video_id}
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.video_id}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    onLoad={() => setEmbedBlocked(false)}
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-slate-700 bg-slate-900 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{selectedVideo.title}</p>
                  <p className="text-sm text-slate-400">
                    {getSubjectName(selectedVideo.subjects)}
                    {selectedVideo.topic && ` • ${selectedVideo.topic}`}
                  </p>
                </div>
                {selectedVideo.id.startsWith("yt-") ? (
                  (() => {
                    const saved = savedVideos.find((v) => v.video_id === selectedVideo.video_id);
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          if (saved) {
                            const res = await toggleSaveVideo(saved.id);
                            if (!res.error) onMutate?.() ?? router.refresh();
                          } else {
                            const res = await savePlaylistVideo(selectedVideo.video_id, selectedVideo.title);
                            if (!res.error) onMutate?.() ?? router.refresh();
                          }
                        }}
                        className="shrink-0 rounded p-2 transition-colors hover:bg-slate-800"
                        title={saved ? "Kayıttan çıkar" : "Kaydet"}
                      >
                        {saved ? (
                          <BookmarkCheck className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-slate-400 hover:text-amber-500" />
                        )}
                      </button>
                    );
                  })()
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleSave(selectedVideo)}
                    className="shrink-0 rounded p-2 transition-colors hover:bg-slate-800"
                    title={isSaved(selectedVideo.id) ? "Kayıttan çıkar" : "Kaydet"}
                  >
                    {isSaved(selectedVideo.id) ? (
                      <BookmarkCheck className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Bookmark className="h-5 w-5 text-slate-400 hover:text-amber-500" />
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-slate-900">
              <div className="text-center text-slate-500">
                <Search className="mx-auto mb-2 h-12 w-12" />
                <p className="text-sm">Arama yapın veya kaydedilenlerden seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
