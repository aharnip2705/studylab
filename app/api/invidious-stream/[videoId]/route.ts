import { NextRequest, NextResponse } from "next/server";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
  "https://vid.puffyan.us",
  "https://invidious.flokinet.to",
  "https://invidious.slipfox.xyz",
  "https://yt.artemislena.eu",
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.leptons.xyz",
  "https://api.piped.yt",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.drgns.space",
  "https://piped-api.privacy.com.de",
];

function parseInvidiousStream(data: {
  formatStreams?: Array<{ url: string; qualityLabel?: string }>;
  adaptiveFormats?: Array<{ url: string; qualityLabel?: string }>;
  hlsUrl?: string;
}): { streamUrl: string; streamType: "progressive" | "hls" | "dash"; title?: string; lengthSeconds?: number } | null {
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

function parsePipedStream(data: {
  videoStreams?: Array<{ url: string; quality?: string }>;
  hls?: string | null;
  dash?: string | null;
}): { streamUrl: string; streamType: "progressive" | "hls" | "dash"; title?: string; lengthSeconds?: number } | null {
  const videoStreams = data.videoStreams ?? [];
  const hls = data.hls ?? null;
  const dash = data.dash ?? null;

  if (videoStreams.length > 0) {
    const best =
      videoStreams
        .filter((f) =>
          ["720p", "480p", "360p"].includes(String(f.quality ?? ""))
        )
        .sort((a, b) => {
          const order: Record<string, number> = { "720p": 0, "480p": 1, "360p": 2 };
          return (order[a.quality ?? ""] ?? 99) - (order[b.quality ?? ""] ?? 99);
        })[0] ?? videoStreams[0];
    return { streamUrl: best.url, streamType: "progressive" };
  }
  if (hls) {
    return { streamUrl: hls, streamType: "hls" };
  }
  if (dash) {
    return { streamUrl: dash, streamType: "dash" };
  }
  return null;
}

const UA = "StudyLab/1.0 (https://studylab.tr)";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "video_id_gerekli" }, { status: 400 });
  }

  const customInstance = process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE?.replace(/\/$/, "");
  const invidiousList = customInstance ? [customInstance] : INVIDIOUS_INSTANCES;

  for (const base of invidiousList) {
    try {
      const url = `${base}/api/v1/videos/${encodeURIComponent(videoId)}?local=true`;
      const res = await fetch(url, {
        next: { revalidate: 300 },
        headers: { "User-Agent": UA },
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === "videoNotFound" || data.error === "videoUnavailable") {
          return NextResponse.json({ error: "video_bulunamadi" }, { status: 404 });
        }
        continue;
      }

      const parsed = parseInvidiousStream(data);
      if (parsed) {
        return NextResponse.json({
          ...parsed,
          title: data.title ?? "",
          lengthSeconds: data.lengthSeconds ?? 0,
        });
      }
    } catch {
      continue;
    }
  }

  for (const base of PIPED_INSTANCES) {
    try {
      const url = `${base}/streams/${encodeURIComponent(videoId)}`;
      const res = await fetch(url, {
        next: { revalidate: 300 },
        headers: { "User-Agent": UA },
      });
      const data = await res.json();

      if (!res.ok) continue;

      const parsed = parsePipedStream(data);
      if (parsed) {
        return NextResponse.json({
          ...parsed,
          title: data.title ?? "",
          lengthSeconds: data.duration ?? 0,
        });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { error: "fetch_hatasi" },
    { status: 502 }
  );
}
