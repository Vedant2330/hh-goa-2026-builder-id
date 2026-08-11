import { NextRequest, NextResponse } from "next/server";

/**
 * X API Media Upload & Post Creation Route
 * Uses X OAuth 2.0 / v1.1 media upload when environment credentials are fully configured.
 * Otherwise returns a clear status indicating API unconfigured so frontend activates the clean fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.X_CLIENT_ID || process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET || process.env.TWITTER_CLIENT_SECRET;

    // If X API credentials are unconfigured in environment
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error:
            "X API credentials (X_CLIENT_ID / X_CLIENT_SECRET) are unconfigured in environment.",
        },
        { status: 200 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = (formData.get("text") as string) || "HH Goa 2026 Builder ID #FrameInGoa";
    const accessToken = req.cookies.get("x_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          configured: true,
          authRequired: true,
          error: "X authorization required.",
        },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Media = buffer.toString("base64");

    // 1. Upload Media to X Media Upload API (v1.1 endpoint)
    const mediaUploadRes = await fetch(
      "https://upload.twitter.com/1.1/media/upload.json",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          media_data: base64Media,
        }),
      }
    );

    const mediaData = await mediaUploadRes.json();
    if (!mediaUploadRes.ok || !mediaData.media_id_string) {
      return NextResponse.json(
        {
          success: false,
          error: mediaData.errors?.[0]?.message || "Couldn't upload your Builder ID to X.",
        },
        { status: 500 }
      );
    }

    // 2. Create Post with Media ID attached via X API v2
    const postRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        media: {
          media_ids: [mediaData.media_id_string],
        },
      }),
    });

    const postData = await postRes.json();
    if (!postRes.ok || !postData.data?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            postData.detail ||
            "Your Builder ID was generated and uploaded, but X couldn't publish the post.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: postData.data.id,
      tweetUrl: `https://x.com/i/status/${postData.data.id}`,
    });
  } catch (err) {
    console.error("X Post API error:", err);
    return NextResponse.json(
      { success: false, error: "X API communication error." },
      { status: 500 }
    );
  }
}
