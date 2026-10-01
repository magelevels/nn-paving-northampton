import { env } from "cloudflare:workers";
import { checkOwnerAccess } from "../../../owner/access";

export async function GET() {
  const access = await checkOwnerAccess();
  if (!access.ok) return new Response(access.status === 503 ? "Owner access is not configured." : "Owner access required", { status: access.status });
  if (!env.DB) return Response.json({ error: "Owner data is temporarily unavailable." }, { status: 503 });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = await env.DB.prepare("SELECT event_name, source, COUNT(*) AS count FROM site_events WHERE created_at >= ? GROUP BY event_name, source ORDER BY count DESC").bind(since).all();
  return Response.json({ since, events: result.results }, { headers: { "Cache-Control": "no-store" } });
}
