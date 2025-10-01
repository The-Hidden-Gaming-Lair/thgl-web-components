import { put, list, ListBlobResult } from "@vercel/blob";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return Response.json(
      { error: "No filename provided" },
      { status: 400, headers },
    );
  }
  if (!request.body) {
    return Response.json(
      { error: "No body provided" },
      { status: 400, headers },
    );
  }
  const existingName = filename.split("/shared-filters/")[1];
  const name = existingName || filename;
  const blob = await put(`/shared-filters/${name}`, request.body, {
    access: "public",
    contentType: "application/json",
    cacheControlMaxAge: 0,
    addRandomSuffix: !existingName,
    allowOverwrite: true,
  });

  return Response.json(blob, { headers });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return Response.json(
      { error: "No code provided" },
      { status: 400, headers },
    );
  }

  let hasMore = true;
  let cursor;
  while (hasMore) {
    const listResult: ListBlobResult = await list({
      prefix: "shared-filters/",
      cursor,
    });
    hasMore = listResult.hasMore;
    cursor = listResult.cursor;
    const blobs = listResult.blobs;
    const blob = blobs.find((blob) => blob.url.endsWith(code));
    if (blob) {
      return Response.json(blob, { headers });
    }
  }
  return Response.json(
    { error: "No shared filters found" },
    { status: 404, headers },
  );
}

export async function OPTIONS() {
  return Response.json({}, { headers });
}
