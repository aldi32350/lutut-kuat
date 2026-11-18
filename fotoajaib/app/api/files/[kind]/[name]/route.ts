import { readFile } from "@/lib/storage";

export const runtime = "nodejs";

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function GET(req: Request, { params }: { params: { kind: string; name: string } }) {
  const data = await readFile(params.kind, params.name);
  if (!data) return new Response("Not found", { status: 404 });

  const ext = params.name.split(".").pop()!;
  const download = new URL(req.url).searchParams.get("download");

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      ...(download ? { "Content-Disposition": `attachment; filename="${download.replace(/[^\w.-]/g, "")}"` } : {}),
    },
  });
}
