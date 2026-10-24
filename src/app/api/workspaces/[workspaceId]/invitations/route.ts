import { NextRequest } from "next/server";
import { POST as handlePost, GET as handleGet } from "@/app/api/workspace/invitations/route";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const url = new URL(req.url);
  url.searchParams.set("workspaceId", workspaceId);
  const forwardedReq = new NextRequest(url, { headers: req.headers });
  return handleGet(forwardedReq);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const enrichedBody = { ...body, workspaceId };
  
  const forwardedReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(enrichedBody),
  });

  return handlePost(forwardedReq);
}
