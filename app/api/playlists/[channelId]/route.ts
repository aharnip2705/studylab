import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
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
    const url = `https://www.googleapis.com/youtube/v3/playlists?channelId=${encodeURIComponent(channelId)}&key=${apiKey}&part=snippet,contentDetails&maxResults=50`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message ?? "api_error", items: [] });
    }

    const items = (data.items ?? []).map((item: {
      id: string;
      snippet: { title: string; thumbnails?: { medium?: { url: string } } };
      contentDetails?: { itemCount?: number };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
      itemCount: item.contentDetails?.itemCount ?? null,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "fetch_error", items: [] });
  }
}
