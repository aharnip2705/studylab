import { NextRequest, NextResponse } from "next/server";

const INVIDIOUS =
  process.env.NEXT_PUBLIC_INVIDIOUS_INSTANCE?.replace(/\/$/, "") ||
  "https://invidious.fdn.fr";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "video_id_gerekli" }, { status: 400 });
  }

  try {
    const url = `${INVIDIOUS}/api/v1/videos/${encodeURIComponent(videoId)}?local=true`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error ?? "video_bulunamadi" },
        { status: res.status }
      );
    }

    const formatStreams = data.formatStreams ?? [];
    const adaptiveFormats = data.adaptiveFormats ?? [];
    const hlsUrl = data.hlsUrl ?? null;

    let streamUrl: string | null = null;
    let streamType: "progressive" | "hls" | "dash" = "progressive";

    if (formatStreams.length > 0) {
      const best =
        formatStreams
          .filter((f: { qualityLabel?: string }) =>
            ["720p", "480p", "360p"].includes(String(f.qualityLabel ?? ""))
          )
          .sort((a: { qualityLabel?: string }, b: { qualityLabel?: string }) => {
            const order = { "720p": 0, "480p": 1, "360p": 2 };
            return (
              (order[a.qualityLabel as keyof typeof order] ?? 99) -
              (order[b.qualityLabel as keyof typeof order] ?? 99)
            );
          })[0] ?? formatStreams[0];
      streamUrl = best.url;
      streamType = "progressive";
    } else if (hlsUrl) {
      streamUrl = hlsUrl;
      streamType = "hls";
    } else if (adaptiveFormats.length > 0) {
      const videoOnly = adaptiveFormats.filter(
        (f: { qualityLabel?: string }) => f.qualityLabel
      );
      const best =
        videoOnly
          .filter((f: { qualityLabel?: string }) =>
            ["720p", "480p", "360p"].includes(String(f.qualityLabel ?? ""))
          )
          .sort((a: { qualityLabel?: string }, b: { qualityLabel?: string }) => {
            const order = { "720p": 0, "480p": 1, "360p": 2 };
            return (
              (order[a.qualityLabel as keyof typeof order] ?? 99) -
              (order[b.qualityLabel as keyof typeof order] ?? 99)
            );
          })[0];
      if (best) streamUrl = best.url;
      else streamUrl = adaptiveFormats[0].url;
      streamType = "dash";
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: "stream_bulunamadi" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      streamUrl,
      streamType,
      title: data.title ?? "",
      lengthSeconds: data.lengthSeconds ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "fetch_hatasi" },
      { status: 500 }
    );
  }
}
