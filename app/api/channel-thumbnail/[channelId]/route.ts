import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const apiKey =
    process.env.YOUTUBE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY?.trim();

  if (!channelId) {
    return NextResponse.json({ error: "no_channel" }, { status: 404 });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "no_api_key",
        message:
          "YouTube API anahtarı bulunamadı. .env.local veya hosting ortam değişkenlerine YOUTUBE_API_KEY ekleyin.",
      },
      { status: 404 }
    );
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?id=${encodeURIComponent(channelId)}&key=${apiKey}&part=snippet&fields=items(snippet(thumbnails))`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24h cache
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: "api_error" }, { status: 404 });
    }

    const thumbnail =
      data.items?.[0]?.snippet?.thumbnails?.default?.url ||
      data.items?.[0]?.snippet?.thumbnails?.medium?.url ||
      data.items?.[0]?.snippet?.thumbnails?.high?.url;

    if (!thumbnail) {
      return NextResponse.json({ error: "no_thumbnail" }, { status: 404 });
    }

    return NextResponse.redirect(thumbnail, { status: 307 });
  } catch {
    return NextResponse.json({ error: "fetch_error" }, { status: 500 });
  }
}
