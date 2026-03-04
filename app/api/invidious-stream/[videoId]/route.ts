import { NextRequest, NextResponse } from "next/server";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
];

function parseStream(data: {
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "video_id_gerekli" }, { status: 400 });
  }

  const customInstance = process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE?.replace(/\/$/, "");
  const instances = customInstance ? [customInstance] : INVIDIOUS_INSTANCES;

  for (const base of instances) {
    try {
      const url = `${base}/api/v1/videos/${encodeURIComponent(videoId)}?local=true`;
      const res = await fetch(url, {
        next: { revalidate: 300 },
        headers: { "User-Agent": "StudyLab/1.0 (https://studylab.tr)" },
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === "videoNotFound" || data.error === "videoUnavailable") {
          return NextResponse.json({ error: "video_bulunamadi" }, { status: 404 });
        }
        continue;
      }

      const parsed = parseStream(data);
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

  return NextResponse.json(
    { error: "fetch_hatasi" },
    { status: 502 }
  );
}
