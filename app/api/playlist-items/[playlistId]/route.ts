import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const { playlistId } = await params;
  const apiKey =
    process.env.YOUTUBE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      error: "no_api_key",
      items: [],
      message:
        "YouTube API anahtarı bulunamadı. .env.local veya hosting ortam değişkenlerine YOUTUBE_API_KEY ekleyin.",
    });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${encodeURIComponent(playlistId)}&key=${apiKey}&part=snippet&maxResults=50`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message ?? "api_error", items: [] });
    }

    const items = (data.items ?? [])
      .filter((item: { snippet: { resourceId?: { videoId?: string } } }) =>
        item.snippet?.resourceId?.videoId
      )
      .map((item: {
        snippet: {
          title: string;
          resourceId: { videoId: string };
          thumbnails?: { medium?: { url: string } };
          position: number;
        };
      }) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
        position: item.snippet.position,
      }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "fetch_error", items: [] });
  }
}
